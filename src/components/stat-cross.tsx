interface StatRadarProps {
  stats: {
    top: { label: string; value: number; max: number };
    right: { label: string; value: number; max: number };
    bottom: { label: string; value: number; max: number };
    left: { label: string; value: number; max: number };
  };
  centerLabel?: string;
  className?: string;
}

export function StatRadar({
  stats,
  centerLabel,
  className = "",
}: StatRadarProps) {
  // Calculate positions on 0-100 scale (for SVG viewBox)
  const center = 50;
  const maxRadius = 40; // Max distance from center
  const labelOffset = 48; // Distance for labels

  // Normalize values to percentages (0-1)
  const topPct = Math.min(stats.top.value / stats.top.max, 1);
  const rightPct = Math.min(stats.right.value / stats.right.max, 1);
  const bottomPct = Math.min(stats.bottom.value / stats.bottom.max, 1);
  const leftPct = Math.min(stats.left.value / stats.left.max, 1);

  // Calculate actual positions
  const points = {
    top: { x: center, y: center - topPct * maxRadius },
    right: { x: center + rightPct * maxRadius, y: center },
    bottom: { x: center, y: center + bottomPct * maxRadius },
    left: { x: center - leftPct * maxRadius, y: center },
  };

  // Create path for the filled area
  const path = `M ${points.top.x} ${points.top.y} L ${points.right.x} ${points.right.y} L ${points.bottom.x} ${points.bottom.y} L ${points.left.x} ${points.left.y} Z`;

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full max-w-[280px] mx-auto aspect-square"
      >
        {/* Background grid lines */}
        <line
          x1={center}
          y1={center - maxRadius}
          x2={center}
          y2={center + maxRadius}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-muted-foreground/20"
        />
        <line
          x1={center - maxRadius}
          y1={center}
          x2={center + maxRadius}
          y2={center}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-muted-foreground/20"
        />

        {/* Background circles for scale reference */}
        <circle
          cx={center}
          cy={center}
          r={maxRadius * 0.25}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
          className="text-muted-foreground/10"
        />
        <circle
          cx={center}
          cy={center}
          r={maxRadius * 0.5}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
          className="text-muted-foreground/10"
        />
        <circle
          cx={center}
          cy={center}
          r={maxRadius * 0.75}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
          className="text-muted-foreground/10"
        />
        <circle
          cx={center}
          cy={center}
          r={maxRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-muted-foreground/20"
        />

        {/* Filled area */}
        <path d={path} fill="currentColor" className="text-foreground/15" />

        {/* Border of filled area */}
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-foreground/60"
        />

        {/* Data points */}
        <circle
          cx={points.top.x}
          cy={points.top.y}
          r="2.5"
          fill="currentColor"
          className="text-foreground"
        />
        <circle
          cx={points.right.x}
          cy={points.right.y}
          r="2.5"
          fill="currentColor"
          className="text-foreground"
        />
        <circle
          cx={points.bottom.x}
          cy={points.bottom.y}
          r="2.5"
          fill="currentColor"
          className="text-foreground"
        />
        <circle
          cx={points.left.x}
          cy={points.left.y}
          r="2.5"
          fill="currentColor"
          className="text-foreground"
        />

        {/* Center point */}
        <circle
          cx={center}
          cy={center}
          r="3"
          fill="currentColor"
          className="text-muted-foreground/40"
        />
      </svg>

      {/* Labels positioned around the chart */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top label */}
        <div className="absolute -top-2 md:top-0 left-1/2 -translate-x-1/2 text-center">
          <span className="text-lg font-bold tabular-nums">
            {stats.top.value}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            {stats.top.label}
          </span>
        </div>

        {/* Right label */}
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-right pr-1">
          <span className="text-lg font-bold tabular-nums">
            {stats.right.value}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            {stats.right.label}
          </span>
        </div>

        {/* Bottom label */}
        <div className="absolute -bottom-2 md:bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className="text-lg font-bold tabular-nums">
            {stats.bottom.value}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            {stats.bottom.label}
          </span>
        </div>

        {/* Left label */}
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-left pl-1 flex flex-col items-start">
          <span className="text-lg font-bold tabular-nums">
            {stats.left.value}
          </span>
          <span className="text-xs text-muted-foreground mr-1">
            {stats.left.label}
          </span>
        </div>

        {/* Center label */}
        {centerLabel && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {centerLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCrossCompactProps {
  stats: Array<{
    label: string;
    value: string | number;
    position: "top" | "right" | "bottom" | "left";
  }>;
  centerValue?: string | number;
  centerLabel?: string;
  className?: string;
}

export function StatCrossCompact({
  stats,
  centerValue,
  centerLabel,
  className = "",
}: StatCrossCompactProps) {
  const getStatByPosition = (pos: "top" | "right" | "bottom" | "left") =>
    stats.find((s) => s.position === pos) || { label: "", value: "" };

  return (
    <div className={`grid grid-cols-3 gap-1 text-center ${className}`}>
      {/* Row 1 */}
      <div />
      <div className="flex flex-col items-center py-2">
        <span className="text-lg font-bold tabular-nums">
          {getStatByPosition("top").value}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {getStatByPosition("top").label}
        </span>
      </div>
      <div />

      {/* Row 2 */}
      <div className="flex flex-col items-center justify-center py-2">
        <span className="text-lg font-bold tabular-nums">
          {getStatByPosition("left").value}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {getStatByPosition("left").label}
        </span>
      </div>
      <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg py-3">
        {centerValue !== undefined && (
          <>
            <span className="text-xl font-bold tabular-nums">
              {centerValue}
            </span>
            {centerLabel && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {centerLabel}
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex flex-col items-center justify-center py-2">
        <span className="text-lg font-bold tabular-nums">
          {getStatByPosition("right").value}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {getStatByPosition("right").label}
        </span>
      </div>

      {/* Row 3 */}
      <div />
      <div className="flex flex-col items-center py-2">
        <span className="text-lg font-bold tabular-nums">
          {getStatByPosition("bottom").value}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {getStatByPosition("bottom").label}
        </span>
      </div>
      <div />
    </div>
  );
}
