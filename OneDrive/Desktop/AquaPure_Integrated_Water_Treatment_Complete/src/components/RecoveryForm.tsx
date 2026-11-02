import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import type { ResourceRecoveryRecord } from "@/hooks/useResourceRecovery";

interface Props {
  editing?: ResourceRecoveryRecord | null;
  onDone?: () => void;
}

const empty = {
  date: new Date().toISOString().slice(0, 10),
  sludge_generated_kg: "",
  sludge_dry_solids_pct: "",
  biogas_yield_m3: "",
  methane_content_pct: "",
  reclaimed_water_m3: "",
  reuse_application: "irrigation",
  notes: "",
};

const RecoveryForm = ({ editing, onDone }: Props) => {
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (editing) {
      setForm({
        date: editing.date,
        sludge_generated_kg: String(editing.sludge_generated_kg),
        sludge_dry_solids_pct: String(editing.sludge_dry_solids_pct),
        biogas_yield_m3: String(editing.biogas_yield_m3),
        methane_content_pct: String(editing.methane_content_pct),
        reclaimed_water_m3: String(editing.reclaimed_water_m3),
        reuse_application: editing.reuse_application,
        notes: editing.notes ?? "",
      });
    } else {
      setForm({ ...empty });
    }
  }, [editing]);

  const handle = (k: keyof typeof form) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      date: form.date,
      sludge_generated_kg: Number(form.sludge_generated_kg) || 0,
      sludge_dry_solids_pct: Number(form.sludge_dry_solids_pct) || 0,
      biogas_yield_m3: Number(form.biogas_yield_m3) || 0,
      methane_content_pct: Number(form.methane_content_pct) || 0,
      reclaimed_water_m3: Number(form.reclaimed_water_m3) || 0,
      reuse_application: form.reuse_application,
      notes: form.notes || null,
    };
    const { error } = editing
      ? await supabase.from("resource_recovery").update(payload).eq("id", editing.id)
      : await supabase.from("resource_recovery").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Record updated" : "Record created");
    qc.invalidateQueries({ queryKey: ["resource-recovery"] });
    setForm({ ...empty });
    onDone?.();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">
          {editing ? "Update Recovery Record" : "Add Recovery Record"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={handle("date")} required />
          </div>
          <div className="space-y-2">
            <Label>Sludge Generated (kg)</Label>
            <Input type="number" step="0.01" value={form.sludge_generated_kg} onChange={handle("sludge_generated_kg")} required />
          </div>
          <div className="space-y-2">
            <Label>Dry Solids (%)</Label>
            <Input type="number" step="0.01" value={form.sludge_dry_solids_pct} onChange={handle("sludge_dry_solids_pct")} required />
          </div>
          <div className="space-y-2">
            <Label>Biogas Yield (m³)</Label>
            <Input type="number" step="0.01" value={form.biogas_yield_m3} onChange={handle("biogas_yield_m3")} required />
          </div>
          <div className="space-y-2">
            <Label>Methane Content (%)</Label>
            <Input type="number" step="0.01" value={form.methane_content_pct} onChange={handle("methane_content_pct")} required />
          </div>
          <div className="space-y-2">
            <Label>Reclaimed Water (m³)</Label>
            <Input type="number" step="0.01" value={form.reclaimed_water_m3} onChange={handle("reclaimed_water_m3")} required />
          </div>
          <div className="space-y-2">
            <Label>Reuse Application</Label>
            <Select value={form.reuse_application} onValueChange={handle("reuse_application")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="irrigation">Irrigation</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="cooling">Cooling</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="groundwater_recharge">Groundwater Recharge</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={handle("notes")} rows={2} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2 justify-end">
            {editing && (
              <Button type="button" variant="outline" onClick={() => onDone?.()}>Cancel</Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RecoveryForm;
