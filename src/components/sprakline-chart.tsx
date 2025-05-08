import { Area, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import type { FC } from "react";

interface SparklineChartProps {
  data: number[];
  positive: boolean;
  className?: string;
}

const SparklineChart: FC<SparklineChartProps> = ({
  data,
  positive,
  className = "",
}) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="h-14 w-full bg-muted/20 rounded" />;
  }
  
  const chartData = data.map((value, index) => ({
    name: `Day ${index + 1}`,
    value,
  }));

  const strokeColor = `hsl(var(--${positive ? "chart-2" : "destructive"}))`;
  const gradientId = `sparklineGradient-${positive ? "positive" : "negative"}`;
  
  return (
    <div
      className={`relative h-14 ${className}`}
      aria-label="7-day price chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
          <YAxis 
            hide 
            domain={['dataMin - 1%', 'dataMax + 1%']} 
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "var(--radius)",
              fontSize: "0.75rem",
              padding: "0.25rem 0.5rem",
            }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            labelFormatter={() => ""}
            formatter={(value: string | number) => [
              `$${Number(value).toFixed(2)}`,
              "Price",
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill={`url(#${gradientId})`}
            fillOpacity={1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SparklineChart;