import '../styles/Timer.css';
import countdownSfx from '../sounds/countdown.mp3';
import goSfx from '../sounds/go.mp3';
import useSound from 'use-sound';
import { useEffect, useRef, useState } from 'react';
import NoSleep from 'nosleep.js';
import { Check, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';

type TimerStage = 'Not Started' | 'Hang' | 'Rest' | 'Complete';

const defaults = {
  intervals: 3,
  prepareTime: 3,
  hangMinutes: '00',
  hangSeconds: 10,
  restMinutes: '00',
  restSeconds: 30,
};

const SEGMENT_RADIUS = 47;
const SEGMENT_CIRCUMFERENCE = 2 * Math.PI * SEGMENT_RADIUS;
const ARC_RADIUS = 38;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;

const calculateDuration = (minutes: number | string, seconds: number | string) => {
  const parsedMinutes = typeof minutes === 'string' ? parseInt(minutes, 10) : minutes;
  const parsedSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;

  if (isNaN(parsedMinutes) || isNaN(parsedSeconds)) {
    return 0;
  }

  return parsedMinutes * 60 + parsedSeconds;
};

const formatClock = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
};

const formatRemaining = (totalSeconds: number) => {
  if (totalSeconds >= 60) {
    return formatClock(totalSeconds);
  }

  return totalSeconds.toString().padStart(2, '0');
};

const buildSegments = (total: number) => {
  const period = SEGMENT_CIRCUMFERENCE / total;
  const gap = Math.min(8.06, Math.max(1.2, period * 0.14));
  const dash = period - gap;

  return {
    dash,
    gap,
    offsets: Array.from({ length: total }, (_unused, index) => {
      return -(index * period);
    }),
  };
};

const HAPTICS = {
  tick: [40],
  hang: [180],
  rest: [70, 70, 70],
  complete: [180, 90, 180, 90, 280],
};

const vibrate = (pattern: number[]) => {
  if (typeof navigator.vibrate !== 'function') {
    return;
  }

  navigator.vibrate(pattern);
};

const centreFontSize = (value: string) => {
  if (value.length <= 1) {
    return 150;
  }

  if (value.length === 2) {
    return 140;
  }

  if (value.length === 4) {
    return 76;
  }

  return 66;
};

const Timer = () => {
  const [stageKey, setStageKey] = useState<number>(0);
  const [stage, setStage] = useState<TimerStage>('Not Started');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [prepareTime, setPrepareTime] = useState<number>(defaults.prepareTime);
  const [remaining, setRemaining] = useState<number>(0);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [resyncKey, setResyncKey] = useState<number>(0);
  const [arcOffset, setArcOffset] = useState<number>(0);
  const [currentInterval, setCurrentInterval] = useState<number>(1);

  const [intervals, setIntervals] = useState<number | string>(defaults.intervals);
  const [hangTimeMinutes, setHangTimeMinutes] = useState<number | string>(defaults.hangMinutes);
  const [hangTimeSeconds, setHangTimeSeconds] = useState<number | string>(defaults.hangSeconds);
  const [restTimeMinutes, setRestTimeMinutes] = useState<number | string>(defaults.restMinutes);
  const [restTimeSeconds, setRestTimeSeconds] = useState<number | string>(defaults.restSeconds);

  const [playCountdown] = useSound(countdownSfx, { volume: 0.5 });
  const [playGo] = useSound(goSfx, { volume: 0.5 });

  const noSleep = useRef(new NoSleep());
  const previousRemaining = useRef(0);

  const enableNoSleep = () => {
    noSleep.current.enable().catch(() => {});
  };

  const disableNoSleep = () => {
    noSleep.current.disable();
  };

  const hangDuration = calculateDuration(hangTimeMinutes, hangTimeSeconds);
  const restDuration = calculateDuration(restTimeMinutes, restTimeSeconds);
  const totalSets = parseInt(intervals as string, 10) || 0;

  const isEditable = stage === 'Not Started';
  const isComplete = stage === 'Complete';

  const canStart = totalSets > 0 && hangDuration > 0 && restDuration > 0;
  const stageDuration = stage === 'Hang' ? hangDuration : restDuration;

  const saveSettingsToLocalStorage = () => {
    localStorage.setItem('timerSettings', JSON.stringify({
      intervals,
      hangTimeMinutes,
      hangTimeSeconds,
      restTimeMinutes,
      restTimeSeconds,
    }));
  };

  const loadSettingsFromLocalStorage = () => {
    const savedSettings = localStorage.getItem('timerSettings');

    if (!savedSettings) {
      return;
    }

    const settings = JSON.parse(savedSettings);

    setIntervals(settings.intervals);
    setHangTimeMinutes(settings.hangTimeMinutes);
    setHangTimeSeconds(settings.hangTimeSeconds);
    setRestTimeMinutes(settings.restTimeMinutes);
    setRestTimeSeconds(settings.restTimeSeconds);
  };

  const advanceStage = () => {
    setStageKey((previousKey) => previousKey + 1);

    if (currentInterval < totalSets) {
      if (stage === 'Rest') {
        setStage('Hang');
      } else if (stage === 'Hang') {
        setStage('Rest');
        setCurrentInterval((previousInterval) => previousInterval + 1);
      }

      return;
    }

    if (stage === 'Hang') {
      setStage('Complete');
    } else {
      setStage('Hang');
    }
  };

  const toggleTimer = () => {
    if (stage === 'Not Started') {
      saveSettingsToLocalStorage();
      setStage('Rest');
      setIsRunning(true);
      enableNoSleep();

      return;
    }

    if (isRunning) {
      setIsRunning(false);
      setEndsAt(null);
      disableNoSleep();

      return;
    }

    setIsPreparing(true);
    enableNoSleep();
  };

  const reset = () => {
    loadSettingsFromLocalStorage();

    setStage('Not Started');
    setIsRunning(false);
    setEndsAt(null);
    setIsPreparing(false);
    setPrepareTime(defaults.prepareTime);
    setStageKey((previousKey) => previousKey + 1);
    setCurrentInterval(1);
    setRemaining(0);

    disableNoSleep();
  };

  useEffect(() => {
    loadSettingsFromLocalStorage();
  }, []);

  useEffect(() => {
    if (stage === 'Hang' || stage === 'Rest') {
      const duration = stage === 'Hang' ? hangDuration : restDuration;

      setRemaining(duration);
      setEndsAt(isRunning ? Date.now() + duration * 1000 : null);
      setArcOffset(0);
      vibrate(stage === 'Hang' ? HAPTICS.hang : HAPTICS.rest);

      return;
    }

    if (stage === 'Complete') {
      setIsRunning(false);
      setEndsAt(null);
      vibrate(HAPTICS.complete);
      disableNoSleep();
    }
  }, [stage, stageKey, hangDuration, restDuration]);

  useEffect(() => {
    if (!isRunning || endsAt === null) {
      return;
    }

    const readClock = () => {
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    };

    const interval = setInterval(readClock, 250);

    const resync = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      readClock();
      setArcOffset(stageDuration - Math.max(0, (endsAt - Date.now()) / 1000));
      setResyncKey((previousKey) => previousKey + 1);
    };

    document.addEventListener('visibilitychange', resync);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', resync);
    };
  }, [isRunning, endsAt, stageDuration]);

  useEffect(() => {
    const reachedZero = previousRemaining.current > 0 && remaining <= 0;
    previousRemaining.current = remaining;

    if (!isRunning) {
      return;
    }

    if (remaining > 0 && remaining <= 3) {
      playCountdown();
      vibrate(HAPTICS.tick);
    }

    if (reachedZero) {
      playGo();
      advanceStage();
    }
  }, [remaining, isRunning]);

  useEffect(() => {
    if (!isPreparing) {
      return;
    }

    if (prepareTime === 0) {
      playGo();
      setIsPreparing(false);
      setPrepareTime(defaults.prepareTime);
      setIsRunning(true);
      setEndsAt(Date.now() + remaining * 1000);
      setArcOffset(stageDuration - remaining);
      setResyncKey((previousKey) => previousKey + 1);

      return;
    }

    playCountdown();
    vibrate(HAPTICS.tick);

    const timeout = setTimeout(() => {
      setPrepareTime((previousTime) => previousTime - 1);
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [isPreparing, prepareTime]);

  const handleTimeChange = (
    setter: React.Dispatch<React.SetStateAction<number | string>>,
    value: string
  ) => {
    const sanitizedValue = value.replace(/\D/g, '').slice(-2);

    if (sanitizedValue === '') {
      setter('');

      return;
    }

    const numericValue = parseInt(sanitizedValue, 10);

    if (numericValue >= 0 && numericValue < 60) {
      setter(sanitizedValue.padStart(2, '0'));
    }
  };

  const handleIntervalChange = (
    setter: React.Dispatch<React.SetStateAction<number | string>>,
    value: string
  ) => {
    const sanitizedValue = value.replace(/\D/g, '').slice(-2);

    if (sanitizedValue === '') {
      setter('');

      return;
    }

    const numericValue = parseInt(sanitizedValue, 10);

    if (numericValue > 0 && numericValue <= 45) {
      setter(numericValue);
    }
  };

  const sessionSeconds = totalSets * (hangDuration + restDuration);
  const hangingSeconds = totalSets * hangDuration;

  const segments = buildSegments(Math.max(totalSets, 1));
  const litSegments = stage === 'Not Started' || isPreparing ? 0 : currentInterval;
  const isIdle = stage === 'Not Started';


  const isResting = stage === 'Rest' && !isPreparing;
  const arcColor = isResting ? '#5A6155' : '#E9FF00';
  const accentClass = isResting ? 'is-resting' : '';

  const stageLabel = () => {
    if (isPreparing) {
      return 'GET READY';
    }

    if (stage === 'Not Started') {
      return 'READY';
    }

    if (stage === 'Complete') {
      return 'COMPLETE';
    }

    return stage.toUpperCase();
  };

  const subLabel = () => {
    if (isPreparing) {
      return '';
    }

    if (stage === 'Not Started') {
      return `${totalSets} SETS TOTAL`;
    }

    if (stage === 'Complete') {
      return 'GOOD JOB!';
    }

    if (stage === 'Rest') {
      return `NEXT · HANG ${formatClock(hangDuration)}`;
    }

    return '';
  };

  const centreValue = () => {
    if (isPreparing) {
      return prepareTime.toString();
    }

    if (stage === 'Not Started') {
      return formatClock(sessionSeconds);
    }

    return formatRemaining(Math.max(remaining, 0));
  };

  const isMutedLabel = stage === 'Not Started' || isResting;

  return (
    <div className="timer">
      <header className="timer-header">
        <div className="wordmark">Finger Forge</div>
      </header>

      <div className="timer-stage">
        <div className={`timer-ring ${accentClass}`}>
          <svg className="ring-rings" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={SEGMENT_RADIUS}
              fill="none"
              stroke="#2A2D25"
              strokeWidth="3"
              strokeDasharray={`${segments.dash} ${segments.gap}`}
              strokeLinecap="round"
              className="segment-track"
            />
            {segments.offsets.slice(0, litSegments).map((offset, index) => {
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r={SEGMENT_RADIUS}
                  fill="none"
                  stroke="#E9FF00"
                  strokeWidth="3"
                  strokeDasharray={`${segments.dash} ${SEGMENT_CIRCUMFERENCE}`}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="segment-lit"
                />
              );
            })}
            <circle cx="50" cy="50" r={ARC_RADIUS} fill="none" stroke="#191B16" strokeWidth="6.5" />
            {isComplete ? (
              <circle cx="50" cy="50" r={ARC_RADIUS} fill="none" stroke="#E9FF00" strokeWidth="6.5" className="arc-lit" />
            ) : isIdle ? null : (
              <circle
                key={`${stageKey}-${resyncKey}`}
                cx="50"
                cy="50"
                r={ARC_RADIUS}
                fill="none"
                stroke={arcColor}
                strokeWidth="6.5"
                strokeDasharray={ARC_CIRCUMFERENCE}
                strokeLinecap="round"
                className={`arc-sweep ${stage === 'Rest' ? 'is-growing' : ''} ${isResting ? '' : 'arc-lit'}`}
                style={{
                  '--arc-circumference': ARC_CIRCUMFERENCE,
                  '--arc-duration': `${stageDuration}s`,
                  animationDelay: `-${arcOffset}s`,
                  animationPlayState: isRunning ? 'running' : 'paused',
                } as React.CSSProperties}
              />
            )}
          </svg>

          <svg className="ring-labels" viewBox="0 0 100 100">
            <defs>
              <path id="stage-arc" d="M 22 50 A 28 28 0 0 1 78 50" fill="none" />
              <path id="sub-arc" d="M 17 50 A 33 33 0 0 0 83 50" fill="none" />
            </defs>
            <text className={`stage-label ${isMutedLabel ? 'is-muted' : ''}`} fontSize="4.6" fontWeight="800" letterSpacing="2.2">
              <textPath href="#stage-arc" startOffset="50%" textAnchor="middle">{stageLabel()}</textPath>
            </text>
            <text className={`sub-label ${isComplete ? 'is-lit' : ''}`} fontSize="3.4" fontWeight="700" letterSpacing="1.4">
              <textPath href="#sub-arc" startOffset="50%" textAnchor="middle">{subLabel()}</textPath>
            </text>
          </svg>

          <div className="ring-centre">
            {isComplete ? (
              <div className="centre-check"><Check size={72} strokeWidth={1.5} /></div>
            ) : (
              <div
                className={`centre-value ${isPreparing ? 'is-lit' : ''} ${isResting ? 'is-resting' : ''}`}
                style={{ fontSize: `${centreFontSize(centreValue())}px` }}
              >
                {centreValue()}
              </div>
            )}
          </div>
        </div>

        {isComplete ? (
          <div className="timer-controls">
            <button type="button" className="control-again" onClick={reset}>
              <RotateCcw size={20} strokeWidth={2} />
              Go again
            </button>
          </div>
        ) : (
          <div className="timer-controls">
            <button
              type="button"
              className="control-secondary"
              onClick={reset}
              disabled={stage === 'Not Started'}
            >
              <RotateCcw size={24} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="control-primary"
              onClick={toggleTimer}
              disabled={!canStart || isPreparing}
            >
              {isRunning ? <Pause size={36} strokeWidth={1.5} fill="currentColor" /> : <Play size={36} strokeWidth={1.5} fill="currentColor" />}
            </button>
            <button
              type="button"
              className="control-secondary"
              onClick={advanceStage}
              disabled={!isRunning}
            >
              <SkipForward size={24} strokeWidth={2} fill="currentColor" />
            </button>
          </div>
        )}
      </div>

      {isComplete ? (
        <div className="timer-settings">
          <div className="setting">
            <span className="setting-label">Sets</span>
            <span className="setting-value">{totalSets}</span>
          </div>
          <div className="setting-divider" />
          <div className="setting">
            <span className="setting-label">Time on</span>
            <span className="setting-value is-lit">{formatClock(hangingSeconds)}</span>
          </div>
          <div className="setting-divider" />
          <div className="setting">
            <span className="setting-label">Total</span>
            <span className="setting-value">{formatClock(sessionSeconds)}</span>
          </div>
        </div>
      ) : (
        <div className={`timer-settings ${isEditable ? 'is-editable' : ''}`}>
          <div className="setting">
            <span className="setting-label">Sets</span>
            <input
              className="setting-input"
              inputMode="numeric"
              value={intervals}
              placeholder="1"
              disabled={!isEditable}
              onChange={(event) => handleIntervalChange(setIntervals, event.target.value)}
            />
          </div>
          <div className="setting-divider" />
          <div className="setting">
            <span className="setting-label">Hang</span>
            <span className="setting-pair">
              <input
                className="setting-input"
                inputMode="numeric"
                value={hangTimeMinutes}
                placeholder="MM"
                disabled={!isEditable}
                onChange={(event) => handleTimeChange(setHangTimeMinutes, event.target.value)}
              />
              :
              <input
                className="setting-input"
                inputMode="numeric"
                value={hangTimeSeconds}
                placeholder="SS"
                disabled={!isEditable}
                onChange={(event) => handleTimeChange(setHangTimeSeconds, event.target.value)}
              />
            </span>
          </div>
          <div className="setting-divider" />
          <div className="setting">
            <span className="setting-label">Rest</span>
            <span className="setting-pair">
              <input
                className="setting-input"
                inputMode="numeric"
                value={restTimeMinutes}
                placeholder="MM"
                disabled={!isEditable}
                onChange={(event) => handleTimeChange(setRestTimeMinutes, event.target.value)}
              />
              :
              <input
                className="setting-input"
                inputMode="numeric"
                value={restTimeSeconds}
                placeholder="SS"
                disabled={!isEditable}
                onChange={(event) => handleTimeChange(setRestTimeSeconds, event.target.value)}
              />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;
