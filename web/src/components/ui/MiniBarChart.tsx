'use client';

/**
 * 미니 바 차트 — 외부 라이브러리 없이 SVG로 구현
 * 주간/월간 학습 통계 시각화용
 */

type BarData = {
  label: string;
  value: number;
  highlight?: boolean;
};

type Props = {
  data: BarData[];
  height?: number;
  barColor?: string;
  highlightColor?: string;
  className?: string;
};

export function MiniBarChart({
  data,
  height = 80,
  barColor = 'var(--primary)',
  highlightColor = 'var(--primary-600)',
  className = '',
}: Props) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(8, Math.min(24, Math.floor(200 / data.length)));
  const gap = Math.max(2, Math.min(6, Math.floor(barWidth / 4)));
  const svgWidth = data.length * (barWidth + gap) - gap;
  const labelH = 16;
  const totalH = height + labelH;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${totalH}`}
      width="100%"
      height={totalH}
      className={className}
      role="img"
      aria-label="학습 통계 차트"
    >
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * height;
        const x = i * (barWidth + gap);
        const y = height - barH;
        const fill = d.highlight ? highlightColor : barColor;

        return (
          <g key={i}>
            {/* 바 */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barH, 1)}
              rx={barWidth / 4}
              fill={fill}
              opacity={d.value > 0 ? 0.85 : 0.15}
            />
            {/* 값 */}
            {d.value > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 3}
                textAnchor="middle"
                fontSize={8}
                fill="var(--muted)"
                fontWeight={700}
              >
                {d.value}
              </text>
            )}
            {/* 라벨 */}
            <text
              x={x + barWidth / 2}
              y={height + labelH - 3}
              textAnchor="middle"
              fontSize={8}
              fill="var(--muted)"
              fontWeight={d.highlight ? 800 : 400}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
