import '../styles/Timer.css';
import { useEffect, useState } from 'react';
import { Box, IconButton, TextField } from '@mui/material';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';

const renderTime = ({ remainingTime }: { remainingTime: number }) => {
  if (remainingTime === 0) {
    return <div className="timer-label">Complete!</div>;
  }

  if (remainingTime >= 60) {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return (
      <div className="timer-label">
        <div className="text">Remaining</div>
        <div className="value">
          {formattedMinutes}:{formattedSeconds}
        </div>
        <div className="text">minutes</div>
      </div>
    );
  } else {
    return (
      <div className="timer-label">
        <div className="text">Remaining</div>
        <div className="value">{remainingTime}</div>
        <div className="text">seconds</div>
      </div>
    );
  }
};

const Timer = () => {
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(time);
  const [key, setKey] = useState(0);
  const [isHangTime, setIsHangTime] = useState<boolean>(true);
  const [currentInterval, setCurrentInterval] = useState<number>(1);

  const [intervals, setIntervals] = useState<number | string>(1);
  const [hangTimeMinutes, setHangTimeMinutes] = useState<number | string>('00');
  const [hangTimeSeconds, setHangTimeSeconds] = useState<number | string>('10');
  const [restTimeMinutes, setRestTimeMinutes] = useState<number | string>('00');
  const [restTimeSeconds, setRestTimeSeconds] = useState<number | string>('45');

  useEffect(() => {
    const totalHangTime =
      (parseInt(hangTimeMinutes as string, 10) || 0) * 60 +
      (parseInt(hangTimeSeconds as string, 10) || 0);

    setTime(totalHangTime);
  }, [hangTimeMinutes, hangTimeSeconds]);

  useEffect(() => {
    if (time === 0 && isRunning) {
      if (isHangTime) {
        // Switch to rest time
        console.log('Rest time');
        const totalRestTime =
          (parseInt(restTimeMinutes as string, 10) || 0) * 60 +
          (parseInt(restTimeSeconds as string, 10) || 0);
        setTime(totalRestTime);
        setIsHangTime(false);
      } else {
        // Finish current interval and check if more intervals are left
        if (currentInterval < parseInt(intervals as string, 10)) {
          setCurrentInterval(currentInterval + 1);
          const totalHangTime =
            (parseInt(hangTimeMinutes as string, 10) || 0) * 60 +
            (parseInt(hangTimeSeconds as string, 10) || 0);
          setTime(totalHangTime);
          setIsHangTime(true);
        } else {
          // All intervals completed
          setIsRunning(false);
          setCurrentInterval(1); // Reset intervals if desired
        }
      }
      resetTimer();
    }
  }, [time, isRunning, isHangTime, currentInterval, intervals, hangTimeMinutes, hangTimeSeconds, restTimeMinutes, restTimeSeconds]);

  const toggleTimer = () => {
    setIsRunning(prevState => !prevState);
  };

  const resetTimer = () => {
    setProgress(time);
    setKey(prevKey => prevKey + 1);
  };

  const handleChange = (
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

  return (
    <div className="timer-container">
      <h1>Hangboard Timer</h1>
      <div className="timer">
        <CountdownCircleTimer
          key={key}
          isPlaying={isRunning}
          duration={progress}
          colors={['#FFFFFF', '#FF0000']}
          colorsTime={[10, 0]}
          trailColor="#4b5769"
          size={350}
          onComplete={() => { setIsRunning(false) }}
        >
          {renderTime}
        </CountdownCircleTimer>
      </div>
      <div className="timer-controls">
        <IconButton onClick={toggleTimer} sx={{ color: 'white' }}>
          {isRunning ? (
            <PauseRoundedIcon sx={{ height: '70px', width: '70px' }} />
          ) : (
            <PlayArrowRoundedIcon sx={{ height: '70px', width: '70px' }} />
          )}
        </IconButton>
        <IconButton onClick={resetTimer} sx={{ color: 'white' }}>
          <RestartAltRoundedIcon sx={{ height: '70px', width: '70px' }} />
        </IconButton>
      </div>
      <div className="timer-settings">
        <div>
          <p>Intervals</p>
          <Box display="flex" alignItems="center" width={140}>
            <TextField
              type="number"
              value={intervals}
              onChange={(e) => handleChange(setIntervals, e.target.value)}
              placeholder="1"
              inputProps={{
                min: 1,
                style: {
                  color: 'white',
                  backgroundColor: '#4b5769',
                  borderRadius: '5px',
                },
              }}
            />
          </Box>
        </div>
        <div>
          <p>Hang</p>
          <Box display="flex" alignItems="center">
            <TextField
              type="number"
              value={hangTimeMinutes}
              variant="outlined"
              placeholder="MM"
              onChange={(e) => handleChange(setHangTimeMinutes, e.target.value)}
              inputProps={{
                min: 0,
                max: 59,
                style: {
                  color: 'white',
                  backgroundColor: '#4b5769',
                  borderRadius: '5px',
                  textAlign: 'center',
                },
              }}
              sx={{ width: 60, marginRight: 1 }}
            />
            :
            <TextField
              type="number"
              value={hangTimeSeconds}
              variant="outlined"
              placeholder="SS"
              onChange={(e) => handleChange(setHangTimeSeconds, e.target.value)}
              inputProps={{
                min: 0,
                max: 59,
                style: {
                  color: 'white',
                  backgroundColor: '#4b5769',
                  borderRadius: '5px',
                  textAlign: 'center',
                },
              }}
              sx={{ width: 60, marginLeft: 1 }}
            />
          </Box>
        </div>
        <div>
          <p>Rest</p>
          <Box display="flex" alignItems="center">
            <TextField
              type="number"
              value={restTimeMinutes}
              variant="outlined"
              placeholder="MM"
              onChange={(e) => handleChange(setRestTimeMinutes, e.target.value)}
              inputProps={{
                min: 0,
                max: 59,
                style: {
                  color: 'white',
                  backgroundColor: '#4b5769',
                  borderRadius: '5px',
                  textAlign: 'center',
                },
              }}
              sx={{ width: 60, marginRight: 1 }}
            />
            :
            <TextField
              type="number"
              value={restTimeSeconds}
              variant="outlined"
              placeholder="SS"
              onChange={(e) => handleChange(setRestTimeSeconds, e.target.value)}
              inputProps={{
                min: 0,
                max: 59,
                style: {
                  color: 'white',
                  backgroundColor: '#4b5769',
                  borderRadius: '5px',
                  textAlign: 'center',
                },
              }}
              sx={{ width: 60, marginLeft: 1 }}
            />
          </Box>
        </div>
      </div>
    </div>
  );
};

export default Timer;
