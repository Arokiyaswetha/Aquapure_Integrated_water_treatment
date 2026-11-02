import { useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import RecoveryForm from "@/components/RecoveryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Recycle, Flame, Droplets, Loader2, AlertTriangle, Sparkles, Pencil, RotateCcw,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { format, subDays } from "date-fns";
import { useResourceRecovery, type ResourceRecoveryRecord } from "@/hooks/useResourceRecovery";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];
const THRESH_KEY = "recovery-thresholds";

interface Thresholds { methaneMin: number; reclaimedMin: number; }
const defaultThresholds: Thresholds = { methaneMin: 55, reclaimedMin: 100 };

const loadThresholds = (): Thresholds => {
  try { return { ...defaultThresholds, ...JSON.parse(localStorage.getItem(THRESH_KEY) || "{}") }; }
  catch { return defaultThresholds; }
};

const Recovery = () => {
  const { isAdmin } = useAuth();
  const today = new Date();
  const [from, setFrom] = useState(format(subDays(today, 29), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(today, "yyyy-MM-dd"));
  const [thresholds, setThresholds] = useState<Thresholds>(loadThresholds());
  const [editing, setEditing] = useState<ResourceRecoveryRecord | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ summary: string; recommendations: { title: string; detail: string; priority: string }[] } | null>(null);

  const { data: records = [], isLoading, error } = useResourceRecovery({ from, to });

  const saveThresholds = (t: Thresholds) => {
    setThresholds(t);
    localStorage.setItem(THRESH_KEY, JSON.stringify(t));
    toast.success("Thresholds saved");
  };

  const chartData = records.map((r) => ({
    date: format(new Date(r.date), "MMM dd"),
    sludge: Number(r.sludge_generated_kg),
    biogas: Number(r.biogas_yield_m3),
    reclaimed: Number(r.reclaimed_water_m3),
    methane: Number(r.methane_content_pct),
  }));

  const totals = records.reduce((acc, r) => {
    acc.sludge += Number(r.sludge_generated_kg);
    acc.biogas += Number(r.biogas_yield_m3);
    acc.reclaimed += Number(r.reclaimed_water_m3);
    return acc;
  }, { sludge: 0, biogas: 0, reclaimed: 0 });

  const avgMethane = records.length
    ? records.reduce((a, r) => a + Number(r.methane_content_pct), 0) / records.length : 0;

  const reuseBreakdown = Object.entries(
    records.reduce<Record<string, number>>((acc, r) => {
      acc[r.reuse_application] = (acc[r.reuse_application] || 0) + Number(r.reclaimed_water_m3);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Math.round(value) }));

  // Alerts: any record below threshold within selected range
  const alerts = useMemo(() => {
    const list: { date: string; type: "methane" | "reclaimed"; value: number; threshold: number }[] = [];
    records.forEach((r) => {
      if (Number(r.methane_content_pct) < thresholds.methaneMin) {
        list.push({ date: r.date, type: "methane", value: Number(r.methane_content_pct), threshold: thresholds.methaneMin });
      }
      if (Number(r.reclaimed_water_m3) < thresholds.reclaimedMin) {
        list.push({ date: r.date, type: "reclaimed", value: Number(r.reclaimed_water_m3), threshold: thresholds.reclaimedMin });
      }
    });
    return list.slice(-8).reverse();
  }, [records, thresholds]);

  const generateRecommendations = async () => {
    if (records.length === 0) {
      toast.error("No data in selected range");
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("recovery-recommendations", {
        body: { records, thresholds },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiResult(data);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes("429")) toast.error("AI rate limit reached. Try again shortly.");
      else if (msg.includes("402")) toast.error("AI credits exhausted. Add credits to continue.");
      else toast.error("Failed to generate recommendations: " + msg);
    } finally {
      setAiLoading(false);
    }
  };

  const stats = [
    { label: "Total Sludge", value: `${(totals.sludge / 1000).toFixed(1)} t`, icon: Recycle, tone: "text-primary", bg: "bg-primary/10" },
    { label: "Biogas Yield", value: `${(totals.biogas / 1000).toFixed(2)}k m³`, icon: Flame, tone: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Reclaimed Water", value: `${(totals.reclaimed / 1000).toFixed(2)}k m³`, icon: Droplets, tone: "text-secondary", bg: "bg-secondary/10" },
    { label: "Avg Methane", value: `${avgMethane.toFixed(1)}%`, icon: Flame, tone: "text-accent", bg: "bg-accent/10" },
  ];

  const setQuickRange = (days: number) => {
    setFrom(format(subDays(today, days - 1), "yyyy-MM-dd"));
    setTo(format(today, "yyyy-MM-dd"));
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Sludge & Resource Recovery</h1>
          <p className="text-muted-foreground">Track sludge, biogas, methane and reclaimed water with AI-driven insights</p>
        </div>

        {/* Filters + thresholds */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4 flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>7d</Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>30d</Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(90)}>90d</Button>
            </div>
            <div className="flex-1" />
            <div className="space-y-1">
              <Label className="text-xs">Methane min (%)</Label>
              <Input type="number" value={thresholds.methaneMin}
                onChange={(e) => setThresholds({ ...thresholds, methaneMin: Number(e.target.value) })}
                className="w-28" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reclaimed min (m³)</Label>
              <Input type="number" value={thresholds.reclaimedMin}
                onChange={(e) => setThresholds({ ...thresholds, reclaimedMin: Number(e.target.value) })}
                className="w-28" />
            </div>
            <Button size="sm" onClick={() => saveThresholds(thresholds)}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => saveThresholds(defaultThresholds)}>
              <RotateCcw className="w-3 h-3 mr-1" />Reset
            </Button>
          </CardContent>
        </Card>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Threshold breaches detected ({alerts.length})</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-sm">
                {alerts.map((a, i) => (
                  <li key={i}>
                    <span className="font-medium">{format(new Date(a.date), "MMM dd")}</span>{" — "}
                    {a.type === "methane"
                      ? `Methane ${a.value.toFixed(1)}% < ${a.threshold}%`
                      : `Reclaimed water ${a.value.toFixed(1)} m³ < ${a.threshold} m³`}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load recovery data.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.label} className="bg-card border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${s.tone}`} />
                        </div>
                        <span className="text-sm text-muted-foreground">{s.label}</span>
                      </div>
                      <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* AI Recommendations */}
            <Card className="bg-card border-border mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Process Recommendations
                </CardTitle>
                <Button size="sm" onClick={generateRecommendations} disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {aiResult ? "Regenerate" : "Generate"}
                </Button>
              </CardHeader>
              <CardContent>
                {!aiResult && !aiLoading && (
                  <p className="text-sm text-muted-foreground">
                    Click Generate to receive AI-driven process adjustments based on the selected period's sludge, biogas, and methane trends.
                  </p>
                )}
                {aiLoading && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing recovery trends...
                  </div>
                )}
                {aiResult && (
                  <div className="space-y-4">
                    {aiResult.summary && (
                      <p className="text-sm text-foreground/90">{aiResult.summary}</p>
                    )}
                    <div className="space-y-3">
                      {(aiResult.recommendations || []).map((rec, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-foreground">{rec.title}</h4>
                            <Badge variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{rec.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-foreground">Sludge Generation (kg/day)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="sludgeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        <Area type="monotone" dataKey="sludge" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#sludgeGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-foreground">Biogas Yield (m³/day)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        <Bar dataKey="biogas" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} opacity={0.85} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="bg-card border-border lg:col-span-2">
                <CardHeader><CardTitle className="text-foreground">Reclaimed Water & Methane</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="reclaimed" name="Reclaimed (m³)" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="methane" name="Methane %" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-foreground">Reuse Application Mix</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={reuseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {reuseBreakdown.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin section */}
            {isAdmin && (
              <div className="space-y-6">
                <RecoveryForm editing={editing} onDone={() => setEditing(null)} />

                <Card className="bg-card border-border">
                  <CardHeader><CardTitle className="text-foreground">Records ({records.length})</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Sludge (kg)</TableHead>
                          <TableHead>Biogas (m³)</TableHead>
                          <TableHead>Methane %</TableHead>
                          <TableHead>Reclaimed (m³)</TableHead>
                          <TableHead>Reuse</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...records].reverse().map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{format(new Date(r.date), "MMM dd, yyyy")}</TableCell>
                            <TableCell>{Number(r.sludge_generated_kg).toFixed(1)}</TableCell>
                            <TableCell>{Number(r.biogas_yield_m3).toFixed(1)}</TableCell>
                            <TableCell>{Number(r.methane_content_pct).toFixed(1)}</TableCell>
                            <TableCell>{Number(r.reclaimed_water_m3).toFixed(1)}</TableCell>
                            <TableCell className="capitalize">{r.reuse_application.replace(/_/g, " ")}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Recovery;
