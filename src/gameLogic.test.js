import { describe, expect, it } from 'vitest';
import {
  applyAction,
  INITIAL_GAME,
  INITIAL_STATS,
  parseSave,
  serializeSave,
  tickStats,
} from './gameLogic';

describe('game rules', () => {
  it('clamps actions to the 0-100 range', () => {
    expect(applyAction({ ...INITIAL_STATS, hunger: 90 }, 'eat').hunger).toBe(100);
    expect(applyAction({ ...INITIAL_STATS, stress: 10 }, 'therapy').stress).toBe(0);
  });

  it('decreases respect gradually while awake and recovers stress while asleep', () => {
    expect(tickStats(INITIAL_STATS, false)).toMatchObject({ respect: 49.9, stress: 51 });
    expect(tickStats(INITIAL_STATS, true)).toMatchObject({ respect: 50, stress: 49 });
  });

  it('never lets a sleeping pet gain health beyond 100', () => {
    expect(tickStats({ ...INITIAL_STATS, health: 100 }, true).health).toBe(100);
  });

  it('round-trips a valid save and resets transient screens', () => {
    const saved = { ...INITIAL_GAME, screenMode: 'status', isAsleep: true, tonyState: 'talking' };
    expect(parseSave(serializeSave(saved))).toMatchObject({
      ...saved,
      screenMode: 'home',
      tonyState: 'sleeping',
    });
  });

  it('rejects malformed or incompatible saves', () => {
    expect(parseSave('{"version":999}')).toBeNull();
    expect(parseSave('{not-json')).toBeNull();
  });
});
