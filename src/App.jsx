import { useEffect, useRef, useState } from 'react';
import tonyIdle from './assets/tony_idle.png';

const INITIAL_STATS = Object.freeze({ hunger: 50, stress: 50, respect: 50, health: 80 });
const GAME_OVER_MESSAGE = "Don't stop believing... (Screen cuts to black)";

const QUOTES = [
  'Gabagool? Over here!', "What, no f***in' ziti?", "It's a retirement community!",
  'Those who want respect, give respect.',
  "I'm like King Midas in reverse. Everything I touch turns to s**t.",
  'You believe this guy?', 'Oh, poor you!', "I don't know T, it's a lot of money.",
  'Whaddaya gonna do?', "Log off. That 'cookies' s**t makes me nervous.",
  "You're a captain, for Christ's sake!",
];

const ACTIONS = [
  { id: 'eat', label: 'Eat Gabagool', icon: '🥩' },
  { id: 'therapy', label: 'See Dr. Melfi', icon: '🛋️' },
  { id: 'collect', label: 'Collections', icon: '💰' },
  { id: 'ducks', label: 'Feed Ducks', icon: '🦆' },
];

const STAT_CONFIG = [
  { id: 'hunger', label: 'Hunger', color: '#f59e0b' },
  { id: 'stress', label: 'Stress', color: '#ef4444' },
  { id: 'respect', label: 'Respect', color: '#3b82f6' },
  { id: 'health', label: 'Health', color: '#10b981' },
];

const clamp = (value) => Math.max(0, Math.min(100, value));

function App() {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [message, setMessage] = useState('Woke up this morning...');
  const [isPaused, setIsPaused] = useState(false);
  const [tonyState, setTonyState] = useState('idle');
  const actionTimerRef = useRef(null);
  const isDead = stats.health === 0;

  useEffect(() => {
    if (isDead || isPaused) return undefined;

    const timer = window.setInterval(() => {
      setStats((previousStats) => {
        const hunger = clamp(previousStats.hunger - 2);
        const stress = clamp(previousStats.stress + 1);
        const healthPenalty = hunger < 10 || stress > 90 ? 2 : 0;

        return {
          hunger,
          stress,
          respect: clamp(previousStats.respect - 0.5),
          health: clamp(previousStats.health - healthPenalty),
        };
      });
    }, 2000);

    return () => window.clearInterval(timer);
  }, [isDead, isPaused]);

  useEffect(() => () => window.clearTimeout(actionTimerRef.current), []);

  const handleAction = (action) => {
    if (isDead || isPaused) return;

    window.clearTimeout(actionTimerRef.current);
    setTonyState('action');
    actionTimerRef.current = window.setTimeout(() => setTonyState('idle'), 1000);
    setMessage(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    setStats((previousStats) => {
      switch (action) {
        case 'eat':
          return { ...previousStats, hunger: clamp(previousStats.hunger + 30), health: clamp(previousStats.health + 5), stress: clamp(previousStats.stress + 5) };
        case 'therapy':
          return { ...previousStats, stress: clamp(previousStats.stress - 40), respect: clamp(previousStats.respect - 5) };
        case 'collect':
          return { ...previousStats, respect: clamp(previousStats.respect + 20), stress: clamp(previousStats.stress + 10) };
        case 'ducks':
          return { ...previousStats, stress: clamp(previousStats.stress - 20), health: clamp(previousStats.health + 2) };
        default:
          return previousStats;
      }
    });
  };

  const restart = () => {
    window.clearTimeout(actionTimerRef.current);
    setStats(INITIAL_STATS);
    setMessage('Woke up this morning...');
    setTonyState('idle');
    setIsPaused(false);
  };

  return (
    <main className="container flex-col gap-md">
      <header className="text-center game-header">
        <h1>TONIGATCHI</h1>
        <p>The Boss of Virtual Pets</p>
      </header>

      <section className="card flex-col gap-md" aria-label="Tonigatchi game">
        <div className="game-screen">
          <div className="scanlines" aria-hidden="true" />
          {isPaused && <div className="screen-overlay" role="status">PAUSED</div>}
          <p className="game-message" aria-live="polite">&ldquo;{isDead ? GAME_OVER_MESSAGE : message}&rdquo;</p>

          <div className={`tony-sprite ${tonyState === 'idle' ? 'animate-float' : 'animate-shake'}`}>
            {isDead ? (
              <span className="coffin" role="img" aria-label="Game over">⚰️</span>
            ) : (
              <img src={tonyIdle} alt="Tony Soprano" />
            )}
          </div>
          <div className="floor-shadow" aria-hidden="true" />
        </div>

        <div className="stats-grid" aria-label="Tony's stats">
          {STAT_CONFIG.map((stat) => <StatBar key={stat.id} {...stat} value={stats[stat.id]} />)}
        </div>

        <div className="actions-grid">
          {isDead ? (
            <button className="restart-button" type="button" onClick={restart}>Restart game</button>
          ) : (
            ACTIONS.map((action) => (
              <button key={action.id} className="action-button" type="button" onClick={() => handleAction(action.id)} disabled={isPaused}>
                <span aria-hidden="true">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))
          )}
        </div>

        {!isDead && (
          <div className="pause-control">
            <button className="pause-button" type="button" onClick={() => setIsPaused((paused) => !paused)} aria-pressed={isPaused}>
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function StatBar({ label, value, color }) {
  const percentage = clamp(value);
  const roundedValue = Math.round(percentage);

  return (
    <div className="stat-bar">
      <div className="stat-label"><span>{label}</span><span>{roundedValue}%</span></div>
      <div className="stat-track" role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={roundedValue}>
        <div className="stat-value" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default App;
