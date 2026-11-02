import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SensorChartProps {
  title: string;
  dataKey: string;
  color: string;
  unit: string;
  minValue: number;
  maxValue: number;
  baseValue: number;
}

const generateInitialData = (baseValue: number, variance: number) => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: `${i}s`,
    value: baseValue + (Math.random() - 0.5) * variance,
  }));
};

const SensorChart = ({
  title,
  dataKey,
  color,
  unit,
  minValue,
  maxValue,
  baseValue,
}: SensorChartProps) => {
  const variance = (maxValue - minValue) * 0.1;
  const [data, setData] = useState(() => generateInitialData(baseValue, variance));

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        const newData = [...prevData.slice(1)];
        const lastValue = newData[newData.length - 1]?.value || baseValue;
        const change = (Math.random() - 0.5) * variance * 0.5;
        let newValue = lastValue + change;
        
        // Keep value within bounds
        newValue = Math.max(minValue, Math.min(maxValue, newValue));
        
        newData.push({
          time: `${parseInt(newData[newData.length - 1]?.time || "0") + 1}s`,
          value: newValue,
        });
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [baseValue, minValue, maxValue, variance]);

  return (
    <div className="p-4 rounded-xl gradient-card border border-border/50 h-full">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display text-sm font-semibold text-foreground">{title}</h4>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[minValue, maxValue]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [value.toFixed(2), title]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              animationDuration={300}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SensorChart;
