import { useCallback, useEffect, useRef, useState } from 'react';
import tonyIdle from './assets/tony_idle-transparent.png';
import {
  applyAction,
  INITIAL_GAME,
  parseSave,
  serializeSave,
  STORAGE_KEY,
  tickStats,
} from './gameLogic';
import './App.css';

const GAME_OVER_MESSAGE = "Don't stop believing... (Screen cuts to black)";

const MENU_ITEMS = [
  { id: 'eat', icon: '▣', label: 'Feed', hint: 'Gabagool' },
  { id: 'therapy', icon: '☏', label: 'Talk', hint: 'Dr. Melfi' },
  { id: 'collect', icon: '$', label: 'Work', hint: 'Collections' },
  { id: 'ducks', icon: '≈', label: 'Ducks', hint: 'The pond' },
  { id: 'status', icon: '▥', label: 'Status', hint: 'Care report' },
  { id: 'sleep', icon: '☾', label: 'Lights', hint: 'Go to bed' },
];

const STATUS_CONFIG = [
  { id: 'hunger', label: 'Full' },
  { id: 'stress', label: 'Nerves', inverse: true },
  { id: 'respect', label: 'Respect' },
  { id: 'health', label: 'Health' },
];

const EVENT_MESSAGES = [
  'The ducks are back in the pool.',
  'Carmela is calling. Again.',
  'A good envelope just came in.',
  'The gabagool supply is getting low.',
];

const ACTION_RESULTS = {
  eat: { message: 'Gabagool. Now we are talking.', state: 'eating' },
  therapy: { message: 'A little talking never hurt nobody.', state: 'talking' },
  collect: { message: 'Business is business.', state: 'working' },
  ducks: { message: 'The ducks are back. He is happy.', state: 'ducks' },
};

function formatClock(totalMinutes) {
  const minutesInDay = 24 * 60;
  const time = totalMinutes % minutesInDay;
  const hours = Math.floor(time / 60).toString().padStart(2, '0');
  const minutes = (time % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function App() {
  const [initialGame] = useState(() => parseSave(window.localStorage.getItem(STORAGE_KEY)) ?? INITIAL_GAME);
  const [stats, setStats] = useState(initialGame.stats);
  const [message, setMessage] = useState(initialGame.message);
  const [tonyState, setTonyState] = useState(initialGame.tonyState);
  const [isAsleep, setIsAsleep] = useState(initialGame.isAsleep);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(initialGame.selectedMenuIndex);
  const [screenMode, setScreenMode] = useState(initialGame.screenMode);
  const [gameMinutes, setGameMinutes] = useState(initialGame.gameMinutes);
  const [careStreak, setCareStreak] = useState(initialGame.careStreak);
  const actionTimerRef = useRef(null);
  const tickRef = useRef(0);
  const isDead = stats.health === 0;
  const currentMenu = MENU_ITEMS[selectedMenuIndex];
  const hour = Math.floor((gameMinutes % (24 * 60)) / 60);
  const isNight = hour >= 20 || hour < 7;
  const day = Math.floor(gameMinutes / (24 * 60)) + 1;

  useEffect(() => {
    if (isDead) return undefined;

    const timer = window.setInterval(() => {
      tickRef.current += 1;
      setGameMinutes((minutes) => minutes + 10);
      setStats((previousStats) => tickStats(previousStats, isAsleep));

      if (!isAsleep && tickRef.current % 8 === 0 && Math.random() > 0.45) {
        setMessage(EVENT_MESSAGES[Math.floor(Math.random() * EVENT_MESSAGES.length)]);
      }
    }, 2000);

    return () => window.clearInterval(timer);
  }, [isAsleep, isDead]);

  useEffect(() => () => window.clearTimeout(actionTimerRef.current), []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, serializeSave({
      stats,
      message,
      isAsleep,
      selectedMenuIndex,
      gameMinutes,
      careStreak,
    }));
  }, [careStreak, gameMinutes, isAsleep, message, selectedMenuIndex, stats]);

  const runAction = useCallback((action) => {
    if (isDead || isAsleep) return;

    const result = ACTION_RESULTS[action];
    window.clearTimeout(actionTimerRef.current);
    setTonyState(result.state);
    setMessage(result.message);
    setCareStreak((streak) => streak + 1);
    actionTimerRef.current = window.setTimeout(() => setTonyState('idle'), 1200);

    setStats((previousStats) => applyAction(previousStats, action));
  }, [isAsleep, isDead]);

  const toggleSleep = useCallback(() => {
    if (isDead) return;

    const nextState = !isAsleep;
    window.clearTimeout(actionTimerRef.current);
    setIsAsleep(nextState);
    setTonyState(nextState ? 'sleeping' : 'idle');
    setMessage(nextState ? 'Shhh. The boss is sleeping.' : 'Up and at them.');
  }, [isAsleep, isDead]);

  const restart = useCallback(() => {
    window.clearTimeout(actionTimerRef.current);
    setStats(INITIAL_GAME.stats);
    setMessage(INITIAL_GAME.message);
    setTonyState(INITIAL_GAME.tonyState);
    setIsAsleep(INITIAL_GAME.isAsleep);
    setSelectedMenuIndex(INITIAL_GAME.selectedMenuIndex);
    setScreenMode(INITIAL_GAME.screenMode);
    setGameMinutes(INITIAL_GAME.gameMinutes);
    setCareStreak(INITIAL_GAME.careStreak);
    tickRef.current = 0;
  }, []);

  const moveMenu = useCallback((direction) => {
    if (isDead || screenMode === 'status') return;
    setSelectedMenuIndex((index) => (index + direction + MENU_ITEMS.length) % MENU_ITEMS.length);
  }, [isDead, screenMode]);

  const handleSelect = useCallback(() => {
    if (isDead) {
      restart();
      return;
    }

    if (screenMode === 'status') {
      setScreenMode('home');
      return;
    }

    if (currentMenu.id === 'status') {
      setScreenMode('status');
      return;
    }

    if (currentMenu.id === 'sleep') {
      toggleSleep();
      return;
    }

    if (isAsleep) {
      setMessage('Shhh. Use LIGHTS to wake him up.');
      return;
    }

    runAction(currentMenu.id);
  }, [currentMenu.id, isAsleep, isDead, restart, runAction, screenMode, toggleSleep]);

  const closeScreen = useCallback(() => setScreenMode('home'), []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (['ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(event.key)) event.preventDefault();
      if (event.key === 'ArrowLeft') moveMenu(-1);
      if (event.key === 'ArrowRight') moveMenu(1);
      if (event.key === 'Enter') handleSelect();
      if (event.key === 'Escape') closeScreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeScreen, handleSelect, moveMenu]);

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
          <div className={`game-screen ${isNight ? 'is-night' : ''}`}>
            <div className="screen-topline">
              <span>DAY {day.toString().padStart(2, '0')}</span>
              <span className={!isDead && !isAsleep ? 'status-light' : ''}>{isDead ? 'OFF' : isAsleep ? 'SLEEP' : 'LIVE'}</span>
              <span>{formatClock(gameMinutes)}</span>
            </div>
            <div className="screen-grid" aria-hidden="true" />

            {screenMode === 'status' ? (
              <StatusScreen stats={stats} careStreak={careStreak} />
            ) : (
              <>
                <p className="game-message" aria-live="polite"><span>TONY SAYS</span>{isDead ? GAME_OVER_MESSAGE : message}</p>
                <div className={`tony-sprite is-${tonyState} ${tonyState === 'idle' ? 'animate-float' : ''}`}>
                  {isDead ? (
                    <span className="coffin" role="img" aria-label="Game over">✚</span>
                  ) : (
                    <img src={tonyIdle} alt={isAsleep ? 'Tony Soprano sleeping' : 'Tony Soprano'} />
                  )}
                </div>
                <div className="floor-shadow" aria-hidden="true" />
                {!isDead && <MenuCarousel selectedIndex={selectedMenuIndex} isAsleep={isAsleep} />}
                <p className="screen-footer">{isDead ? 'PRESS B TO REBOOT' : `CARE STREAK ${careStreak.toString().padStart(2, '0')}`}</p>
              </>
            )}
          </div>
        </div>

        <div className="control-deck">
          <p className="controls-label">{screenMode === 'status' ? 'B TO RETURN' : isDead ? 'REBOOT THE BOSS' : `${currentMenu.label} / ${currentMenu.hint}`}</p>
          <div className="physical-controls">
            <button className="control-button control-button-a" type="button" onClick={() => moveMenu(-1)} disabled={isDead || screenMode === 'status'} aria-label="Previous menu item">
              <span>A</span><strong>◀</strong>
            </button>
            <button className="control-button control-button-b" type="button" onClick={handleSelect} aria-label={isDead ? 'Restart game' : screenMode === 'status' ? 'Return to game' : `Select ${currentMenu.label}`}>
              <span>B</span><strong>{isDead ? '↻' : '●'}</strong>
            </button>
            <button className="control-button control-button-c" type="button" onClick={() => moveMenu(1)} disabled={isDead || screenMode === 'status'} aria-label="Next menu item">
              <span>C</span><strong>▶</strong>
            </button>
          </div>
          <p className="keyboard-help">← → browse &nbsp;•&nbsp; enter select &nbsp;•&nbsp; esc back</p>
        </div>
        <p className="device-footer">KEEP THE BOSS HAPPY</p>
      </section>
    </main>
  );
}

function MenuCarousel({ selectedIndex, isAsleep }) {
  return (
    <div className="menu-carousel" aria-label={`Selected menu item: ${MENU_ITEMS[selectedIndex].label}`}>
      <span className="menu-arrow" aria-hidden="true">◀</span>
      <div className="selected-menu-item">
        <strong aria-hidden="true">{MENU_ITEMS[selectedIndex].icon}</strong>
        <span>{isAsleep && MENU_ITEMS[selectedIndex].id !== 'sleep' ? 'ZZZ' : MENU_ITEMS[selectedIndex].label}</span>
      </div>
      <span className="menu-arrow" aria-hidden="true">▶</span>
      <div className="menu-pips" aria-hidden="true">
        {MENU_ITEMS.map((item, index) => <i key={item.id} className={index === selectedIndex ? 'is-selected' : ''} />)}
      </div>
    </div>
  );
}

function StatusScreen({ stats, careStreak }) {
  return (
    <div className="status-screen" aria-live="polite">
      <p className="status-title">Care report</p>
      <div className="status-meters">
        {STATUS_CONFIG.map((stat) => <PixelMeter key={stat.id} {...stat} value={stats[stat.id]} />)}
      </div>
      <p className="status-streak">CARE STREAK <strong>{careStreak}</strong></p>
      <p className="status-return">B: BACK</p>
    </div>
  );
}

function PixelMeter({ label, value, inverse = false }) {
  const filledPips = Math.ceil((inverse ? 100 - value : value) / 20);

  return (
    <div className="pixel-meter" role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(value)}>
      <span>{label}</span>
      <div aria-hidden="true">{[0, 1, 2, 3, 4].map((pip) => <i key={pip} className={pip < filledPips ? 'is-filled' : ''} />)}</div>
    </div>
  );
}

export default App;
