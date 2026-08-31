export const INITIAL_STATS = Object.freeze({
  hunger: 50,
  stress: 50,
  respect: 50,
  health: 80,
});

export const INITIAL_GAME = Object.freeze({
  stats: INITIAL_STATS,
  message: 'Woke up this morning...',
  tonyState: 'idle',
  isAsleep: false,
  selectedMenuIndex: 0,
  screenMode: 'home',
  gameMinutes: 8 * 60 + 30,
  careStreak: 0,
});

export const SAVE_VERSION = 1;
export const STORAGE_KEY = 'tonigatchi-save';

export const clamp = (value) => Math.max(0, Math.min(100, value));

export function tickStats(stats, isAsleep) {
  const hunger = clamp(stats.hunger - (isAsleep ? 1 : 2));
  const stress = clamp(stats.stress + (isAsleep ? -1 : 1));
  const healthPenalty = hunger < 10 || stress > 90 ? 2 : 0;

  return {
    hunger,
    stress,
    // Respect should matter without forcing the player to mash Work constantly.
    respect: clamp(stats.respect - (isAsleep ? 0 : 0.1)),
    health: clamp(stats.health + (isAsleep ? 1 : -healthPenalty)),
  };
}

export function applyAction(stats, action) {
  switch (action) {
    case 'eat':
      return {
        ...stats,
        hunger: clamp(stats.hunger + 30),
        health: clamp(stats.health + 5),
        stress: clamp(stats.stress + 5),
      };
    case 'therapy':
      return {
        ...stats,
        stress: clamp(stats.stress - 40),
        respect: clamp(stats.respect - 5),
      };
    case 'collect':
      return {
        ...stats,
        respect: clamp(stats.respect + 20),
        stress: clamp(stats.stress + 10),
      };
    case 'ducks':
      return {
        ...stats,
        stress: clamp(stats.stress - 20),
        health: clamp(stats.health + 2),
      };
    default:
      return stats;
  }
}

function isValidStat(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function parseSave(serialized) {
  if (!serialized) return null;

  try {
    const save = JSON.parse(serialized);
    const stats = save?.game?.stats;
    const game = save?.game;

    if (
      save.version !== SAVE_VERSION ||
      !stats ||
      !Object.values(stats).every(isValidStat) ||
      !Number.isFinite(game.gameMinutes) ||
      !Number.isInteger(game.selectedMenuIndex) ||
      !Number.isInteger(game.careStreak) ||
      typeof game.isAsleep !== 'boolean'
    ) {
      return null;
    }

    return {
      ...INITIAL_GAME,
      ...game,
      stats: { ...INITIAL_STATS, ...stats },
      // Transient animations should never be restored mid-action.
      tonyState: game.isAsleep ? 'sleeping' : 'idle',
      screenMode: 'home',
    };
  } catch {
    return null;
  }
}

export function serializeSave(game) {
  return JSON.stringify({ version: SAVE_VERSION, game });
}
