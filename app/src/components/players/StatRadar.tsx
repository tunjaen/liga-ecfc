interface StatRadarProps {
  defense: number;
  attack: number;
  fitness: number;
  technique: number;
  iq: number;
  size?: number;
}

export function StatRadar({ defense, attack, fitness, technique, iq, size = 220 }: StatRadarProps) {
  const center = size / 2;
  const maxRadius = (size / 2) * 0.65; // Reduced from 0.75 to leave more padding for labels

  // Pentagon: 5 axes evenly spaced, starting from top
  const numAxes = 5;
  const angles = Array.from({ length: numAxes }, (_, i) =>
    -Math.PI / 2 + (2 * Math.PI * i) / numAxes
  );

  const labels = [
    { name: 'DEF', value: defense, color: 'var(--accent-primary)' },
    { name: 'ATK', value: attack, color: 'var(--accent-danger)' },
    { name: 'TEC', value: technique, color: '#f59e0b' },
    { name: 'IQ', value: iq, color: '#a78bfa' },
    { name: 'FIT', value: fitness, color: 'var(--accent-secondary)' },
  ];

  // Generate grid lines (polygons at 25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1];

  // Generate polygon points for the stat values
  const statPoints = labels.map((stat, i) => {
    const r = (stat.value / 10) * maxRadius;
    const x = center + r * Math.cos(angles[i]);
    const y = center + r * Math.sin(angles[i]);
    return `${x},${y}`;
  });

  return (
    <div className="stat-radar" style={{ width: '100%', height: '100%', maxWidth: size, maxHeight: size, margin: '0 auto' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        {/* Grid polygons */}
        {gridLevels.map((level) => {
          const points = angles
            .map((angle) => {
              const r = level * maxRadius;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            })
            .join(' ');
          return (
            <polygon
              key={level}
              points={points}
              fill="none"
              stroke="rgba(110, 110, 110, 0.99)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {angles.map((angle, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + maxRadius * Math.cos(angle)}
            y2={center + maxRadius * Math.sin(angle)}
            stroke="rgba(0, 0, 0, 0.4)"
            strokeWidth="1"
          />
        ))}

        {/* Stat polygon */}
        <polygon
          points={statPoints.join(' ')}
          fill="rgba(73, 121, 197, 0.4)"
          stroke="var(--accent-primary)"
          strokeWidth="1"
        />

        {/* Stat dots */}
        {labels.map((stat, i) => {
          const r = (stat.value / 10) * maxRadius;
          const x = center + r * Math.cos(angles[i]);
          const y = center + r * Math.sin(angles[i]);
          return (
            <circle
              key={stat.name}
              cx={x}
              cy={y}
              r={3}
              fill={stat.color}
              stroke="rgba(99, 99, 99, 0.95)"
              strokeWidth="2"
            />
          );
        })}

        {/* Labels */}
        {labels.map((stat, i) => {
          const labelR = maxRadius + 15;
          const x = center + labelR * Math.cos(angles[i]);
          const y = center + labelR * Math.sin(angles[i]);
          return (
            <text
              key={stat.name}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={stat.color}
              fontSize="10"
              fontWeight="700"
            >
              {stat.name} {stat.value}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
