import { useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Download, Filter, Search, Calendar, Droplets,
  CheckCircle, AlertTriangle, Clock, Loader2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useTreatmentHistory } from "@/hooks/useTreatmentHistory";

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [treatmentFilter, setTreatmentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: treatmentHistory = [], isLoading, error } = useTreatmentHistory();

  const filteredHistory = treatmentHistory.filter((record) => {
    const matchesSearch =
      record.treatment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.operator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesTreatment = treatmentFilter === "all" || record.treatment_type === treatmentFilter;
    return matchesSearch && matchesStatus && matchesTreatment;
  });

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const paginatedHistory = useMemo(
    () => filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredHistory, currentPage, pageSize]
  );

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const totalVolume = treatmentHistory.reduce((acc, r) => acc + Number(r.volume_treated), 0);
  const completedCount = treatmentHistory.filter((r) => r.status === "completed").length;
  const avgPhImprovement = treatmentHistory.length
    ? treatmentHistory.reduce((acc, r) => acc + (Number(r.ph_after) - Number(r.ph_before)), 0) / treatmentHistory.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-2">
              Wastewater Treatment Reports
            </h1>
            <p className="text-muted-foreground">Track treatment history and effluent quality metrics</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Treatments</p>
                  <p className="text-2xl font-bold text-foreground">{treatmentHistory.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Volume Treated</p>
                  <p className="text-2xl font-bold text-foreground">{(totalVolume / 1000).toFixed(0)}K L</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Success Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {treatmentHistory.length ? ((completedCount / treatmentHistory.length) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Avg pH Improvement</p>
                  <p className="text-2xl font-bold text-foreground">+{avgPhImprovement.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, source, or operator..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10 bg-muted border-border"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
                <SelectTrigger className="w-full lg:w-48 bg-muted border-border">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={treatmentFilter} onValueChange={handleFilterChange(setTreatmentFilter)}>
                <SelectTrigger className="w-full lg:w-48 bg-muted border-border">
                  <Droplets className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Treatment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Treatments</SelectItem>
                  <SelectItem value="Reverse Osmosis">Reverse Osmosis</SelectItem>
                  <SelectItem value="UV Disinfection">UV Disinfection</SelectItem>
                  <SelectItem value="Chlorination">Chlorination</SelectItem>
                  <SelectItem value="Filtration">Filtration</SelectItem>
                  <SelectItem value="Chemical Treatment">Chemical Treatment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Treatment History Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Treatment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Failed to load treatment records.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">ID</TableHead>
                      <TableHead className="text-muted-foreground">Date</TableHead>
                      <TableHead className="text-muted-foreground">Treatment</TableHead>
                      <TableHead className="text-muted-foreground">Source</TableHead>
                      <TableHead className="text-muted-foreground">Volume</TableHead>
                      <TableHead className="text-muted-foreground">pH (Before → After)</TableHead>
                      <TableHead className="text-muted-foreground">Turbidity</TableHead>
                      <TableHead className="text-muted-foreground">TDS</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Operator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistory.map((record) => (
                      <TableRow key={record.id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-mono text-primary">{record.treatment_id}</TableCell>
                        <TableCell className="text-foreground">{record.date}</TableCell>
                        <TableCell className="text-foreground">{record.treatment_type}</TableCell>
                        <TableCell className="text-muted-foreground">{record.source}</TableCell>
                        <TableCell className="text-foreground">{Number(record.volume_treated).toLocaleString()} L</TableCell>
                        <TableCell className="text-foreground">
                          <span className="text-muted-foreground">{record.ph_before}</span> →{" "}
                          <span className="text-green-400">{record.ph_after}</span>
                        </TableCell>
                        <TableCell className="text-foreground">
                          <span className="text-muted-foreground">{record.turbidity_before}</span> →{" "}
                          <span className="text-green-400">{record.turbidity_after}</span>
                        </TableCell>
                        <TableCell className="text-foreground">
                          <span className="text-muted-foreground">{record.tds_before}</span> →{" "}
                          <span className="text-green-400">{record.tds_after}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{record.operator}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!isLoading && !error && filteredHistory.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No treatment records found matching your filters.</p>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !error && filteredHistory.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredHistory.length)} of {filteredHistory.length} records
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-foreground px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;
