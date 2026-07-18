import { useEffect, useRef, useState } from 'react';
import tonyIdle from './assets/tony_idle.png';
import './App.css';

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
  { id: 'eat', label: 'Eat gabagool', shortLabel: 'Meal', number: '01' },
  { id: 'therapy', label: 'See Dr. Melfi', shortLabel: 'Talk', number: '02' },
  { id: 'collect', label: 'Make collections', shortLabel: 'Work', number: '03' },
  { id: 'ducks', label: 'Feed the ducks', shortLabel: 'Ducks', number: '04' },
];

const STAT_CONFIG = [
  { id: 'hunger', label: 'Full' },
  { id: 'stress', label: 'Nerves' },
  { id: 'respect', label: 'Respect' },
  { id: 'health', label: 'Health' },
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
    <main className="app-shell">
      <div className="backdrop-noise" aria-hidden="true" />
      <section className="pocket-boss" aria-label="Tonigatchi game">
        <header className="device-marquee">
          <p className="serial-number">SATRIALE'S / MODEL 01</p>
          <h1><span>TONI</span>GATCHI</h1>
          <p className="device-subtitle">Digital capo companion</p>
        </header>

        <div className="lcd-bezel">
          <div className="game-screen">
            <div className="screen-topline">
              <span>DAY 01</span>
              <span className={isPaused ? '' : 'status-light'}>{isDead ? 'OFF' : isPaused ? 'HOLD' : 'LIVE'}</span>
              <span>08:30</span>
            </div>
            <div className="screen-grid" aria-hidden="true" />
            {isPaused && <div className="screen-overlay" role="status">ON HOLD</div>}
            <p className="game-message" aria-live="polite"><span>TONY SAYS</span>{isDead ? GAME_OVER_MESSAGE : message}</p>

            <div className={`tony-sprite ${tonyState === 'idle' ? 'animate-float' : 'animate-shake'}`}>
              {isDead ? (
                <span className="coffin" role="img" aria-label="Game over">✚</span>
              ) : (
                <img src={tonyIdle} alt="Tony Soprano" />
              )}
            </div>
            <div className="floor-shadow" aria-hidden="true" />
            <p className="screen-footer">KEEP THE BOSS HAPPY</p>
          </div>
        </div>

        <div className="readouts" aria-label="Tony's stats">
          {STAT_CONFIG.map((stat) => <StatBar key={stat.id} {...stat} value={stats[stat.id]} />)}
        </div>

        <div className="control-deck">
          <p className="controls-label">MAKE A MOVE</p>
          <div className="actions-grid">
            {isDead ? (
              <button className="restart-button" type="button" onClick={restart}><span>↻</span> Start over</button>
            ) : (
              ACTIONS.map((action) => (
                <button key={action.id} className="action-button" type="button" onClick={() => handleAction(action.id)} disabled={isPaused} aria-label={action.label}>
                  <span className="button-number" aria-hidden="true">{action.number}</span>
                  <span className="button-label">{action.shortLabel}</span>
                </button>
              ))
            )}
          </div>

          {!isDead && (
            <div className="pause-control">
              <button className="pause-button" type="button" onClick={() => setIsPaused((paused) => !paused)} aria-pressed={isPaused}>
                <span className="pause-mark" aria-hidden="true">{isPaused ? '▶' : 'Ⅱ'}</span>
                {isPaused ? 'Continue' : 'Hold'}
              </button>
            </div>
          )}
        </div>
        <p className="device-footer">NO F***IN' ZITI DETECTED</p>
      </section>
    </main>
  );
}

function StatBar({ id, label, value }) {
  const percentage = clamp(value);
  const roundedValue = Math.round(percentage);

  return (
    <div className={`stat-bar stat-${id}`}>
      <div className="stat-label"><span>{label}</span><strong>{roundedValue}</strong></div>
      <div className="stat-track" role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={roundedValue}>
        <div className="stat-value" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default App;
