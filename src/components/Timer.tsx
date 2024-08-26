import '../styles/Timer.css';
import useSound from 'use-sound';
import { useEffect, useState } from 'react';
import { IconButton, TextField } from '@mui/material';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';

type TimerStage = 'Not Started' | 'Hang' | 'Rest' | 'Complete';

const defaults = {
  intervals: 3,
  prepareTime: 3,
  hangMinutes: '00',
  hangSeconds: '10',
  restMinutes: '00',
  restSeconds: '30',
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
  const label = stage === 'Hang' ? 'HANG' : 'REST';

  if (isPreparing) {
    return (
      <div className='timer-label'>
        <div className='text'>Starting in</div>
        <div className='value'>{prepareTime}</div>
        <div className='text'>seconds...</div>
      </div>
    );
  };

  if (stage === 'Not Started') {
    return <div className='timer-label'>Press play button to begin!</div>;
  };

  if (stage === 'Complete') {
    return <div className='timer-label'>Complete!</div>;
  };

  if (remainingTime >= 60) {
    const { minutes, seconds } = formatTime(remainingTime);

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

const calculateDuration = (minute: number, seconds: number) => {
  return minute * 60 + seconds;
};

const Timer = () => {
  const [key, setKey] = useState(0);
  const [stage, setStage] = useState<TimerStage>('Not Started');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(defaults.prepareTime);
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

  // const [countdown] = useSound();

  // logic for handling preparation phase
  useEffect(() => {
    if (isPreparing && prepareTime > 0) {
      const timer = setInterval(() => {
        setPrepareTime((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (prepareTime === 0) {
      setIsPreparing(false);
      setPrepareTime(defaults.prepareTime);
      setIsRunning(true);
    }
  }, [isPreparing, prepareTime]);

  // logic for setting correct duration depending on stage
  useEffect(() => {
    switch (stage) {
      case 'Not Started':
        // do nothing
        break;
      case 'Hang':
        setIsGrowing(false);
        setDuration(calculateDuration(hangTimeMinutes as number || 0, hangTimeSeconds as number || 0));
        break;
      case 'Rest':
        setIsGrowing(true);
        setDuration(calculateDuration(restTimeMinutes as number || 0, restTimeSeconds as number || 0));
        break;
      case 'Complete':
        stop();
        setIsRunning(false);
        break;
    }
  }, [stage]);

  // play/pauses timer
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

  // resets timer
  const reset = () => {
    setStage('Not Started');
    setIsPreparing(false);
    setPrepareTime(defaults.prepareTime);
    setKey((prevKey) => prevKey + 1);
    setCurrentInterval(1);
    setDuration(calculateDuration(hangTimeMinutes as number, hangTimeSeconds as number));
  };

  // stops timer
  const stop = () => {
    setIsRunning(false);
  };

  // moves to next stage
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
    if (value === '') {
      setter('');
    } else {
      const numericValue = parseInt(value, 10);
      if (!isNaN(numericValue) && numericValue >= 0 && numericValue < 60) {
        setter(numericValue);
      }
    }
  };

  const handleIntervalChange = (
    setter: React.Dispatch<React.SetStateAction<number | string>>,
    value: string
  ) => {
    if (value === '') {
      setter('');
    } else {
      const numericValue = parseInt(value, 10);
      if (!isNaN(numericValue) && numericValue > 0 && numericValue <= 100) {
        setter(numericValue);
      }
    }
  };

  return (
    <div className='timer-container'>
      <h1>HangBoard Timer</h1>
      <CountdownCircleTimer
        key={key}
        isPlaying={isRunning}
        duration={duration}
        colors={['#FFFFFF', '#9999FF']}
        colorsTime={[10, 0]}
        trailColor='#4b5769'
        size={350}
        onComplete={nextStage}
        isGrowing={isGrowing}
        isSmoothColorTransition={false}
      >
        {({ remainingTime }) => renderTime(remainingTime, stage, isPreparing, prepareTime)}
      </CountdownCircleTimer>
      <div className='timer-controls'>
        <IconButton
          onClick={() => {
            stop();
            reset();
          }}
          sx={buttonStyle}
        >
          <StopRoundedIcon
            sx={buttonIconStyle}
          />
        </IconButton>
        <IconButton
          onClick={(stage !== 'Complete') ? toggleTimer : reset}
          sx={buttonStyle}
          disabled={isPreparing}
        >
          {isRunning ? (
            <PauseRoundedIcon sx={buttonIconStyle} />
          ) : (
            stage === 'Complete' ?
              <RestartAltRoundedIcon sx={{ ...buttonIconStyle, padding: '4px 8px 8px 8px' }} />
              :
              <PlayArrowRoundedIcon sx={buttonIconStyle} />
          )}
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
                max: 99,
                style: { ...boxStyle, textAlign: 'center' },
              }}
              InputProps={{
                disableUnderline: true,
              }}
              fullWidth
              disabled={disableTextFields}
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
                style: { ...boxStyle, textAlign: 'end' },
              }}
              InputProps={{
                disableUnderline: true,
              }}
              fullWidth
              disabled={disableTextFields}
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
                style: { ...boxStyle, textAlign: 'start' },
              }}
              InputProps={{
                disableUnderline: true,
              }}
              fullWidth
              disabled={disableTextFields}
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
                style: { ...boxStyle, textAlign: 'end' },
              }}
              InputProps={{
                disableUnderline: true,
              }}
              fullWidth
              disabled={disableTextFields}
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
                style: { ...boxStyle, textAlign: 'start' },
              }}
              InputProps={{
                disableUnderline: true,
              }}
              fullWidth
              disabled={disableTextFields}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;
