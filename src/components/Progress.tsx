import '../styles/Progress.css'; // Import the CSS file

const Progress = ({ current, max }: { current: number, max: number }) => {
  const segmentAngle = 360 / max;
  const radius = 16;
  const strokeWidth = 1.3;
  const gap = 10;
  const offsetAngle = -85;

  const createSegment = (index: number, isFilled: boolean) => {
    const startAngle = index * segmentAngle + offsetAngle;
    const endAngle = startAngle + segmentAngle - gap;

    const startX = 18 + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = 18 + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = 18 + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = 18 + radius * Math.sin((endAngle * Math.PI) / 180);

    const pathData = `
      M ${startX} ${startY}
      A ${radius} ${radius} 0 0 1 ${endX} ${endY}
    `;

    return (
      <path
        key={index}
        d={pathData}
        fill="none"
        stroke={isFilled ? '#FFFFFF' : '#4b5769'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
  };

  return (
    <div className="progress-circle">
      <svg viewBox="0 0 36 36">
        {Array.from({ length: max }).map((_, i) => createSegment(i, i < current))}
      </svg>
    </div>
  );
};

export default Progress;
