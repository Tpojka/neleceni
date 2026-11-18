import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { Observation } from '../src/shared/match.ts';
import { afterSeek, initialState, isMuted, step, toggle, type MuteState, type StepConfig } from '../src/shared/state.ts';

const cfg: StepConfig = { otherConfirmations: 3, releaseAfterGoneSec: 0 };
const target: Observation = { kind: 'target', name: 'Александар Вучић', line: 'Александар Вучић' };
const other = (line = 'Ана Брнабић'): Observation => ({ kind: 'other', line });
const none: Observation = { kind: 'none' };

function run(obs: Observation[], c = cfg, start = initialState()): MuteState {
  return obs.reduce((s, o, i) => step(s, o, i * 1500, c), start);
}

describe('automatic mute', () => {
  it('mutes on the first reading of the target', () => {
    assert.ok(isMuted(run([none, target])));
  });
  it('stays muted when the caption disappears', () => {
    assert.ok(isMuted(run([target, none, none, none, none])));
  });
  it('un-mutes only after enough readings of another speaker', () => {
    assert.ok(isMuted(run([target, other(), other()])));
    assert.ok(!isMuted(run([target, other(), other(), other()])));
  });
  it('a single target reading in between restarts the count', () => {
    assert.ok(isMuted(run([target, other(), other(), target, other(), other()])));
  });
  it('can release after the name has been gone for a while', () => {
    const c = { ...cfg, releaseAfterGoneSec: 4 }; // readings every 1.5 s
    assert.ok(isMuted(run([target, none, none], c))); // 3.0 s without the name
    assert.ok(!isMuted(run([target, none, none, none], c))); // 4.5 s
  });
});

describe('manual override', () => {
  it('un-mutes by hand and keeps it while the same caption stays', () => {
    let s = toggle(run([target]));
    assert.ok(!isMuted(s));
    s = run([target, target, { kind: 'target', name: 'x', line: 'Александар Вучи' }, target], cfg, s);
    assert.ok(!isMuted(s));
  });
  it('hands control back when a different caption has been read enough times', () => {
    let s = toggle(run([target]));
    s = run([other(), other(), other()], cfg, s);
    assert.equal(s.override, null);
    assert.ok(!isMuted(s));
    s = step(s, target, 99_000, cfg);
    assert.ok(isMuted(s));
  });
  it('mutes by hand when detection missed the speaker', () => {
    let s = toggle(run([other('Нечитко Име')]));
    assert.ok(isMuted(s));
    s = run([other('Нечитко Име'), none, other('Нечитко Име')], cfg, s);
    assert.ok(isMuted(s));
    s = run([other(), other(), other()], cfg, s);
    assert.ok(!isMuted(s));
  });
  it('toggling back to the automatic decision clears the override', () => {
    const s = toggle(toggle(run([target])));
    assert.equal(s.override, null);
    assert.ok(isMuted(s));
  });
});

describe('seeking', () => {
  it('keeps a manual un-mute when the same speaker is on screen after the jump', () => {
    let s = afterSeek(toggle(run([target])));
    assert.ok(!isMuted(s));
    s = run([target, target, target], cfg, s);
    assert.ok(!isMuted(s));
  });
  it('keeps a manual mute through the jump', () => {
    let s = afterSeek(toggle(run([other('Нечитко Име')])));
    assert.ok(isMuted(s));
    s = run([none, other('Нечитко Име')], cfg, s);
    assert.ok(isMuted(s));
  });
  it('still hands control back when the jump lands on a different speaker', () => {
    let s = afterSeek(toggle(run([target])));
    s = run([other(), other(), other()], cfg, s);
    assert.equal(s.override, null);
    s = step(s, target, 99_000, cfg);
    assert.ok(isMuted(s));
  });
  it('without a manual choice, the caption at the new position decides', () => {
    const s = afterSeek(run([target]));
    assert.ok(!isMuted(s));
    assert.ok(isMuted(step(s, target, 0, cfg)));
  });
  it('forgets the streak towards a change of caption', () => {
    let s = toggle(run([target]));
    s = run([other(), other()], cfg, s);
    s = afterSeek(s);
    assert.equal(s.override?.changeStreak, 0);
  });
});
