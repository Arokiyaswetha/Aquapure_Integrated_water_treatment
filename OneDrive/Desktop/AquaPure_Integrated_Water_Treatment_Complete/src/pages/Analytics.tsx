import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  CalendarIcon,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Sidebar from "@/components/Sidebar";

// Generate historical data for the past 30 days
const generateHistoricalData = () => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, "MMM dd"),
      fullDate: date,
      ph: 7 + Math.random() * 0.5,
      temperature: 14 + Math.random() * 4,
      turbidity: 0.3 + Math.random() * 0.8,
      chlorine: 1.0 + Math.random() * 0.5,
      tds: 200 + Math.random() * 100,
      hardness: 100 + Math.random() * 50,
      purity: 98 + Math.random() * 2,
    });
  }
  return data;
};

const historicalData = generateHistoricalData();

const Analytics = () => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const filteredData = historicalData.filter((item) => {
    if (!dateRange.from || !dateRange.to) return true;
    return item.fullDate >= dateRange.from && item.fullDate <= dateRange.to;
  });

  const handleExport = (type: "csv" | "pdf") => {
    const filename = `aquapure-analytics-${format(new Date(), "yyyy-MM-dd")}.${type}`;
    
    if (type === "csv") {
      const headers = ["Date", "pH", "Temperature", "Turbidity", "Chlorine", "TDS", "Hardness", "Purity"];
      const csvContent = [
        headers.join(","),
        ...filteredData.map(row => 
          [row.date, row.ph.toFixed(2), row.temperature.toFixed(1), row.turbidity.toFixed(2), 
           row.chlorine.toFixed(2), row.tds.toFixed(0), row.hardness.toFixed(0), row.purity.toFixed(1)].join(",")
        )
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert(`PDF export would download: ${filename}`);
    }
  };

  // Calculate summary stats
  const avgPurity = filteredData.reduce((acc, d) => acc + d.purity, 0) / filteredData.length;
  const avgTurbidity = filteredData.reduce((acc, d) => acc + d.turbidity, 0) / filteredData.length;
  const avgChlorine = filteredData.reduce((acc, d) => acc + d.chlorine, 0) / filteredData.length;
  const avgTDS = filteredData.reduce((acc, d) => acc + d.tds, 0) / filteredData.length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Analytics
            </h1>
            <p className="text-muted-foreground">
              Historical wastewater treatment performance analysis and reporting
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {/* Export Buttons */}
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="glow" onClick={() => handleExport("pdf")}>
              <FileText className="w-4 h-4 mr-2" />
              PDF Report
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Avg. Purity", value: avgPurity.toFixed(1), unit: "%", trend: "+0.3%" },
            { label: "Avg. Turbidity", value: avgTurbidity.toFixed(2), unit: "NTU", trend: "-0.1" },
            { label: "Avg. Chlorine", value: avgChlorine.toFixed(2), unit: "mg/L", trend: "+0.05" },
            { label: "Avg. TDS", value: avgTDS.toFixed(0), unit: "ppm", trend: "-5" },
          ].map((stat) => (
            <div key={stat.label} className="p-5 rounded-xl gradient-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                  {stat.trend}
                </span>
              </div>
              <div className="font-display text-3xl font-bold text-foreground">
                {stat.value}<span className="text-lg text-muted-foreground">{stat.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Purity Trend */}
          <div className="p-6 rounded-2xl gradient-card border border-border/50">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              Water Purity Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData}>
                  <defs>
                    <linearGradient id="purityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[95, 100]}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="purity"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#purityGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Water Quality Parameters */}
          <div className="p-6 rounded-2xl gradient-card border border-border/50">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              Quality Parameters
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="turbidity"
                    name="Turbidity (NTU)"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="chlorine"
                    name="Chlorine (mg/L)"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Flow Rate & Sensor Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TDS Bar Chart */}
          <div className="p-6 rounded-2xl gradient-card border border-border/50">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              Daily TDS Levels
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value.toFixed(0)} ppm`, "TDS"]}
                  />
                  <Bar 
                    dataKey="tds" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* pH & Temperature */}
          <div className="p-6 rounded-2xl gradient-card border border-border/50">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              pH & Temperature
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="ph"
                    name="pH"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature (°C)"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;