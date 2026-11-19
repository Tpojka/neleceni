/**
 * Content script for youtube.com. Every `intervalMs` it crops the caption area of the playing
 * video, sends it to the extension's OCR (offscreen document), and mutes or un-mutes the video
 * through Web Audio. Works the same on live streams and on replays.
 */
import { classify, type Observation } from '../shared/match.ts';
import type { OcrRequest, OcrResponse, StatusMessage, TabStatus, ToContent } from '../shared/messages.ts';
import { resolveLang, t, type Lang } from '../shared/i18n.ts';
import { initialState, isMuted, step, toggle, type MuteState } from '../shared/state.ts';
import { DEFAULT_SETTINGS, loadSettings, onSettingsChanged, type Settings } from '../shared/settings.ts';
import { AudioGate } from './audio.ts';
import { captureCaption, signatureDistance, type Capture } from './capture.ts';
import { channelMatches, currentVideoId, ownerChannels } from './channel.ts';
import { Overlay } from './overlay.ts';

const TAG = '[neleceni]';
/** Below this share of white pixels there is no caption to read. */
const MIN_INK = 0.002;
/** Signatures closer than this are treated as the same caption image. */
const SAME_IMAGE = 0.01;
/**
 * A decisive reading (target / other) of an unchanged image is reused for at most this long.
 * Unreadable images are never reused: the next frame may read fine (OCR takes ~20–110 ms).
 */
const MAX_REUSE_MS = 5_000;

let settings: Settings = DEFAULT_SETTINGS;
let state: MuteState = initialState();
const gate = new AudioGate();
const overlay = new Overlay(() => manualToggle());

let timer: ReturnType<typeof setTimeout> | undefined;
let busy = false;
let dead = false;
let error = '';

/** Video the state belongs to; a new video (or a seek) starts from a clean state. */
let trackedVideo: HTMLVideoElement | null = null;
let trackedId: string | null = null;
let trackedSrc = '';
/** Cached channel decision for the tracked video. */
let channelOk: boolean | null = null;

let lastSig: Uint8Array | null = null;
let lastSigAt = 0;
let lastObs: Observation = { kind: 'none' };
let lastCapture: Capture | null = null;
let lastOcrText = '';
let lastBadge = '';

const lang = (): Lang => resolveLang(settings.language);

const mainVideo = (): HTMLVideoElement | null =>
  document.querySelector<HTMLVideoElement>('#movie_player video.html5-main-video') ??
  document.querySelector<HTMLVideoElement>('#movie_player video');

function resetState(): void {
  if (isMuted(state) && trackedVideo) gate.set(trackedVideo, false);
  state = initialState();
  lastSig = null;
  lastObs = { kind: 'none' };
  lastOcrText = '';
  lastCapture = null;
}

function onSeeked(): void {
  // Replays: the caption at the new position decides, not what was on screen before the jump.
  resetState();
  schedule(50);
}

function track(video: HTMLVideoElement, id: string | null): void {
  if (video === trackedVideo && id === trackedId) return;
  resetState();
  trackedVideo?.removeEventListener('seeked', onSeeked);
  video.addEventListener('seeked', onSeeked);
  trackedVideo = video;
  trackedId = id;
  trackedSrc = video.currentSrc;
  channelOk = null;
}

/** Is the video in this tab one we should watch? null = can't tell yet. */
function isWatchedVideo(video: HTMLVideoElement): boolean | null {
  const id = currentVideoId();
  if (id) {
    track(video, id);
    if (channelOk === null) {
      const owners = ownerChannels(id);
      if (owners) channelOk = channelMatches(owners, settings.channels);
    }
    return channelOk;
  }
  // Not on a watch page (e.g. miniplayer while browsing): keep the decision while the same
  // stream keeps playing in the same element.
  if (video === trackedVideo && video.currentSrc === trackedSrc) return channelOk;
  return false;
}

/**
 * May the last reading stand in for a new one? A target reading may (it only keeps the mute on).
 * Another-speaker readings count towards un-muting, so while muted each one must be a fresh OCR
 * result; otherwise one misread of a still image would add up to all the confirmations.
 */
function canReuse(o: Observation): boolean {
  if (o.kind === 'target') return true;
  return o.kind === 'other' && !isMuted(state) && state.override === null;
}

async function ocr(image: string): Promise<OcrResponse> {
  const req: OcrRequest = { type: 'ocr', image, langs: settings.langs };
  return (await chrome.runtime.sendMessage(req)) as OcrResponse;
}

async function tick(): Promise<void> {
  const video = mainVideo();
  const player = document.getElementById('movie_player');
  if (!settings.enabled || !video || !player) {
    stopActing();
    return;
  }
  const watched = isWatchedVideo(video);
  if (!watched) {
    stopActing();
    return;
  }
  if (video.paused || video.ended) {
    render(player);
    return;
  }

  const cap = captureCaption(video, settings.region, settings.whiteThreshold);
  if (!cap) return;
  lastCapture = cap;

  let obs: Observation;
  const now = Date.now();
  if (cap.ink < MIN_INK) {
    obs = { kind: 'none' };
    lastOcrText = t(lang(), 'debugNoCaption');
  } else if (
    canReuse(lastObs) &&
    lastSig &&
    signatureDistance(lastSig, cap.signature) < SAME_IMAGE &&
    now - lastSigAt < MAX_REUSE_MS
  ) {
    obs = lastObs;
  } else {
    const res = await ocr(cap.dataUrl);
    if (!res.ok) throw new Error(res.error);
    obs = classify(res.lines, settings.speakers, settings.minConfidence, settings.groups);
    lastSig = cap.signature;
    lastSigAt = now;
    lastOcrText =
      res.lines
        .map((l) => `${Math.round(l.confidence).toString().padStart(3)}%  y${l.y0}-${l.y1}  ${l.text}`)
        .join('\n') +
      `\n→ ${obs.kind}  (${res.ms} ms)`;
  }
  // The video may have changed while OCR was running.
  if (video !== trackedVideo || mainVideo() !== video) return;

  const wasMuted = isMuted(state);
  lastObs = obs;
  state = step(state, obs, now, settings);
  const muted = isMuted(state);
  if (muted !== wasMuted) {
    console.info(TAG, muted ? 'mute' : 'unmute', obs.kind === 'none' ? '' : `· ${obs.line}`);
  }
  gate.set(video, muted);
  error = '';
  render(player);
}

function render(player: HTMLElement): void {
  const muted = isMuted(state);
  report(true, muted);
  if (!settings.showBadge) {
    overlay.hide();
    return;
  }
  const l = lang();
  const note = error ? t(l, 'noteOcrError', { error }) : gate.needsGesture ? t(l, 'noteNeedsClick') : '';
  overlay.show(player, {
    lang: l,
    muted,
    manual: state.override !== null,
    line: state.lastLine,
    note,
    ...(settings.debug
      ? {
          debugImage: lastCapture?.dataUrl ?? '',
          debugText: `${lastOcrText}\n${trackedVideo ? gate.describe(trackedVideo) : ''}`,
        }
      : {}),
  });
}

function stopActing(): void {
  if (trackedVideo && isMuted(state)) gate.set(trackedVideo, false);
  state = initialState();
  overlay.hide();
  report(false, false);
}

function report(active: boolean, muted: boolean): void {
  const badge = active ? t(lang(), muted ? 'badgeMuted' : 'badgeOn') : '';
  const key = `${active}:${muted}:${badge}`;
  if (key === lastBadge || dead) return;
  lastBadge = key;
  const msg: StatusMessage = { type: 'status', active, muted, badge };
  chrome.runtime.sendMessage(msg).catch(() => {});
}

function manualToggle(): void {
  const video = mainVideo();
  const player = document.getElementById('movie_player');
  if (!video || !player || !settings.enabled || !isWatchedVideo(video)) return;
  state = toggle(state);
  gate.set(video, isMuted(state));
  render(player);
}

function schedule(ms = settings.intervalMs): void {
  if (dead) return;
  clearTimeout(timer);
  timer = setTimeout(run, ms);
}

async function run(): Promise<void> {
  if (busy) return schedule();
  busy = true;
  try {
    await tick();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/Extension context invalidated/i.test(msg)) {
      // Extension was reloaded or removed: give the audio back and stop.
      dead = true;
      if (trackedVideo) gate.set(trackedVideo, false);
      overlay.hide();
      return;
    }
    error = msg;
    console.warn(TAG, err);
    const player = document.getElementById('movie_player');
    if (player) render(player);
  } finally {
    busy = false;
  }
  schedule();
}

function status(): TabStatus {
  const video = mainVideo();
  const active = !!video && settings.enabled && isWatchedVideo(video) === true;
  return {
    enabled: settings.enabled,
    active,
    muted: active && isMuted(state),
    manual: state.override !== null,
    line: state.lastLine,
    error,
  };
}

chrome.runtime.onMessage.addListener((msg: ToContent, _sender, sendResponse) => {
  if (msg.type === 'toggle') {
    manualToggle();
    sendResponse(status());
  } else if (msg.type === 'get-status') {
    sendResponse(status());
  }
  return false;
});

// YouTube is a single-page app: re-check soon after every in-app navigation.
document.addEventListener('yt-navigate-finish', () => {
  channelOk = null;
  schedule(300);
});

onSettingsChanged((s) => {
  settings = s;
  channelOk = null;
  lastSig = null;
  schedule(50);
});

loadSettings().then(
  (s) => {
    settings = s;
    schedule(500);
  },
  (err) => console.warn(TAG, 'could not load settings', err),
);
