/**
 * The mute state machine. Pure functions, so they are easy to test.
 *
 * Automatic rule: mute as soon as a target name is read on the name line; un-mute only after
 * another speaker's name has been read `otherConfirmations` times (and, optionally, after the
 * target has not been seen for `releaseAfterGoneSec`). Captions that vanish keep the current
 * state, because the speech usually goes on after the caption is gone.
 *
 * Manual override (keyboard shortcut / clicking the pill): flips the current state and holds it
 * until a clearly different caption has been read `otherConfirmations` times, then automatic
 * control resumes.
 */
import { similarLines, type Observation } from './match.ts';

export interface Override {
  muted: boolean;
  /** Caption line on screen when the override was set. */
  refLine: string;
  /** Readings in a row of a caption that differs from `refLine`. */
  changeStreak: number;
}

export interface MuteState {
  autoMuted: boolean;
  /** Readings of another speaker since the target was last seen. */
  otherStreak: number;
  /** Time (ms) the target was last read, 0 if never. */
  lastTargetAt: number;
  /** Last non-empty name line, used as the reference for a manual override. */
  lastLine: string;
  override: Override | null;
  /** What the last reading was, for display. */
  last: Observation;
}

export interface StepConfig {
  otherConfirmations: number;
  releaseAfterGoneSec: number;
}

export const initialState = (): MuteState => ({
  autoMuted: false,
  otherStreak: 0,
  lastTargetAt: 0,
  lastLine: '',
  override: null,
  last: { kind: 'none' },
});

export const isMuted = (s: MuteState): boolean => (s.override ? s.override.muted : s.autoMuted);

export function step(s: MuteState, obs: Observation, now: number, cfg: StepConfig): MuteState {
  let { autoMuted, otherStreak, lastTargetAt, lastLine, override } = s;

  if (obs.kind === 'target') {
    autoMuted = true;
    otherStreak = 0;
    lastTargetAt = now;
  } else {
    if (obs.kind === 'other') {
      otherStreak += 1;
      if (autoMuted && otherStreak >= cfg.otherConfirmations) autoMuted = false;
    }
    if (autoMuted && cfg.releaseAfterGoneSec > 0 && now - lastTargetAt >= cfg.releaseAfterGoneSec * 1000) {
      autoMuted = false;
    }
  }

  if (obs.kind !== 'none') {
    lastLine = obs.line;
    if (override) {
      const changeStreak = similarLines(obs.line, override.refLine) ? 0 : override.changeStreak + 1;
      override = changeStreak >= cfg.otherConfirmations ? null : { ...override, changeStreak };
    }
  }

  return { autoMuted, otherStreak, lastTargetAt, lastLine, override, last: obs };
}

/**
 * State after a seek in a replay. The automatic decision starts over, so the caption at the new
 * position decides. A manual choice stays: it still holds until a clearly different caption has
 * been read `otherConfirmations` times, counted from the new position.
 */
export function afterSeek(s: MuteState): MuteState {
  return { ...initialState(), override: s.override && { ...s.override, changeStreak: 0 } };
}

/** Flip the audible state by hand. Going back to what automatic control wants clears the override. */
export function toggle(s: MuteState): MuteState {
  const muted = !isMuted(s);
  if (muted === s.autoMuted) return { ...s, override: null };
  return { ...s, override: { muted, refLine: s.lastLine, changeStreak: 0 } };
}
