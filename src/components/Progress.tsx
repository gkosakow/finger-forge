import '../styles/Progress.css'; // Import the CSS file

const Progress = ({ current, max }: { current: number, max: number }) => {
  const segmentAngle = 360 / max; // Calculate angle per segment
  const radius = 16; // Circle radius
  const strokeWidth = 1.3; // Stroke width for each segment
  const gap = max > 1 ? 10 : 0; // No gap if only one segment
  const offsetAngle = -85; // Start angle offset

  const createSegment = (index: number, isFilled: boolean) => {
    const startAngle = index * segmentAngle + offsetAngle; // Calculate start angle
    const endAngle = startAngle + segmentAngle - gap; // Calculate end angle considering the gap

    // Calculate start and end coordinates for the arc
    const startX = 18 + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = 18 + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = 18 + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = 18 + radius * Math.sin((endAngle * Math.PI) / 180);

    const pathData = `
      M ${startX} ${startY}
      A ${radius} ${radius} 0 ${segmentAngle > 180 ? 1 : 0} 1 ${endX} ${endY}
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
        {max === 1 ? (
          // Draw a full circle when max is 1
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke={current >= 1 ? '#FFFFFF' : '#4b5769'} // Fill based on current state
            strokeWidth={strokeWidth}
          />
        ) : (
          // Draw segments when max is greater than 1
          Array.from({ length: max }).map((_, i) =>
            createSegment(i, i < current) // Fill segments up to the current count
          )
        )}
      </svg>
    </div>
  );
};

export default Progress;
