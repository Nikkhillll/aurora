"use client";

interface DialGaugeProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  color: string;
  size?: number;
}

export default function DialGauge({
  value,
  min,
  max,
  unit,
  label,
  color,
  size = 180,
}: DialGaugeProps) {
  // Gauge geometry: 240° arc, starting at 150° (bottom-left) ending at 390° (bottom-right)
  const startAngle = 150;
  const endAngle = 390;
  const totalSweep = endAngle - startAngle; // 240°

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 18;
  const trackWidth = 8;

  // Clamp value within range
  const clamped = Math.max(min, Math.min(max, value));
  const fraction = (clamped - min) / (max - min);
  const valueAngle = startAngle + fraction * totalSweep;

  // Convert degrees to radians for SVG arc math
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Get point on arc at given angle
  const pointOnArc = (angleDeg: number) => ({
    x: cx + radius * Math.cos(toRad(angleDeg)),
    y: cy + radius * Math.sin(toRad(angleDeg)),
  });

  // Build SVG arc path
  const arcPath = (fromDeg: number, toDeg: number) => {
    const start = pointOnArc(fromDeg);
    const end = pointOnArc(toDeg);
    const sweep = toDeg - fromDeg;
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  // Needle endpoint
  const needleLength = radius - 10;
  const needleTip = {
    x: cx + needleLength * Math.cos(toRad(valueAngle)),
    y: cy + needleLength * Math.sin(toRad(valueAngle)),
  };

  // Tick marks at 0%, 25%, 50%, 75%, 100%
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size * 0.78}
        viewBox={`0 0 ${size} ${size * 0.88}`}
        className="overflow-visible"
      >
        {/* Track arc (background) */}
        <path
          d={arcPath(startAngle, endAngle)}
          fill="none"
          stroke="#212B38"
          strokeWidth={trackWidth}
          strokeLinecap="round"
        />

        {/* Filled arc (value) */}
        {fraction > 0.005 && (
          <path
            d={arcPath(startAngle, valueAngle)}
            fill="none"
            stroke={color}
            strokeWidth={trackWidth}
            strokeLinecap="round"
            opacity={0.85}
          />
        )}

        {/* Tick marks */}
        {ticks.map((t) => {
          const angle = startAngle + t * totalSweep;
          const outer = pointOnArc(angle);
          const innerRadius = radius - 12;
          const inner = {
            x: cx + innerRadius * Math.cos(toRad(angle)),
            y: cy + innerRadius * Math.sin(toRad(angle)),
          };
          return (
            <line
              key={t}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#8592A3"
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={4} fill={color} />

        {/* Min label */}
        <text
          x={pointOnArc(startAngle).x - 4}
          y={pointOnArc(startAngle).y + 16}
          fill="#8592A3"
          fontSize={11}
          fontFamily="var(--font-jetbrains-mono), monospace"
          textAnchor="middle"
        >
          {min}
        </text>

        {/* Max label */}
        <text
          x={pointOnArc(endAngle).x + 4}
          y={pointOnArc(endAngle).y + 16}
          fill="#8592A3"
          fontSize={11}
          fontFamily="var(--font-jetbrains-mono), monospace"
          textAnchor="middle"
        >
          {max}
        </text>

        {/* Value readout */}
        <text
          x={cx}
          y={cy + 22}
          fill="#E7EDF3"
          fontSize={24}
          fontFamily="var(--font-jetbrains-mono), monospace"
          textAnchor="middle"
          fontWeight="600"
        >
          {value}
          <tspan fill="#8592A3" fontSize={14}>
            {unit}
          </tspan>
        </text>
      </svg>
      <span className="text-text-muted text-sm font-sans mt-1">{label}</span>
    </div>
  );
}
