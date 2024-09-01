import '../styles/Timer.css';
import LogoNoHangboard from '../images/logo-no-hangboard.svg';
import countdownSfx from '../sounds/countdown.mp3';
import goSfx from '../sounds/go.mp3';
import useSound from 'use-sound';
import { useEffect, useState } from 'react';
import { IconButton, TextField } from '@mui/material';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import Progress from './Progress';

type TimerStage = 'Not Started' | 'Hang' | 'Rest' | 'Complete';

const defaults = {
  intervals: 3,
  prepareTime: 3,
  duration: 0,
  hangMinutes: '00',
  hangSeconds: 10,
  restMinutes: '00',
  restSeconds: 30,
};

const boxStyle = {
  display: 'flex',
  color: 'white',
  backgroundColor: '#4b5769',
  borderRadius: '10px',
  padding: '5px 5px',
  width: '100%',
  height: 60,
  fontSize: 20,
};

const buttonIconStyle = {
  height: '100%',
  width: '100%',
  backgroundColor: '#4b5769',
  borderRadius: '100px',
  padding: 1
};

const buttonStyle = {
  height: 100,
  width: 100,
  color: 'white',
}

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60).toString();
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return { minutes, seconds };
};


const renderTime = (remainingTime: number, stage: TimerStage, isPreparing: boolean, prepareTime: number) => {
  const { minutes, seconds } = formatTime(remainingTime);
  const label = stage.toLocaleUpperCase();

  if (isPreparing) {
    return (
      <div className='timer-label'>
        <div className='text'>Resuming in</div>
        <div className='value'>{prepareTime}</div>
        <div className='text'>seconds...</div>
      </div>
    );
  };

  if (stage === 'Not Started') {
    return (
      <div className='timer-content'>
        <img src={LogoNoHangboard} alt="Hangboard" width={400} height={360} />
      </div>
    );
  };

  if (stage === 'Complete') {
    return (
      <div>
        <div className='timer-label'>Session complete!</div>
      </div>
    )
  };

  if (remainingTime >= 60) {
    return (
      <div className='timer-label'>
        <div className='text'>{label}</div>
        <div className='value'>{minutes}:{seconds}</div>
        <div className='text'>minutes</div>
      </div>
    );
  } else {
    return (
      <div className='timer-label'>
        <div className='text'>{label}</div>
        <div className='value'>{remainingTime}</div>
        <div className='text'>seconds</div>
      </div>
    );
  }
};

const calculateDuration = (minute: number | string, seconds: number | string) => {
  const min = typeof minute === 'string' ? parseInt(minute, 10) : minute;
  const sec = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;

  return min * 60 + sec;
};

const Timer = () => {
  const [key, setKey] = useState(0);
  const [stage, setStage] = useState<TimerStage>('Not Started');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(defaults.duration);
  const [isGrowing, setIsGrowing] = useState<boolean>(false);
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [prepareTime, setPrepareTime] = useState<number>(defaults.prepareTime);
  const [currentInterval, setCurrentInterval] = useState<number>(1);

  const [intervals, setIntervals] = useState<number | string>(defaults.intervals);
  const [hangTimeMinutes, setHangTimeMinutes] = useState<number | string>(defaults.hangMinutes);
  const [hangTimeSeconds, setHangTimeSeconds] = useState<number | string>(defaults.hangSeconds);
  const [restTimeMinutes, setRestTimeMinutes] = useState<number | string>(defaults.restMinutes);
  const [restTimeSeconds, setRestTimeSeconds] = useState<number | string>(defaults.restSeconds);

  const disableTextFields = (stage !== ('Not Started' || 'Complete'));

  const [countdown] = useSound(countdownSfx, { volume: .5 });
  const [go] = useSound(goSfx, { volume: .5 });

  useEffect(() => {
    if (isPreparing && prepareTime > 0) {
      countdown();
      const timer = setInterval(() => {
        setPrepareTime((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (prepareTime === 0) {
      go();
      setIsPreparing(false);
      setPrepareTime(defaults.prepareTime);
      setIsRunning(true);
    }
  }, [isPreparing, prepareTime]);

  useEffect(() => {
    switch (stage) {
      case 'Hang':
        setIsGrowing(false);
        setDuration(calculateDuration(hangTimeMinutes, hangTimeSeconds));
        break;
      case 'Rest':
        setIsGrowing(true);
        setDuration(calculateDuration(restTimeMinutes, restTimeSeconds))
        break;
      case 'Complete':
        stop();
        setIsRunning(false);
        break;
    }
  }, [stage, hangTimeMinutes, hangTimeSeconds, restTimeMinutes, restTimeSeconds]);


  const toggleTimer = () => {
    if (stage === 'Not Started') {
      setStage('Rest');
    }
    if (!isRunning && stage !== 'Not Started') {
      setIsPreparing(true);
    } else {
      setIsRunning((isRunning) => !isRunning);
    }
  };

  const reset = () => {
    setStage('Not Started');
    setIsPreparing(false);
    setPrepareTime(defaults.prepareTime);
    setKey((prevKey) => prevKey + 1);
    setCurrentInterval(1);
    setDuration(defaults.duration);
  };

  const stop = () => {
    setIsRunning(false);
  };

  const nextStage = () => {
    setKey((prevKey) => prevKey + 1);

    const totalIntervals = intervals as number;

    if (currentInterval < totalIntervals) {
      if (stage === 'Rest') {
        setStage('Hang');
      }
      else if (stage === 'Hang') {
        setStage('Rest');
        setCurrentInterval((prevInterval) => prevInterval + 1);
      }
    } else if (currentInterval === totalIntervals) {
      if (stage === 'Hang') {
        setStage('Complete');
      } else {
        setStage('Hang');
      }
    }
  };

  const skip = () => {
    nextStage();
  };

  const handleTimeChange = (
    setter: React.Dispatch<React.SetStateAction<number | string>>,
    value: string
  ) => {
    const sanitizedValue = value.replace(/\D/g, '').slice(-2);

    if (sanitizedValue === '') {
      setter('');
    } else {
      const numericValue = parseInt(sanitizedValue, 10);
      if (!isNaN(numericValue) && numericValue >= 0 && numericValue < 60) {
        setter(sanitizedValue.padStart(2, '0'));
      }
    }
  };

  const handleIntervalChange = (
    setter: React.Dispatch<React.SetStateAction<number | string>>,
    value: string
  ) => {
    const sanitizedValue = value.replace(/\D/g, '').slice(-2);

    if (sanitizedValue === '') {
      setter('');
    } else {
      const numericValue = parseInt(sanitizedValue, 10);
      if (!isNaN(numericValue) && numericValue > 0 && numericValue <= 45) {
        setter(numericValue);
      }
    }
  };

  const preventNumberSymbols = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '.' || e.key === 'e' || e.key === '-' || e.key === ' ') {
      e.preventDefault();
    }
  };

  const isValidIntervals = parseInt(intervals as string, 10) > 0;
  const isValidHangTime = parseInt(hangTimeMinutes as string, 10) + parseInt(hangTimeSeconds as string, 10) > 0;
  const isValidRestTime = parseInt(restTimeMinutes as string, 10) + parseInt(restTimeSeconds as string, 10) > 0;

  const canStart = isValidIntervals && isValidHangTime && isValidRestTime;

  console.log({ isValidHangTime, isValidRestTime, isValidIntervals, canStart });

  return (
    <div className='timer-container'>
      <div className='timer-background-container'>
        <Progress current={(currentInterval === 1 && stage === 'Not Started') ? 0 : currentInterval} max={intervals as number} />
        <CountdownCircleTimer
          key={key}
          isPlaying={isRunning}
          duration={duration}
          colors={['#FFFFFF', '#9999FF']}
          colorsTime={[10, 0]}
          trailColor='#4b5769'
          size={375}
          onComplete={nextStage}
          isGrowing={isGrowing}
          isSmoothColorTransition={false}
          rotation={'counterclockwise'}
          onUpdate={(remainingTime) => {
            if (0 < remainingTime && remainingTime <= 3) {
              countdown();
            }
            if (remainingTime === 0 && stage !== 'Not Started') {
              go();
            }
          }}
        >
          {({ remainingTime }) => renderTime(remainingTime, stage, isPreparing, prepareTime)}
        </CountdownCircleTimer>
      </div>

      <div className='timer-controls'>
        <IconButton
          onClick={() => {
            stop();
            reset();
          }}
          sx={buttonStyle}
          disabled={stage === 'Not Started'}
        >
          <RestartAltRoundedIcon sx={{ ...buttonIconStyle, padding: '4px 8px 8px 8px' }} />
        </IconButton>
        <IconButton
          onClick={(stage !== 'Complete') ? toggleTimer : reset}
          sx={buttonStyle}
          disabled={!canStart || isPreparing || stage === 'Complete'}
        >
          {isRunning ?
            <PauseRoundedIcon sx={buttonIconStyle} />
            :
            <PlayArrowRoundedIcon sx={buttonIconStyle} />
          }
        </IconButton>
        <IconButton
          onClick={skip}
          sx={buttonStyle}
          disabled={!isRunning || isPreparing || stage === 'Complete'}
        >
          <SkipNextRoundedIcon
            sx={buttonIconStyle}
          />
        </IconButton>
      </div>
      <div className='timer-settings'>
        <div className='setting'>
          <div className='setting-label'>
            Intervals
          </div>
          <div className={disableTextFields ? 'setting-time-disabled' : 'setting-time'}>
            <TextField
              variant='standard'
              type='number'
              value={intervals}
              onChange={(e) => handleIntervalChange(setIntervals, e.target.value)}
              placeholder='1'
              inputProps={{
                min: 1,
                max: 45,
                inputMode: 'numeric',
                style: { ...boxStyle, textAlign: 'center' },
              }}
              InputProps={{
                disableUnderline: true,
              }}
              fullWidth
              disabled={disableTextFields}
              onKeyDown={preventNumberSymbols}
              required
            />
          </div>
        </div>
        <div className='setting'>
          <div className='setting-label'>
            Hang
          </div>
          <div className={disableTextFields ? 'setting-time-disabled' : 'setting-time'}>
            <TextField
              variant='standard'
              type='number'
              value={hangTimeMinutes}
              placeholder='MM'
              onChange={(e) => handleTimeChange(setHangTimeMinutes, e.target.value)}
              inputProps={{
                min: 0,
                max: 59,
                inputMode: 'numeric',
                style: { ...boxStyle, textAlign: 'end' },
              }}
              InputProps={{
                disableUnderline: true,
              }}
              fullWidth
              disabled={disableTextFields}
              onKeyDown={preventNumberSymbols}
              required
            />
            :
            <TextField
              variant='standard'
              type='number'
              value={hangTimeSeconds}
              placeholder='SS'
              onChange={(e) => handleTimeChange(setHangTimeSeconds, e.target.value)}
              inputProps={{
                min: 0,
                max: 59,
                inputMode: 'numeric',
                style: { ...boxStyle, textAlign: 'start' },
              }}
              InputProps={{
                disableUnderline: true,
              }}
              fullWidth
              disabled={disableTextFields}
              onKeyDown={preventNumberSymbols}
              required
            />
          </div>
        </div>
        <div className='setting'>
          <div className='setting-label'>
            Rest
          </div>
          <div className={disableTextFields ? 'setting-time-disabled' : 'setting-time'}>
            <TextField
              variant='standard'
              type='number'
              value={restTimeMinutes}
              placeholder='MM'
              onChange={(e) => handleTimeChange(setRestTimeMinutes, e.target.value)}
              inputProps={{
                min: 0,
                max: 59,
                inputMode: 'numeric',
                style: { ...boxStyle, textAlign: 'end' },
              }}
              InputProps={{
                disableUnderline: true,
              }}
              fullWidth
              disabled={disableTextFields}
              onKeyDown={preventNumberSymbols}
              required
            />
            :
            <TextField
              variant='standard'
              type='number'
              value={restTimeSeconds}
              placeholder='SS'
              onChange={(e) => handleTimeChange(setRestTimeSeconds, e.target.value)}
              inputProps={{
                min: 0,
                max: 59,
                inputMode: 'numeric',
                style: { ...boxStyle, textAlign: 'start' },
              }}
              InputProps={{
                disableUnderline: true,
              }}
              fullWidth
              disabled={disableTextFields}
              onKeyDown={preventNumberSymbols}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;
