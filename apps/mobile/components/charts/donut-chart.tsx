import Svg, { Circle } from 'react-native-svg';

export type DonutSegment = { value: number; color: string };

type Props = {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
};

export function DonutChart({ segments, size = 180, strokeWidth = 26 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  let offset = 0;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#EEF2F4"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {segments.map((segment, i) => {
        const length = (segment.value / total) * circumference;
        const circle = (
          <Circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            stroke={segment.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        );
        offset += length;
        return circle;
      })}
    </Svg>
  );
}
