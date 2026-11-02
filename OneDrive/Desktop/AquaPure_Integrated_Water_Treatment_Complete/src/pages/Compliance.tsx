import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  Shield,
  Droplets,
  Activity,
  TrendingUp
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface ComplianceParameter {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
  epaLimit: number;
  whoLimit: number;
  status: "compliant" | "warning" | "violation";
  lastUpdated: string;
}

interface Standard {
  id: string;
  name: string;
  organization: string;
  compliance: number;
  parametersChecked: number;
  violations: number;
  lastAudit: string;
}

const complianceData: ComplianceParameter[] = [
  { id: "P1", name: "pH Level", currentValue: 7.2, unit: "", epaLimit: 8.5, whoLimit: 8.5, status: "compliant", lastUpdated: "2 min ago" },
  { id: "P2", name: "Turbidity", currentValue: 0.8, unit: "NTU", epaLimit: 1.0, whoLimit: 1.0, status: "compliant", lastUpdated: "2 min ago" },
  { id: "P3", name: "Chlorine Residual", currentValue: 1.2, unit: "mg/L", epaLimit: 4.0, whoLimit: 5.0, status: "compliant", lastUpdated: "2 min ago" },
  { id: "P4", name: "Total Dissolved Solids", currentValue: 285, unit: "mg/L", epaLimit: 500, whoLimit: 600, status: "compliant", lastUpdated: "5 min ago" },
  { id: "P5", name: "Nitrate", currentValue: 8.5, unit: "mg/L", epaLimit: 10, whoLimit: 50, status: "warning", lastUpdated: "10 min ago" },
  { id: "P6", name: "Lead", currentValue: 0.012, unit: "mg/L", epaLimit: 0.015, whoLimit: 0.01, status: "warning", lastUpdated: "1 hour ago" },
  { id: "P7", name: "Arsenic", currentValue: 0.002, unit: "mg/L", epaLimit: 0.01, whoLimit: 0.01, status: "compliant", lastUpdated: "1 hour ago" },
  { id: "P8", name: "Fluoride", currentValue: 0.8, unit: "mg/L", epaLimit: 4.0, whoLimit: 1.5, status: "compliant", lastUpdated: "30 min ago" },
  { id: "P9", name: "Coliform Bacteria", currentValue: 0, unit: "CFU/100mL", epaLimit: 0, whoLimit: 0, status: "compliant", lastUpdated: "4 hours ago" },
  { id: "P10", name: "Copper", currentValue: 1.5, unit: "mg/L", epaLimit: 1.3, whoLimit: 2.0, status: "violation", lastUpdated: "2 hours ago" },
];

const standardsData: Standard[] = [
  { id: "S1", name: "Safe Drinking Water Act (SDWA)", organization: "EPA", compliance: 96, parametersChecked: 90, violations: 2, lastAudit: "2024-01-10" },
  { id: "S2", name: "WHO Drinking Water Guidelines", organization: "WHO", compliance: 98, parametersChecked: 85, violations: 1, lastAudit: "2024-01-08" },
  { id: "S3", name: "State Water Quality Standards", organization: "State DEP", compliance: 100, parametersChecked: 45, violations: 0, lastAudit: "2024-01-05" },
];

const Compliance = () => {
  const [selectedStandard, setSelectedStandard] = useState<string>("all");

  const compliantCount = complianceData.filter(p => p.status === "compliant").length;
  const warningCount = complianceData.filter(p => p.status === "warning").length;
  const violationCount = complianceData.filter(p => p.status === "violation").length;
  const overallCompliance = (compliantCount / complianceData.length) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="w-4 h-4 text-secondary" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "violation":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "text-secondary bg-secondary/10 border-secondary/30";
      case "warning":
        return "text-amber-500 bg-amber-500/10 border-amber-500/30";
      case "violation":
        return "text-destructive bg-destructive/10 border-destructive/30";
      default:
        return "text-muted-foreground bg-muted/10 border-border";
    }
  };

  const getComplianceBar = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    let color = "bg-secondary";
    if (percentage > 90) color = "bg-destructive";
    else if (percentage > 75) color = "bg-amber-500";
    return { percentage: Math.min(percentage, 100), color };
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Effluent Discharge Compliance
            </h1>
            <p className="text-muted-foreground">
              Compare effluent readings against EPA, NPDES, and WHO discharge limits
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              View Regulations
            </Button>
            <Button variant="glow">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-sm text-muted-foreground">Overall Compliance</span>
            </div>
            <div className="font-display text-2xl font-bold text-secondary">
              {overallCompliance.toFixed(0)}%
            </div>
            <Progress value={overallCompliance} className="h-1 mt-2" />
          </div>
          
          <div className="p-5 rounded-xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-sm text-muted-foreground">Compliant</span>
            </div>
            <div className="font-display text-2xl font-bold text-secondary">
              {compliantCount} <span className="text-base text-muted-foreground">parameters</span>
            </div>
          </div>
          
          <div className="p-5 rounded-xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-sm text-muted-foreground">Warnings</span>
            </div>
            <div className="font-display text-2xl font-bold text-amber-500">
              {warningCount} <span className="text-base text-muted-foreground">parameters</span>
            </div>
          </div>
          
          <div className="p-5 rounded-xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <span className="text-sm text-muted-foreground">Violations</span>
            </div>
            <div className="font-display text-2xl font-bold text-destructive">
              {violationCount} <span className="text-base text-muted-foreground">parameters</span>
            </div>
          </div>
        </div>

        {/* Regulatory Standards Overview */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Regulatory Standards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standardsData.map((standard) => (
              <div key={standard.id} className="p-5 rounded-xl gradient-card border border-border/50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{standard.name}</h3>
                    <p className="text-xs text-muted-foreground">{standard.organization}</p>
                  </div>
                  <span className={`text-lg font-bold ${standard.compliance >= 95 ? 'text-secondary' : standard.compliance >= 80 ? 'text-amber-500' : 'text-destructive'}`}>
                    {standard.compliance}%
                  </span>
                </div>
                
                <Progress value={standard.compliance} className="h-2 mb-3" />
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Parameters</span>
                    <p className="font-medium text-foreground">{standard.parametersChecked}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Violations</span>
                    <p className={`font-medium ${standard.violations > 0 ? 'text-destructive' : 'text-secondary'}`}>{standard.violations}</p>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                  Last Audit: {standard.lastAudit}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Parameters Table */}
        <div className="p-6 rounded-2xl gradient-card border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                Parameter Compliance Status
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {["all", "compliant", "warning", "violation"].map((filter) => (
                <Button
                  key={filter}
                  variant={selectedStandard === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStandard(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Parameter</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Current Value</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">EPA Limit</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">WHO Limit</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">EPA Threshold</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Updated</th>
                </tr>
              </thead>
              <tbody>
                {complianceData
                  .filter(p => selectedStandard === "all" || p.status === selectedStandard)
                  .map((param) => {
                    const bar = getComplianceBar(param.currentValue, param.epaLimit);
                    return (
                      <tr key={param.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-foreground">{param.name}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-foreground">
                          {param.currentValue} {param.unit}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {param.epaLimit} {param.unit}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {param.whoLimit} {param.unit}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-24">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${bar.color}`}
                                style={{ width: `${bar.percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{bar.percentage.toFixed(0)}% of limit</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(param.status)}`}>
                            {getStatusIcon(param.status)}
                            {param.status.charAt(0).toUpperCase() + param.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{param.lastUpdated}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Compliance;
