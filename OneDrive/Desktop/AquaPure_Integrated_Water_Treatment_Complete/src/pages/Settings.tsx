import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Bell,
  User,
  Lock,
  Palette,
  Database,
  Mail,
  Smartphone,
  Globe,
  Save,
  RefreshCw,
  TrendingUp,
  Activity,
  Zap
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";

const Settings = () => {
  // User Preferences
  const [displayName, setDisplayName] = useState("Plant Operator");
  const [email, setEmail] = useState("operator@aquapure.com");
  const [timezone, setTimezone] = useState("UTC+1");
  const [language, setLanguage] = useState("English");
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [alertSounds, setAlertSounds] = useState(false);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  
  // System Configuration
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("30");
  const [dataRetention, setDataRetention] = useState("90");
  const [darkMode, setDarkMode] = useState(true);
  const [compactView, setCompactView] = useState(false);

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleResetDefaults = () => {
    setEmailNotifications(true);
    setPushNotifications(true);
    setAlertSounds(false);
    setCriticalAlerts(true);
    setDailyDigest(true);
    setWeeklyReports(true);
    setAutoRefresh(true);
    setRefreshInterval("30");
    setDataRetention("90");
    setDarkMode(true);
    setCompactView(false);
    toast({
      title: "Settings Reset",
      description: "All settings have been restored to defaults.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your preferences and system configuration
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleResetDefaults}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Defaults
            </Button>
            <Button variant="glow" onClick={handleSaveSettings}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Preferences */}
          <div className="p-6 rounded-2xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                User Preferences
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="p-6 rounded-2xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-secondary" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Security
              </h2>
            </div>
            
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Smartphone className="w-4 h-4 mr-2" />
                Enable Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Globe className="w-4 h-4 mr-2" />
                Manage Active Sessions
              </Button>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground">
                  Last login: Today at 9:42 AM from 192.168.1.1
                </p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="p-6 rounded-2xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Notifications
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="emailNotif" className="cursor-pointer">Email Notifications</Label>
                </div>
                <Switch
                  id="emailNotif"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="pushNotif" className="cursor-pointer">Push Notifications</Label>
                </div>
                <Switch
                  id="pushNotif"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="alertSounds" className="cursor-pointer">Alert Sounds</Label>
                </div>
                <Switch
                  id="alertSounds"
                  checked={alertSounds}
                  onCheckedChange={setAlertSounds}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-destructive" />
                  <Label htmlFor="criticalAlerts" className="cursor-pointer">Critical Alerts Only</Label>
                </div>
                <Switch
                  id="criticalAlerts"
                  checked={criticalAlerts}
                  onCheckedChange={setCriticalAlerts}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="dailyDigest" className="cursor-pointer">Daily Digest</Label>
                </div>
                <Switch
                  id="dailyDigest"
                  checked={dailyDigest}
                  onCheckedChange={setDailyDigest}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="weeklyReports" className="cursor-pointer">Weekly Reports</Label>
                </div>
                <Switch
                  id="weeklyReports"
                  checked={weeklyReports}
                  onCheckedChange={setWeeklyReports}
                />
              </div>
            </div>
          </div>

          {/* System Configuration */}
          <div className="p-6 rounded-2xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-chart-4" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                System Configuration
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="autoRefresh" className="cursor-pointer">Auto-Refresh Data</Label>
                </div>
                <Switch
                  id="autoRefresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
                <Input
                  id="refreshInterval"
                  type="number"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  className="bg-background/50"
                  disabled={!autoRefresh}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention (days)</Label>
                <Input
                  id="dataRetention"
                  type="number"
                  value={dataRetention}
                  onChange={(e) => setDataRetention(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="darkMode" className="cursor-pointer">Dark Mode</Label>
                </div>
                <Switch
                  id="darkMode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="compactView" className="cursor-pointer">Compact View</Label>
                </div>
                <Switch
                  id="compactView"
                  checked={compactView}
                  onCheckedChange={setCompactView}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-6 p-6 rounded-2xl border border-destructive/30 bg-destructive/5">
          <h3 className="font-display text-lg font-semibold text-destructive mb-4">
            Danger Zone
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
              Export All Data
            </Button>
            <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
              Delete Account
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;