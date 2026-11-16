"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import {
  Shield,
  UserPlus,
  Users,
  CheckCircle,
  XCircle,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
  KeyRound,
  FileSpreadsheet,
  Cloud,
  RefreshCw,
  FolderSync,
  CheckCircle2,
  AlertCircle,
  Camera,
  Check,
  Edit3,
  Lock,
  LogOut,
  Download,
  Heart,
  BarChart3,
  TrendingUp,
  Image as ImageIcon,
  UserCheck,
  Clock,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Guest, Photo } from "@/types";
import { AnalyticsData } from "@/lib/db/analytics";

interface DriveStatus {
  isConfigured: boolean;
  hasServiceAccountEmail: boolean;
  hasPrivateKey: boolean;
  folderId: string | null;
  clientEmail: string | null;
}

interface SyncStats {
  success: boolean;
  totalDiscovered: number;
  newAdded: number;
  updated: number;
  durationMs: number;
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "Never";
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatDatePretty(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function AdminPortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "guests" | "moderation" | "drive">("overview");

  // Storage failover test state
  const [storageTestStatus, setStorageTestStatus] = useState<any>(null);
  const [storageTestResult, setStorageTestResult] = useState<any>(null);
  const [isCheckingStorage, setIsCheckingStorage] = useState(false);
  const [isRunningDriveTest, setIsRunningDriveTest] = useState(false);

  // Analytics & Downloads States
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsSubTab, setAnalyticsSubTab] = useState<"downloads" | "logins">("downloads");
  const [downloadsSearch, setDownloadsSearch] = useState("");
  const [downloadsViewMode, setDownloadsViewMode] = useState<"feed" | "by_photo" | "by_guest">("feed");

  // Data states
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(true);

  // Drive sync states
  const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncStats | null>(null);
  const [isFlushing, setIsFlushing] = useState(false);
  const [flushMessage, setFlushMessage] = useState<string | null>(null);

  // Moderation Queue State
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([]);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [editingCaptionText, setEditingCaptionText] = useState("");

  // Dashboard Stats State
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // New Guest Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // CSV Import State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Check admin session on mount
  useEffect(() => {
    fetch("/api/admin/auth/check")
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(data.authenticated);
        if (data.authenticated) {
          loadAllAdminData();
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  const loadAllAdminData = () => {
    fetchGuests();
    fetchDriveStatus();
    fetchModerationQueue();
    fetchDashboardStats();
    fetchAnalyticsData();
  };

  const fetchAnalyticsData = async () => {
    try {
      setIsLoadingAnalytics(true);
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (data && !data.error) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setDashboardStats(data);
    } catch {}
  };

  const fetchGuests = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/guests");
      const data = await res.json();
      if (data?.guests) {
        setGuests(data.guests);
      }
    } catch (err) {
      console.error("Failed to load guests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDriveStatus = async () => {
    try {
      const res = await fetch("/api/admin/drive/status");
      const data = await res.json();
      setDriveStatus(data);
    } catch {}
  };

  const fetchModerationQueue = async () => {
    try {
      const res = await fetch("/api/admin/moderation");
      const data = await res.json();
      if (data?.pending) {
        setPendingPhotos(data.pending);
      }
    } catch {}
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Incorrect admin password.");
      } else {
        setIsAuthenticated(true);
        loadAllAdminData();
      }
    } catch {
      setLoginError("Failed to authenticate. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setAdminPassword("");
  };

  const handleTriggerDriveSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/admin/drive/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
      loadAllAdminData();
    } catch {
      setSyncResult({
        success: false,
        totalDiscovered: 0,
        newAdded: 0,
        updated: 0,
        durationMs: 0,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFlushPhotos = async () => {
    const confirmed = confirm(
      "⚠️ DANGER: Are you sure you want to flush and remove all existing photos from the database and cache?\n\nThis will clear the gallery, giving you a fresh clean slate to re-sync from Google Drive."
    );
    if (!confirmed) return;

    try {
      setIsFlushing(true);
      setFlushMessage(null);
      const res = await fetch("/api/admin/photos/flush", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setFlushMessage(`Success! Flushed ${data.flushedCount} photos. The gallery is now clean.`);
        loadAllAdminData();
      } else {
        alert(data.error || "Failed to flush photos.");
      }
    } catch (err: any) {
      alert("Error flushing photos: " + err.message);
    } finally {
      setIsFlushing(false);
    }
  };

  const handleModeratePhoto = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/moderation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setPendingPhotos((prev) => prev.filter((p) => p.id !== id));
        loadAllAdminData();
      }
    } catch {
      alert("Failed to update photo moderation status.");
    }
  };

  const handleSaveCaption = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/moderation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editingCaptionText }),
      });

      if (res.ok) {
        setPendingPhotos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, caption: editingCaptionText } : p))
        );
        setEditingCaptionId(null);
      }
    } catch {
      alert("Failed to update caption.");
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm("Are you sure you want to permanently remove this photo?")) return;
    try {
      const res = await fetch(`/api/admin/moderation/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPendingPhotos((prev) => prev.filter((p) => p.id !== id));
        loadAllAdminData();
      }
    } catch {
      alert("Failed to delete photo.");
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!firstName.trim() || !lastName.trim()) {
      setFormFeedback({ type: "error", message: "Please enter both First Name and Last Name." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          pinCode: pinCode.trim() || null,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormFeedback({ type: "error", message: data.error || "Failed to add guest." });
      } else {
        setFormFeedback({
          type: "success",
          message: `Guest ${data.guest.first_name} ${data.guest.last_name} successfully added and ${
            data.guest.is_active ? "turned ON" : "turned OFF"
          }!`,
        });
        setFirstName("");
        setLastName("");
        setPinCode("");
        setIsActive(true);
        fetchGuests();
        fetchDashboardStats();
      }
    } catch {
      setFormFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleGuest = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, is_active: nextStatus } : g))
    );

    try {
      const res = await fetch(`/api/admin/guests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (!res.ok) {
        setGuests((prev) =>
          prev.map((g) => (g.id === id ? { ...g, is_active: currentStatus } : g))
        );
      } else {
        fetchDashboardStats();
      }
    } catch {
      setGuests((prev) =>
        prev.map((g) => (g.id === id ? { ...g, is_active: currentStatus } : g))
      );
    }
  };

  const handleToggleAdminRole = async (guestId: string) => {
    try {
      const res = await fetch(`/api/admin/guests/${guestId}/role`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setGuests((prev) =>
          prev.map((g) => (g.id === guestId ? { ...g, is_admin: data.isAdmin } : g))
        );
      }
    } catch (err) {
      console.error("Toggle admin error:", err);
    }
  };

  const handleDeleteGuest = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the guest register?`)) return;

    try {
      const res = await fetch(`/api/admin/guests/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGuests((prev) => prev.filter((g) => g.id !== id));
        fetchDashboardStats();
      }
    } catch {
      alert("Failed to delete guest.");
    }
  };

  const handleCsvImport = async () => {
    if (!csvText.trim()) return;
    setIsImporting(true);

    try {
      const res = await fetch("/api/admin/guests/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Guests imported successfully!");
        setShowCsvModal(false);
        setCsvText("");
        fetchGuests();
        fetchDashboardStats();
      } else {
        alert(data.error || "CSV import failed.");
      }
    } catch {
      alert("Network error during import.");
    } finally {
      setIsImporting(false);
    }
  };

  const filteredGuests = guests.filter((g) => {
    const fullName = `${g.first_name} ${g.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || fullName.includes(query);

    if (statusFilter === "active") return matchesSearch && g.is_active;
    if (statusFilter === "inactive") return matchesSearch && !g.is_active;
    return matchesSearch;
  });

  const filteredRecentDownloads = (analyticsData?.recentDownloads || []).filter((d) => {
    if (!downloadsSearch.trim()) return true;
    const q = downloadsSearch.toLowerCase().trim();
    return (
      d.guestName.toLowerCase().includes(q) ||
      d.photoFilename.toLowerCase().includes(q) ||
      (d.photoCaption && d.photoCaption.toLowerCase().includes(q))
    );
  });

  const filteredDownloadsByPhoto = (analyticsData?.downloadsByPhoto || []).filter((p) => {
    if (!downloadsSearch.trim()) return true;
    const q = downloadsSearch.toLowerCase().trim();
    return (
      p.photoFilename.toLowerCase().includes(q) ||
      (p.photoCaption && p.photoCaption.toLowerCase().includes(q)) ||
      p.downloadedBy.some((g) => g.toLowerCase().includes(q))
    );
  });

  const filteredDownloadsByGuest = (analyticsData?.downloadsByGuest || []).filter((g) => {
    if (!downloadsSearch.trim()) return true;
    const q = downloadsSearch.toLowerCase().trim();
    return (
      g.guestName.toLowerCase().includes(q) ||
      g.photos.some((p) => p.toLowerCase().includes(q))
    );
  });

  const totalGuests = guests.length;
  const activeCount = guests.filter((g) => g.is_active).length;
  const inactiveCount = totalGuests - activeCount;

  // Render Login Gate if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FEFDF6]">
        <Navbar />
        <main className="flex-1 pt-32 pb-24 px-6 flex items-center justify-center">
          <div className="max-w-md w-full bg-white border border-[#DCD9C9] p-8 sm:p-10 shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-[#FEFDF6] border border-[#DCD9C9] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-[#02084B]" />
            </div>
            <h1 className="font-serif text-3xl text-[#02084B] uppercase tracking-wide mb-2">
              Administrator Gate
            </h1>
            <p className="text-xs text-[#545454] mb-6 font-light">
              Enter your master administrator passphrase to manage wedding guests, moderate uploads, and control Google Drive synchronization.
            </p>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin passphrase"
                  required
                  className="w-full px-4 py-3 bg-[#FEFDF6] border border-[#DCD9C9] text-sm text-[#02084B] focus:outline-none focus:border-[#02084B]"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isLoggingIn}
              >
                Access Administration Suite
              </Button>
            </form>

          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading state while checking session
  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FEFDF6] items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#02084B] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs uppercase tracking-widest text-[#02084B]">Checking Administrator Access...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEFDF6]">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-6 sm:px-10 max-w-7xl mx-auto w-full">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#E8E0D3]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#DCD9C9] bg-white text-[11px] tracking-[0.25em] uppercase text-[#304254] mb-3">
              <Shield className="w-3.5 h-3.5 text-[#02084B]" />
              <span>Verified Superadmin Access</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl tracking-[0.06em] uppercase text-[#02084B]">
              Wedding Administration
            </h1>
            <p className="text-xs sm:text-sm text-[#545454] mt-1 font-light">
              Rebecca Carassco &amp; Dale Hendriques wedding management console.
            </p>
          </div>

          {/* Action Tabs & Sign Out */}
          <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-2">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              {
                id: "analytics",
                label: "Analytics & Downloads",
                icon: TrendingUp,
                badge: analyticsData?.totalDownloads || undefined,
              },
              { id: "guests", label: `Guests (${totalGuests})`, icon: Users },
              { id: "moderation", label: "Moderation Queue", icon: Camera, badge: pendingPhotos.length },
              { id: "drive", label: "Drive Sync", icon: Cloud },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-1.5 text-xs tracking-wider uppercase px-3.5 py-2.5 transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#02084B] text-white shadow-sm"
                      : "bg-white border border-[#DCD9C9] text-[#02084B] hover:border-[#02084B]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-sans">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}

            <button
              onClick={handleAdminLogout}
              className="p-2.5 text-gray-400 hover:text-red-600 border border-transparent hover:border-gray-200 transition-colors ml-2"
              title="Sign out administrator"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <section className="space-y-10 animate-in fade-in">
            {/* 6 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
              <div className="bg-white border border-[#DCD9C9] p-5 shadow-sm">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Registered Guests
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-3xl text-[#02084B]">{totalGuests}</span>
                  <span className="text-xs text-emerald-700 font-medium">{activeCount} active</span>
                </div>
              </div>

              <div
                onClick={() => {
                  setActiveTab("analytics");
                  setAnalyticsSubTab("logins");
                }}
                className="bg-white border border-[#DCD9C9] p-5 shadow-sm hover:border-[#02084B] cursor-pointer transition-colors"
                title="Click to view login details"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                    Guests Logged In
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-3xl text-[#02084B]">
                    {analyticsData?.uniqueGuestsCount || dashboardStats?.analytics?.uniqueGuestsCount || 0}
                  </span>
                  <span className="text-xs text-[#545454]">
                    {analyticsData?.totalLogins || dashboardStats?.analytics?.totalLogins || 0} logins
                  </span>
                </div>
              </div>

              <div className="bg-white border border-[#DCD9C9] p-5 shadow-sm">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Gallery Photos
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-3xl text-[#02084B]">
                    {dashboardStats?.photos?.approvedPhotos || 6}
                  </span>
                  <span className="text-[11px] text-[#545454]">
                    {dashboardStats?.photos?.drivePhotos || 3}D • {dashboardStats?.photos?.guestPhotos || 3}G
                  </span>
                </div>
              </div>

              <div
                onClick={() => {
                  setActiveTab("analytics");
                  setAnalyticsSubTab("downloads");
                }}
                className="bg-white border border-[#DCD9C9] p-5 shadow-sm hover:border-[#02084B] cursor-pointer transition-colors"
                title="Click to view photo downloads breakdown"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                    Photos Downloaded
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-3xl text-[#02084B]">
                    {analyticsData?.totalDownloads || dashboardStats?.analytics?.totalDownloads || 0}
                  </span>
                  <Download className="w-4 h-4 text-[#02084B]" />
                </div>
              </div>

              <div className="bg-white border border-[#DCD9C9] p-5 shadow-sm">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Platform Likes
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-3xl text-[#02084B]">
                    {dashboardStats?.photos?.totalLikes || 223}
                  </span>
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                </div>
              </div>

              <div className="bg-white border border-[#DCD9C9] p-5 shadow-sm">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Pending Moderation
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-3xl text-amber-600">
                    {pendingPhotos.length}
                  </span>
                  {pendingPhotos.length > 0 ? (
                    <button
                      onClick={() => setActiveTab("moderation")}
                      className="text-xs text-[#02084B] underline"
                    >
                      Review
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700">Clear</span>
                  )}
                </div>
              </div>

              {/* Storage Usage Card */}
              <div className={`bg-white border p-5 shadow-sm ${dashboardStats?.storage?.isNearLimit ? "border-amber-400 bg-amber-50/40" : "border-[#DCD9C9]"}`}>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Storage
                </span>
                <div className="flex items-baseline justify-between">
                  <span className={`font-serif text-3xl ${dashboardStats?.storage?.isNearLimit ? "text-amber-600" : "text-[#02084B]"}`}>
                    {dashboardStats?.storage?.usedMB ?? "—"}
                    <span className="text-sm font-sans font-normal ml-1">MB</span>
                  </span>
                  <span className="text-[11px] text-[#545454]">
                    / {dashboardStats?.storage?.limitMB ?? 1024} MB
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dashboardStats?.storage?.isNearLimit ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(dashboardStats?.storage?.percentUsed ?? 0, 100)}%` }}
                  />
                </div>
                {dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-amber-700 mt-1.5 font-medium">
                    ⚡ Drive failover active
                  </p>
                )}
                {!dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-emerald-700 mt-1.5">
                    {dashboardStats?.storage?.percentUsed ?? 0}% used
                  </p>
                )}
              </div>
            </div>

            {/* Quick Live Activity & Downloads Snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Image Downloads Card */}
              <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8E0D3]">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-[#02084B]" />
                      <h3 className="font-serif text-lg text-[#02084B] uppercase">
                        Recent Photograph Downloads
                      </h3>
                    </div>
                    <span className="text-xs text-[#545454]">
                      {analyticsData?.totalDownloads || 0} total saved
                    </span>
                  </div>

                  {(!analyticsData?.recentDownloads || analyticsData.recentDownloads.length === 0) ? (
                    <p className="text-xs text-[#545454] italic py-6 text-center">
                      No downloads recorded yet. Guest downloads will appear here in real time.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {analyticsData.recentDownloads.slice(0, 4).map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-2.5 bg-[#FEFDF6] border border-[#E8E0D3]">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 bg-[#F2EEEB] border border-[#DCD9C9] overflow-hidden flex-shrink-0">
                              {d.photoThumbnail ? (
                                <Image
                                  src={d.photoThumbnail}
                                  alt={d.photoCaption || d.photoFilename}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-[#02084B] line-clamp-1">
                                {d.photoCaption || d.photoFilename}
                              </p>
                              <span className="text-[11px] text-[#545454]">
                                Downloaded by <strong className="text-[#02084B]">{d.guestName}</strong>
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#545454] whitespace-nowrap ml-2">
                            {formatRelativeTime(d.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setActiveTab("analytics");
                    setAnalyticsSubTab("downloads");
                  }}
                  className="mt-4 pt-3 border-t border-[#E8E0D3] text-xs text-[#02084B] font-medium flex items-center justify-between hover:underline"
                >
                  <span>See full "Who Downloaded Which Image" audit</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Recent Guest Logins Card */}
              <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8E0D3]">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#02084B]" />
                      <h3 className="font-serif text-lg text-[#02084B] uppercase">
                        Recent Guest Sign-Ins
                      </h3>
                    </div>
                    <span className="text-xs text-emerald-700 font-medium">
                      {analyticsData?.uniqueGuestsCount || 0} unique attendees
                    </span>
                  </div>

                  {(!analyticsData?.guestLoginsSummary || analyticsData.guestLoginsSummary.length === 0) ? (
                    <p className="text-xs text-[#545454] italic py-6 text-center">
                      No sign-ins recorded yet. Guest attendance will appear here.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {analyticsData.guestLoginsSummary.slice(0, 4).map((g, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-[#FEFDF6] border border-[#E8E0D3]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-white border border-[#DCD9C9] flex items-center justify-center font-serif text-xs text-[#02084B] font-semibold">
                              {g.guestName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-[#02084B]">
                                {g.guestName}
                              </p>
                              <span className="text-[10px] text-[#545454]">
                                {g.loginCount} {g.loginCount === 1 ? "session" : "sessions"} recorded
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#545454] whitespace-nowrap">
                            {formatRelativeTime(g.lastLoginAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setActiveTab("analytics");
                    setAnalyticsSubTab("logins");
                  }}
                  className="mt-4 pt-3 border-t border-[#E8E0D3] text-xs text-[#02084B] font-medium flex items-center justify-between hover:underline"
                >
                  <span>See full guest login attendance table</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Storage Usage Card */}
              <div className={`bg-white border p-5 shadow-sm ${dashboardStats?.storage?.isNearLimit ? "border-amber-400 bg-amber-50/40" : "border-[#DCD9C9]"}`}>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Storage
                </span>
                <div className="flex items-baseline justify-between">
                  <span className={`font-serif text-3xl ${dashboardStats?.storage?.isNearLimit ? "text-amber-600" : "text-[#02084B]"}`}>
                    {dashboardStats?.storage?.usedMB ?? "—"}
                    <span className="text-sm font-sans font-normal ml-1">MB</span>
                  </span>
                  <span className="text-[11px] text-[#545454]">
                    / {dashboardStats?.storage?.limitMB ?? 1024} MB
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dashboardStats?.storage?.isNearLimit ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(dashboardStats?.storage?.percentUsed ?? 0, 100)}%` }}
                  />
                </div>
                {dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-amber-700 mt-1.5 font-medium">
                    ⚡ Drive failover active
                  </p>
                )}
                {!dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-emerald-700 mt-1.5">
                    {dashboardStats?.storage?.percentUsed ?? 0}% used
                  </p>
                )}
              </div>
            </div>

            {/* Most-Liked Photos Showcase */}
            <div className="bg-white border border-[#DCD9C9] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E8E0D3]">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#02084B]" />
                  <h3 className="font-serif text-xl sm:text-2xl text-[#02084B] uppercase">
                    Most Cherished Photographs
                  </h3>
                </div>
                <span className="text-xs text-[#545454]">Ranked by guest likes</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {(dashboardStats?.photos?.mostLikedPhotos || []).slice(0, 4).map((photo: Photo, idx: number) => (
                  <div key={photo.id} className="border border-[#E8E0D3] overflow-hidden flex flex-col">
                    <div className="relative aspect-[4/3] bg-[#F2EEEB]">
                      <Image
                        src={photo.thumbnail_url || photo.display_url}
                        alt={photo.caption || photo.filename}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-[#02084B] text-white text-[10px] px-2 py-0.5 uppercase tracking-widest font-sans">
                        #{idx + 1}
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 text-xs rounded-full flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                        <span>{photo.like_count}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-[#FEFDF6] flex-1 flex flex-col justify-between">
                      <p className="text-xs text-[#02084B] line-clamp-2 italic mb-2">
                        {photo.caption || photo.filename}
                      </p>
                      <span className="text-[10px] text-[#545454] uppercase tracking-wider">
                        By {photo.uploader_name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Storage Usage Card */}
              <div className={`bg-white border p-5 shadow-sm ${dashboardStats?.storage?.isNearLimit ? "border-amber-400 bg-amber-50/40" : "border-[#DCD9C9]"}`}>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Storage
                </span>
                <div className="flex items-baseline justify-between">
                  <span className={`font-serif text-3xl ${dashboardStats?.storage?.isNearLimit ? "text-amber-600" : "text-[#02084B]"}`}>
                    {dashboardStats?.storage?.usedMB ?? "—"}
                    <span className="text-sm font-sans font-normal ml-1">MB</span>
                  </span>
                  <span className="text-[11px] text-[#545454]">
                    / {dashboardStats?.storage?.limitMB ?? 1024} MB
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dashboardStats?.storage?.isNearLimit ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(dashboardStats?.storage?.percentUsed ?? 0, 100)}%` }}
                  />
                </div>
                {dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-amber-700 mt-1.5 font-medium">
                    ⚡ Drive failover active
                  </p>
                )}
                {!dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-emerald-700 mt-1.5">
                    {dashboardStats?.storage?.percentUsed ?? 0}% used
                  </p>
                )}
              </div>
            </div>

            {/* ── Storage Failover Test Panel ─────────────────────────────── */}
            <div className="bg-white border border-[#DCD9C9] p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-[#E8E0D3] gap-3">
                <div>
                  <h2 className="font-serif text-xl text-[#02084B] uppercase tracking-wide">
                    Storage Failover Test
                  </h2>
                  <p className="text-xs text-[#545454] mt-1">
                    Verify that the auto-failover to Google Drive is wired up correctly. The dry-run uploads a 67-byte test PNG and immediately deletes it — nothing stays in Drive.
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button
                    onClick={async () => {
                      setIsCheckingStorage(true);
                      setStorageTestStatus(null);
                      try {
                        const r = await fetch("/api/admin/storage-test");
                        setStorageTestStatus(await r.json());
                      } catch (e: any) {
                        setStorageTestStatus({ ok: false, error: e.message });
                      } finally {
                        setIsCheckingStorage(false);
                      }
                    }}
                    disabled={isCheckingStorage}
                    className="px-4 py-2 text-xs tracking-widest uppercase border border-[#02084B] text-[#02084B] hover:bg-[#02084B] hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isCheckingStorage ? "Checking…" : "Check Status"}
                  </button>
                  <button
                    onClick={async () => {
                      setIsRunningDriveTest(true);
                      setStorageTestResult(null);
                      try {
                        const r = await fetch("/api/admin/storage-test", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ simulate900mb: false }),
                        });
                        setStorageTestResult(await r.json());
                      } catch (e: any) {
                        setStorageTestResult({ ok: false, error: e.message });
                      } finally {
                        setIsRunningDriveTest(false);
                      }
                    }}
                    disabled={isRunningDriveTest}
                    className="px-4 py-2 text-xs tracking-widest uppercase bg-[#02084B] text-white hover:bg-[#304254] transition-colors disabled:opacity-50"
                  >
                    {isRunningDriveTest ? "Testing…" : "▶ Run Dry-Run"}
                  </button>
                </div>
              </div>

              {/* Status check result */}
              {storageTestStatus && (
                <div className="mb-6 space-y-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#545454] mb-2">
                    Status — checked {new Date(storageTestStatus.checkedAt || Date.now()).toLocaleTimeString()} · {storageTestStatus.latencyMs}ms
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Storage */}
                    <div className={`border p-4 ${storageTestStatus.storage?.isNearLimit ? "border-amber-400 bg-amber-50" : "border-emerald-200 bg-emerald-50/40"}`}>
                      <p className="text-[10px] uppercase tracking-widest text-[#545454] mb-1">Supabase Storage</p>
                      <p className={`text-2xl font-serif ${storageTestStatus.storage?.isNearLimit ? "text-amber-700" : "text-emerald-700"}`}>
                        {storageTestStatus.storage?.usedMB} MB
                      </p>
                      <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${storageTestStatus.storage?.isNearLimit ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(storageTestStatus.storage?.percentUsed ?? 0, 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] mt-1 text-[#545454]">
                        {storageTestStatus.storage?.percentUsed}% · {storageTestStatus.storage?.remainingMB} MB free
                      </p>
                      <p className="text-[11px] mt-1 font-medium">
                        Failover threshold: 900 MB
                      </p>
                      <p className={`text-[11px] mt-0.5 font-semibold ${storageTestStatus.storage?.failoverWouldTrigger ? "text-amber-700" : "text-emerald-700"}`}>
                        {storageTestStatus.storage?.failoverWouldTrigger ? "⚡ Would trigger failover NOW" : "✅ Supabase is primary (normal)"}
                      </p>
                    </div>

                    {/* Drive */}
                    <div className={`border p-4 ${storageTestStatus.drive?.connected ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50"}`}>
                      <p className="text-[10px] uppercase tracking-widest text-[#545454] mb-1">Google Drive</p>
                      <p className={`text-2xl font-serif ${storageTestStatus.drive?.connected ? "text-emerald-700" : "text-red-600"}`}>
                        {storageTestStatus.drive?.connected ? "✅ Connected" : "❌ Error"}
                      </p>
                      {storageTestStatus.drive?.folderId && (
                        <p className="text-[11px] mt-2 font-mono text-[#545454] break-all">
                          Folder: {storageTestStatus.drive.folderId.slice(0, 20)}…
                        </p>
                      )}
                      {storageTestStatus.drive?.error && (
                        <p className="text-[11px] mt-2 text-red-600">{storageTestStatus.drive.error}</p>
                      )}
                      <p className="text-[11px] mt-2 text-[#545454]">
                        {storageTestStatus.drive?.connected
                          ? "drive.file write scope active"
                          : "Cannot failover — fix credentials"}
                      </p>
                    </div>

                    {/* Overall */}
                    <div className={`border p-4 ${storageTestStatus.ok && storageTestStatus.drive?.connected ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50"}`}>
                      <p className="text-[10px] uppercase tracking-widest text-[#545454] mb-1">Failover Readiness</p>
                      <p className={`text-2xl font-serif ${storageTestStatus.ok && storageTestStatus.drive?.connected ? "text-emerald-700" : "text-red-600"}`}>
                        {storageTestStatus.ok && storageTestStatus.drive?.connected ? "Ready" : "Not Ready"}
                      </p>
                      <p className="text-[11px] mt-2 text-[#545454]">
                        {storageTestStatus.ok && storageTestStatus.drive?.connected
                          ? "If Supabase hits 900 MB, uploads will silently switch to Drive. No guest action needed."
                          : "Fix the Drive connection error above before failover will work."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dry-run result */}
              {storageTestResult && (
                <div className={`border p-5 ${storageTestResult.ok ? "border-emerald-300 bg-emerald-50/50" : "border-red-300 bg-red-50"}`}>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#545454] mb-2">Dry-Run Result</p>
                  <p className={`font-medium text-sm ${storageTestResult.ok ? "text-emerald-800" : "text-red-700"}`}>
                    {storageTestResult.message || storageTestResult.error}
                  </p>
                  {storageTestResult.ok && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
                      <div>
                        <span className="text-[#545454] block">Drive latency</span>
                        <span className="text-[#02084B] font-semibold">{storageTestResult.uploadLatencyMs}ms</span>
                      </div>
                      <div>
                        <span className="text-[#545454] block">Test file deleted</span>
                        <span className={storageTestResult.deletedAfterTest ? "text-emerald-700 font-semibold" : "text-amber-600 font-semibold"}>
                          {storageTestResult.deletedAfterTest ? "Yes ✓" : "No — check Drive"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#545454] block">Storage used</span>
                        <span className="text-[#02084B] font-semibold">{storageTestResult.storage?.usedMB} MB</span>
                      </div>
                      <div>
                        <span className="text-[#545454] block">Failover active</span>
                        <span className={storageTestResult.storage?.failoverWouldTrigger ? "text-amber-600 font-semibold" : "text-emerald-700 font-semibold"}>
                          {storageTestResult.storage?.failoverWouldTrigger ? "Yes ⚡" : "No (normal)"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!storageTestStatus && !storageTestResult && (
                <p className="text-xs text-[#545454] text-center py-6">
                  Click <strong>Check Status</strong> to see current storage + Drive connectivity, or <strong>Run Dry-Run</strong> to do a live upload test to Drive.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB: ANALYTICS & DOWNLOADS REGISTER */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && (
          <section className="space-y-8 animate-in fade-in">
            {/* Top Header & Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8E0D3] gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#DCD9C9] bg-white text-[11px] tracking-[0.25em] uppercase text-[#304254] mb-2 font-medium">
                  <Activity className="w-3.5 h-3.5 text-[#02084B]" />
                  <span>Live Platform Analytics</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl text-[#02084B] uppercase">
                  Engagement &amp; Downloads Audit
                </h2>
                <p className="text-xs sm:text-sm text-[#545454] mt-1 font-light">
                  Track attendee sign-ins and see precisely who downloaded which photograph.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={fetchAnalyticsData}
                  disabled={isLoadingAnalytics}
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAnalytics ? "animate-spin" : ""}`} />
                  <span>Refresh Data</span>
                </Button>
              </div>

              {/* Storage Usage Card */}
              <div className={`bg-white border p-5 shadow-sm ${dashboardStats?.storage?.isNearLimit ? "border-amber-400 bg-amber-50/40" : "border-[#DCD9C9]"}`}>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Storage
                </span>
                <div className="flex items-baseline justify-between">
                  <span className={`font-serif text-3xl ${dashboardStats?.storage?.isNearLimit ? "text-amber-600" : "text-[#02084B]"}`}>
                    {dashboardStats?.storage?.usedMB ?? "—"}
                    <span className="text-sm font-sans font-normal ml-1">MB</span>
                  </span>
                  <span className="text-[11px] text-[#545454]">
                    / {dashboardStats?.storage?.limitMB ?? 1024} MB
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dashboardStats?.storage?.isNearLimit ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(dashboardStats?.storage?.percentUsed ?? 0, 100)}%` }}
                  />
                </div>
                {dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-amber-700 mt-1.5 font-medium">
                    ⚡ Drive failover active
                  </p>
                )}
                {!dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-emerald-700 mt-1.5">
                    {dashboardStats?.storage?.percentUsed ?? 0}% used
                  </p>
                )}
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Unique Guests Logged In */}
              <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm">
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Guests Logged In
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-4xl text-[#02084B]">
                    {analyticsData?.uniqueGuestsCount || 0}
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">
                    of {totalGuests} ({totalGuests > 0 ? Math.round(((analyticsData?.uniqueGuestsCount || 0) / totalGuests) * 100) : 0}%)
                  </span>
                </div>
                <span className="text-[11px] text-[#545454] mt-2 block">
                  {analyticsData?.totalLogins || 0} total login sessions
                </span>
              </div>

              {/* Total Photo Downloads */}
              <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm">
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Photos Downloaded
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-4xl text-[#02084B]">
                    {analyticsData?.totalDownloads || 0}
                  </span>
                  <Download className="w-5 h-5 text-[#02084B]" />
                </div>
                <span className="text-[11px] text-[#545454] mt-2 block">
                  {analyticsData?.uniquePhotosDownloaded || 0} unique images saved
                </span>
              </div>

              {/* Downloaders Count */}
              <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm">
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Active Downloaders
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-4xl text-[#02084B]">
                    {analyticsData?.downloadsByGuest.length || 0}
                  </span>
                  <span className="text-xs text-[#545454]">Guests</span>
                </div>
                <span className="text-[11px] text-[#545454] mt-2 block">
                  Guests keeping high-res memories
                </span>
              </div>

              {/* Attendance Progress */}
              <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm">
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Guest Turnout
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-4xl text-[#02084B]">
                    {totalGuests > 0 ? Math.round(((analyticsData?.uniqueGuestsCount || 0) / totalGuests) * 100) : 0}%
                  </span>
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="w-full bg-[#E8E0D3] h-1.5 mt-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#02084B] h-full transition-all duration-500"
                    style={{
                      width: `${totalGuests > 0 ? Math.min(100, Math.round(((analyticsData?.uniqueGuestsCount || 0) / totalGuests) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Storage Usage Card */}
              <div className={`bg-white border p-5 shadow-sm ${dashboardStats?.storage?.isNearLimit ? "border-amber-400 bg-amber-50/40" : "border-[#DCD9C9]"}`}>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Storage
                </span>
                <div className="flex items-baseline justify-between">
                  <span className={`font-serif text-3xl ${dashboardStats?.storage?.isNearLimit ? "text-amber-600" : "text-[#02084B]"}`}>
                    {dashboardStats?.storage?.usedMB ?? "—"}
                    <span className="text-sm font-sans font-normal ml-1">MB</span>
                  </span>
                  <span className="text-[11px] text-[#545454]">
                    / {dashboardStats?.storage?.limitMB ?? 1024} MB
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dashboardStats?.storage?.isNearLimit ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(dashboardStats?.storage?.percentUsed ?? 0, 100)}%` }}
                  />
                </div>
                {dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-amber-700 mt-1.5 font-medium">
                    ⚡ Drive failover active
                  </p>
                )}
                {!dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-emerald-700 mt-1.5">
                    {dashboardStats?.storage?.percentUsed ?? 0}% used
                  </p>
                )}
              </div>
            </div>

            {/* Subtab Toggle Buttons */}
            <div className="flex flex-wrap items-center gap-3 border-b border-[#E8E0D3] pb-4">
              <button
                onClick={() => setAnalyticsSubTab("downloads")}
                className={`inline-flex items-center gap-2 text-xs tracking-wider uppercase px-4 py-2.5 transition-colors ${
                  analyticsSubTab === "downloads"
                    ? "bg-[#02084B] text-white shadow-sm"
                    : "bg-white border border-[#DCD9C9] text-[#02084B] hover:border-[#02084B]"
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Who Downloaded Which Image ({analyticsData?.totalDownloads || 0})</span>
              </button>

              <button
                onClick={() => setAnalyticsSubTab("logins")}
                className={`inline-flex items-center gap-2 text-xs tracking-wider uppercase px-4 py-2.5 transition-colors ${
                  analyticsSubTab === "logins"
                    ? "bg-[#02084B] text-white shadow-sm"
                    : "bg-white border border-[#DCD9C9] text-[#02084B] hover:border-[#02084B]"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Guest Logins &amp; Attendance ({analyticsData?.uniqueGuestsCount || 0}/{totalGuests})</span>
              </button>
            </div>

            {/* SUBTAB 1: WHO DOWNLOADED WHICH IMAGE */}
            {analyticsSubTab === "downloads" && (
              <div className="space-y-6">
                {/* Search & View Mode Controls */}
                <div className="bg-white border border-[#DCD9C9] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by guest name or photo..."
                      value={downloadsSearch}
                      onChange={(e) => setDownloadsSearch(e.target.value)}
                      className="w-full bg-[#FEFDF6] border border-[#DCD9C9] pl-9 pr-4 py-2 text-xs text-[#02084B] placeholder-gray-400 focus:outline-none focus:border-[#02084B]"
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[11px] uppercase tracking-wider text-[#545454]">View:</span>
                    <button
                      onClick={() => setDownloadsViewMode("feed")}
                      className={`text-xs uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                        downloadsViewMode === "feed"
                          ? "bg-[#02084B] text-white border-[#02084B]"
                          : "bg-white text-[#02084B] border-[#DCD9C9] hover:border-[#02084B]"
                      }`}
                    >
                      Audit Feed
                    </button>
                    <button
                      onClick={() => setDownloadsViewMode("by_photo")}
                      className={`text-xs uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                        downloadsViewMode === "by_photo"
                          ? "bg-[#02084B] text-white border-[#02084B]"
                          : "bg-white text-[#02084B] border-[#DCD9C9] hover:border-[#02084B]"
                      }`}
                    >
                      By Photo
                    </button>
                    <button
                      onClick={() => setDownloadsViewMode("by_guest")}
                      className={`text-xs uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                        downloadsViewMode === "by_guest"
                          ? "bg-[#02084B] text-white border-[#02084B]"
                          : "bg-white text-[#02084B] border-[#DCD9C9] hover:border-[#02084B]"
                      }`}
                    >
                      By Guest
                    </button>
                  </div>
                </div>

                {/* VIEW 1: AUDIT FEED */}
                {downloadsViewMode === "feed" && (
                  <div className="bg-white border border-[#DCD9C9] shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-[#E8E0D3] flex items-center justify-between">
                      <h3 className="font-serif text-lg sm:text-xl text-[#02084B] uppercase">
                        Download Audit Feed
                      </h3>
                      <span className="text-xs text-[#545454]">
                        {filteredRecentDownloads.length} events logged
                      </span>
                    </div>

                    {filteredRecentDownloads.length === 0 ? (
                      <div className="p-12 text-center text-[#545454]">
                        <Download className="w-10 h-10 mx-auto text-[#DCD9C9] mb-3" />
                        <p className="text-sm font-medium text-[#02084B]">No download records found</p>
                        <p className="text-xs text-[#545454] mt-1">
                          When guests download photographs from the gallery, their names and saved images are logged here in real time.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FEFDF6] border-b border-[#E8E0D3] text-[#304254] uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="py-3 px-4">Photo Preview</th>
                              <th className="py-3 px-4">Photograph Details</th>
                              <th className="py-3 px-4">Downloaded By</th>
                              <th className="py-3 px-4 text-right">Time &amp; Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8E0D3]">
                            {filteredRecentDownloads.map((ev) => (
                              <tr key={ev.id} className="hover:bg-[#FEFDF6]/60 transition-colors">
                                <td className="py-3 px-4 w-16">
                                  <div className="relative w-12 h-12 bg-[#F2EEEB] border border-[#E8E0D3] overflow-hidden">
                                    {ev.photoThumbnail ? (
                                      <Image
                                        src={ev.photoThumbnail}
                                        alt={ev.photoCaption || ev.photoFilename}
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <ImageIcon className="w-5 h-5" />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <p className="font-medium text-[#02084B] line-clamp-1">
                                    {ev.photoCaption || ev.photoFilename}
                                  </p>
                                  <span className="text-[10px] text-[#545454] font-mono">
                                    {ev.photoFilename}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FEFDF6] border border-[#DCD9C9] text-xs font-medium text-[#02084B]">
                                    <Users className="w-3 h-3 text-[#304254]" />
                                    <span>{ev.guestName}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <span className="text-xs text-[#02084B] font-medium block">
                                    {formatRelativeTime(ev.timestamp)}
                                  </span>
                                  <span className="text-[10px] text-[#545454]">
                                    {formatDatePretty(ev.timestamp)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW 2: GROUPED BY PHOTO */}
                {downloadsViewMode === "by_photo" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDownloadsByPhoto.length === 0 ? (
                      <div className="col-span-full bg-white border border-[#DCD9C9] p-12 text-center text-[#545454]">
                        <p className="text-sm font-medium text-[#02084B]">No photos downloaded yet</p>
                      </div>
                    ) : (
                      filteredDownloadsByPhoto.map((item) => (
                        <div key={item.photoId} className="bg-white border border-[#DCD9C9] overflow-hidden shadow-sm flex flex-col">
                          <div className="relative aspect-[16/10] bg-[#F2EEEB]">
                            {item.photoThumbnail ? (
                              <Image
                                src={item.photoThumbnail}
                                alt={item.photoCaption || item.photoFilename}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ImageIcon className="w-8 h-8" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-[#02084B] text-white text-[10px] uppercase tracking-wider px-2 py-0.5 font-sans font-medium flex items-center gap-1 shadow">
                              <Download className="w-3 h-3" />
                              <span>{item.count} {item.count === 1 ? "download" : "downloads"}</span>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-medium text-[#02084B] line-clamp-1 mb-1">
                                {item.photoCaption || item.photoFilename}
                              </p>
                              <span className="text-[10px] text-[#545454] block mb-3">
                                Last saved {formatRelativeTime(item.lastDownloadedAt)}
                              </span>

                              <div className="border-t border-[#E8E0D3] pt-2">
                                <span className="text-[10px] uppercase tracking-wider text-[#545454] block mb-1.5 font-medium">
                                  Downloaded by ({item.downloadedBy.length}):
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {item.downloadedBy.map((guest, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 text-[11px] bg-[#FEFDF6] border border-[#DCD9C9] px-2 py-0.5 text-[#02084B]"
                                    >
                                      <Users className="w-2.5 h-2.5 text-[#304254]" />
                                      {guest}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* VIEW 3: GROUPED BY GUEST */}
                {downloadsViewMode === "by_guest" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDownloadsByGuest.length === 0 ? (
                      <div className="col-span-full bg-white border border-[#DCD9C9] p-12 text-center text-[#545454]">
                        <p className="text-sm font-medium text-[#02084B]">No guest download records yet</p>
                      </div>
                    ) : (
                      filteredDownloadsByGuest.map((g, idx) => (
                        <div key={idx} className="bg-white border border-[#DCD9C9] p-5 shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D3] mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#FEFDF6] border border-[#DCD9C9] flex items-center justify-center font-serif text-sm text-[#02084B]">
                                  {g.guestName.charAt(0)}
                                </div>
                                <span className="font-serif text-base text-[#02084B] font-medium">
                                  {g.guestName}
                                </span>
                              </div>
                              <span className="bg-[#02084B] text-white text-[10px] tracking-wider uppercase px-2 py-0.5 font-sans font-medium">
                                {g.count} {g.count === 1 ? "photo" : "photos"}
                              </span>
                            </div>

                            <p className="text-[10px] uppercase tracking-wider text-[#545454] mb-2 font-medium">
                              Saved photographs:
                            </p>
                            <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {g.photos.map((title, pIdx) => (
                                <li key={pIdx} className="text-xs text-[#304254] flex items-center gap-1.5">
                                  <ImageIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{title}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="border-t border-[#E8E0D3] pt-3 mt-4 text-[10px] text-[#545454]">
                            Last downloaded {formatRelativeTime(g.lastDownloadedAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 2: GUEST LOGINS & ATTENDANCE */}
            {analyticsSubTab === "logins" && (
              <div className="space-y-6">
                {/* Logged in guests table */}
                <div className="bg-white border border-[#DCD9C9] shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-[#E8E0D3] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg sm:text-xl text-[#02084B] uppercase">
                        Logged-In Guests Register
                      </h3>
                      <p className="text-xs text-[#545454] mt-0.5">
                        Guests who have accessed the celebration portal with their names or PINs.
                      </p>
                    </div>
                    <span className="text-xs text-emerald-700 font-medium">
                      {analyticsData?.uniqueGuestsCount || 0} active guests logged in
                    </span>
                  </div>

                  {(!analyticsData?.guestLoginsSummary || analyticsData.guestLoginsSummary.length === 0) ? (
                    <div className="p-12 text-center text-[#545454]">
                      <Users className="w-10 h-10 mx-auto text-[#DCD9C9] mb-3" />
                      <p className="text-sm font-medium text-[#02084B]">No guest sign-ins recorded yet</p>
                      <p className="text-xs text-[#545454] mt-1">
                        When guests sign in at /guest-login, their sessions and attendance are tracked here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FEFDF6] border-b border-[#E8E0D3] text-[#304254] uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-4">Guest Name</th>
                            <th className="py-3 px-4 text-center">Total Sign-In Sessions</th>
                            <th className="py-3 px-4">Invitation Status</th>
                            <th className="py-3 px-4 text-right">Most Recent Activity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E0D3]">
                          {analyticsData.guestLoginsSummary.map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#FEFDF6]/60 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-[#FEFDF6] border border-[#DCD9C9] flex items-center justify-center font-serif text-xs text-[#02084B] font-semibold">
                                    {item.guestName.charAt(0)}
                                  </div>
                                  <span className="font-medium text-[#02084B] text-xs sm:text-sm">
                                    {item.guestName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 bg-[#02084B] text-white rounded-full text-xs font-semibold">
                                  {item.loginCount}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Active Attendee
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <span className="text-xs text-[#02084B] font-medium block">
                                  {formatRelativeTime(item.lastLoginAt)}
                                </span>
                                <span className="text-[10px] text-[#545454]">
                                  {formatDatePretty(item.lastLoginAt)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Guests who have not yet logged in */}
                {totalGuests > (analyticsData?.uniqueGuestsCount || 0) && (
                  <div className="bg-white border border-[#DCD9C9] shadow-sm p-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D3] mb-4">
                      <div>
                        <h4 className="font-serif text-base text-[#02084B] uppercase">
                          Guests Pending First Sign-In
                        </h4>
                        <p className="text-xs text-[#545454]">
                          {totalGuests - (analyticsData?.uniqueGuestsCount || 0)} registered guests have not yet logged in.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("guests")}
                        className="text-xs text-[#02084B] underline"
                      >
                        Manage in Guest Register →
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {guests
                        .filter(
                          (g) =>
                            !analyticsData?.guestLoginsSummary.some(
                              (l) =>
                                l.guestId === g.id ||
                                l.guestName.toLowerCase() === `${g.first_name} ${g.last_name}`.toLowerCase()
                            )
                        )
                        .map((g) => (
                          <span
                            key={g.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEFDF6] border border-[#DCD9C9] text-xs text-[#545454]"
                          >
                            <Users className="w-3 h-3 text-gray-400" />
                            <span>{g.first_name} {g.last_name}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: GUEST REGISTER & TURN ON/OFF */}
        {/* ========================================================================= */}
        {activeTab === "guests" && (
          <section className="space-y-10 animate-in fade-in">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                    Total Registered Guests
                  </span>
                  <span className="font-serif text-4xl text-[#02084B]">{totalGuests}</span>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#FEFDF6] border border-[#DCD9C9] flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#02084B]" />
                </div>
              </div>

              <div className="bg-white border border-emerald-200 p-6 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] tracking-[0.2em] uppercase text-emerald-700 block mb-1">
                    Turned ON (Active)
                  </span>
                  <span className="font-serif text-4xl text-emerald-800">{activeCount}</span>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>

              <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                    Turned OFF (Inactive)
                  </span>
                  <span className="font-serif text-4xl text-[#545454]">{inactiveCount}</span>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#FEFDF6] border border-[#DCD9C9] flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-[#545454]" />
                </div>
              </div>

              {/* Storage Usage Card */}
              <div className={`bg-white border p-5 shadow-sm ${dashboardStats?.storage?.isNearLimit ? "border-amber-400 bg-amber-50/40" : "border-[#DCD9C9]"}`}>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Storage
                </span>
                <div className="flex items-baseline justify-between">
                  <span className={`font-serif text-3xl ${dashboardStats?.storage?.isNearLimit ? "text-amber-600" : "text-[#02084B]"}`}>
                    {dashboardStats?.storage?.usedMB ?? "—"}
                    <span className="text-sm font-sans font-normal ml-1">MB</span>
                  </span>
                  <span className="text-[11px] text-[#545454]">
                    / {dashboardStats?.storage?.limitMB ?? 1024} MB
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dashboardStats?.storage?.isNearLimit ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(dashboardStats?.storage?.percentUsed ?? 0, 100)}%` }}
                  />
                </div>
                {dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-amber-700 mt-1.5 font-medium">
                    ⚡ Drive failover active
                  </p>
                )}
                {!dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-emerald-700 mt-1.5">
                    {dashboardStats?.storage?.percentUsed ?? 0}% used
                  </p>
                )}
              </div>
            </div>

            {/* Add Guest Form */}
            <div className="bg-white border border-[#DCD9C9] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#02084B]" />
                  <h2 className="font-serif text-xl sm:text-2xl text-[#02084B] uppercase tracking-wide">
                    Add New Wedding Guest
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCsvModal(true)}
                    className="text-xs tracking-wider uppercase text-[#02084B] hover:underline flex items-center gap-1 font-medium"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Import CSV</span>
                  </button>

                  <a
                    href="/api/admin/guests/export"
                    download
                    className="text-xs tracking-wider uppercase text-[#545454] hover:text-[#02084B] flex items-center gap-1 font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </a>
                </div>
              </div>

              {formFeedback && (
                <div
                  className={`p-3.5 mb-6 text-xs flex items-center gap-2 ${
                    formFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <span>{formFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleAddGuest} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs tracking-wider uppercase text-[#02084B] mb-1 font-medium">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Victoria"
                    required
                    className="w-full px-3.5 py-2.5 bg-[#FEFDF6] border border-[#DCD9C9] text-sm text-[#02084B] focus:outline-none focus:border-[#02084B]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs tracking-wider uppercase text-[#02084B] mb-1 font-medium">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sterling"
                    required
                    className="w-full px-3.5 py-2.5 bg-[#FEFDF6] border border-[#DCD9C9] text-sm text-[#02084B] focus:outline-none focus:border-[#02084B]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs tracking-wider uppercase text-[#02084B] mb-1 font-medium flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-[#02084B]" />
                    <span>Optional PIN</span>
                  </label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="e.g. 2026 (Optional)"
                    className="w-full px-3.5 py-2.5 bg-[#FEFDF6] border border-[#DCD9C9] text-sm text-[#02084B] focus:outline-none focus:border-[#02084B]"
                  />
                </div>

                <div className="sm:col-span-3 flex flex-col justify-end">
                  <div className="flex items-center gap-3 h-[42px]">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs tracking-wider uppercase text-[#02084B]">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 accent-[#02084B]"
                      />
                      <span>Turn On Now</span>
                    </label>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="flex-1 text-xs"
                      isLoading={isSubmitting}
                    >
                      Add Guest
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Guest List Management Table */}
            <div className="bg-white border border-[#DCD9C9] shadow-sm">
              <div className="p-4 sm:p-6 border-b border-[#E8E0D3] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#545454] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search registered guests..."
                    className="w-full pl-9 pr-3.5 py-2 bg-[#FEFDF6] border border-[#DCD9C9] text-xs focus:outline-none focus:border-[#02084B]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  {(["all", "active", "inactive"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`text-xs tracking-wider uppercase px-3.5 py-1.5 transition-colors ${
                        statusFilter === filter
                          ? "bg-[#02084B] text-white"
                          : "bg-[#FEFDF6] text-[#545454] border border-[#DCD9C9] hover:text-[#02084B]"
                      }`}
                    >
                      {filter === "all" ? "All Guests" : filter === "active" ? "Turned ON" : "Turned OFF"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FEFDF6] border-b border-[#E8E0D3] text-[11px] tracking-[0.2em] uppercase text-[#545454]">
                      <th className="py-3.5 px-6 font-medium">Guest Name</th>
                      <th className="py-3.5 px-6 font-medium">PIN Protection</th>
                      <th className="py-3.5 px-6 font-medium">Status / Turn On</th>
                      <th className="py-3.5 px-6 font-medium">Admin Privilege</th>
                      <th className="py-3.5 px-6 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D3] text-xs">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#545454]">
                          Loading wedding guest register...
                        </td>
                      </tr>
                    ) : filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#545454]">
                          No guests match your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredGuests.map((guest) => (
                        <tr key={guest.id} className="hover:bg-[#FEFDF6]/60 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-serif text-base text-[#02084B] flex items-center gap-2">
                              <span>{guest.first_name} {guest.last_name}</span>
                              {guest.is_admin && (
                                <span className="inline-flex items-center gap-1 text-[10px] tracking-wider uppercase bg-[#02084B] text-white px-2 py-0.5 rounded font-sans font-medium">
                                  <Shield className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                  <span>Admin</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] tracking-wider text-[#545454] uppercase">
                              Added {new Date(guest.created_at).toLocaleDateString()}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            {guest.pin_code ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-[#FEFDF6] border border-[#DCD9C9] px-2 py-0.5 text-[#02084B]">
                                <KeyRound className="w-3 h-3 text-[#02084B]" />
                                <span>{guest.pin_code}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#545454] italic">No PIN (Direct Entry)</span>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            <button
                              type="button"
                              onClick={() => handleToggleGuest(guest.id, guest.is_active)}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 border text-xs tracking-wider uppercase font-medium transition-all ${
                                guest.is_active
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                  : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                              }`}
                              title={`Click to turn ${guest.is_active ? "OFF" : "ON"}`}
                            >
                              {guest.is_active ? (
                                <>
                                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                                  <span>TURNED ON</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                                  <span>TURNED OFF</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-4 px-6">
                            <button
                              type="button"
                              onClick={() => handleToggleAdminRole(guest.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs tracking-wider uppercase font-medium transition-all ${
                                guest.is_admin
                                  ? "bg-[#02084B] text-white border-[#02084B] shadow-sm hover:bg-[#1a237e]"
                                  : "bg-[#FEFDF6] text-[#545454] border-[#DCD9C9] hover:border-[#02084B] hover:text-[#02084B]"
                              }`}
                              title={guest.is_admin ? "Click to revoke Admin access" : "Click to grant Admin access"}
                            >
                              <Shield className={`w-3.5 h-3.5 ${guest.is_admin ? "text-amber-400 fill-amber-400" : "text-[#545454]"}`} />
                              <span>{guest.is_admin ? "Revoke Admin" : "Make Admin"}</span>
                            </button>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteGuest(guest.id, `${guest.first_name} ${guest.last_name}`)
                              }
                              className="p-1.5 text-[#545454] hover:text-red-600 transition-colors"
                              title="Remove from register"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Storage Usage Card */}
              <div className={`bg-white border p-5 shadow-sm ${dashboardStats?.storage?.isNearLimit ? "border-amber-400 bg-amber-50/40" : "border-[#DCD9C9]"}`}>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Storage
                </span>
                <div className="flex items-baseline justify-between">
                  <span className={`font-serif text-3xl ${dashboardStats?.storage?.isNearLimit ? "text-amber-600" : "text-[#02084B]"}`}>
                    {dashboardStats?.storage?.usedMB ?? "—"}
                    <span className="text-sm font-sans font-normal ml-1">MB</span>
                  </span>
                  <span className="text-[11px] text-[#545454]">
                    / {dashboardStats?.storage?.limitMB ?? 1024} MB
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dashboardStats?.storage?.isNearLimit ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(dashboardStats?.storage?.percentUsed ?? 0, 100)}%` }}
                  />
                </div>
                {dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-amber-700 mt-1.5 font-medium">
                    ⚡ Drive failover active
                  </p>
                )}
                {!dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-emerald-700 mt-1.5">
                    {dashboardStats?.storage?.percentUsed ?? 0}% used
                  </p>
                )}
              </div>
            </div>

            {/* ── Storage Failover Test Panel ─────────────────────────────── */}
            <div className="bg-white border border-[#DCD9C9] p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-[#E8E0D3] gap-3">
                <div>
                  <h2 className="font-serif text-xl text-[#02084B] uppercase tracking-wide">
                    Storage Failover Test
                  </h2>
                  <p className="text-xs text-[#545454] mt-1">
                    Verify that the auto-failover to Google Drive is wired up correctly. The dry-run uploads a 67-byte test PNG and immediately deletes it — nothing stays in Drive.
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button
                    onClick={async () => {
                      setIsCheckingStorage(true);
                      setStorageTestStatus(null);
                      try {
                        const r = await fetch("/api/admin/storage-test");
                        setStorageTestStatus(await r.json());
                      } catch (e: any) {
                        setStorageTestStatus({ ok: false, error: e.message });
                      } finally {
                        setIsCheckingStorage(false);
                      }
                    }}
                    disabled={isCheckingStorage}
                    className="px-4 py-2 text-xs tracking-widest uppercase border border-[#02084B] text-[#02084B] hover:bg-[#02084B] hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isCheckingStorage ? "Checking…" : "Check Status"}
                  </button>
                  <button
                    onClick={async () => {
                      setIsRunningDriveTest(true);
                      setStorageTestResult(null);
                      try {
                        const r = await fetch("/api/admin/storage-test", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ simulate900mb: false }),
                        });
                        setStorageTestResult(await r.json());
                      } catch (e: any) {
                        setStorageTestResult({ ok: false, error: e.message });
                      } finally {
                        setIsRunningDriveTest(false);
                      }
                    }}
                    disabled={isRunningDriveTest}
                    className="px-4 py-2 text-xs tracking-widest uppercase bg-[#02084B] text-white hover:bg-[#304254] transition-colors disabled:opacity-50"
                  >
                    {isRunningDriveTest ? "Testing…" : "▶ Run Dry-Run"}
                  </button>
                </div>
              </div>

              {/* Status check result */}
              {storageTestStatus && (
                <div className="mb-6 space-y-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#545454] mb-2">
                    Status — checked {new Date(storageTestStatus.checkedAt || Date.now()).toLocaleTimeString()} · {storageTestStatus.latencyMs}ms
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Storage */}
                    <div className={`border p-4 ${storageTestStatus.storage?.isNearLimit ? "border-amber-400 bg-amber-50" : "border-emerald-200 bg-emerald-50/40"}`}>
                      <p className="text-[10px] uppercase tracking-widest text-[#545454] mb-1">Supabase Storage</p>
                      <p className={`text-2xl font-serif ${storageTestStatus.storage?.isNearLimit ? "text-amber-700" : "text-emerald-700"}`}>
                        {storageTestStatus.storage?.usedMB} MB
                      </p>
                      <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${storageTestStatus.storage?.isNearLimit ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(storageTestStatus.storage?.percentUsed ?? 0, 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] mt-1 text-[#545454]">
                        {storageTestStatus.storage?.percentUsed}% · {storageTestStatus.storage?.remainingMB} MB free
                      </p>
                      <p className="text-[11px] mt-1 font-medium">
                        Failover threshold: 900 MB
                      </p>
                      <p className={`text-[11px] mt-0.5 font-semibold ${storageTestStatus.storage?.failoverWouldTrigger ? "text-amber-700" : "text-emerald-700"}`}>
                        {storageTestStatus.storage?.failoverWouldTrigger ? "⚡ Would trigger failover NOW" : "✅ Supabase is primary (normal)"}
                      </p>
                    </div>

                    {/* Drive */}
                    <div className={`border p-4 ${storageTestStatus.drive?.connected ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50"}`}>
                      <p className="text-[10px] uppercase tracking-widest text-[#545454] mb-1">Google Drive</p>
                      <p className={`text-2xl font-serif ${storageTestStatus.drive?.connected ? "text-emerald-700" : "text-red-600"}`}>
                        {storageTestStatus.drive?.connected ? "✅ Connected" : "❌ Error"}
                      </p>
                      {storageTestStatus.drive?.folderId && (
                        <p className="text-[11px] mt-2 font-mono text-[#545454] break-all">
                          Folder: {storageTestStatus.drive.folderId.slice(0, 20)}…
                        </p>
                      )}
                      {storageTestStatus.drive?.error && (
                        <p className="text-[11px] mt-2 text-red-600">{storageTestStatus.drive.error}</p>
                      )}
                      <p className="text-[11px] mt-2 text-[#545454]">
                        {storageTestStatus.drive?.connected
                          ? "drive.file write scope active"
                          : "Cannot failover — fix credentials"}
                      </p>
                    </div>

                    {/* Overall */}
                    <div className={`border p-4 ${storageTestStatus.ok && storageTestStatus.drive?.connected ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50"}`}>
                      <p className="text-[10px] uppercase tracking-widest text-[#545454] mb-1">Failover Readiness</p>
                      <p className={`text-2xl font-serif ${storageTestStatus.ok && storageTestStatus.drive?.connected ? "text-emerald-700" : "text-red-600"}`}>
                        {storageTestStatus.ok && storageTestStatus.drive?.connected ? "Ready" : "Not Ready"}
                      </p>
                      <p className="text-[11px] mt-2 text-[#545454]">
                        {storageTestStatus.ok && storageTestStatus.drive?.connected
                          ? "If Supabase hits 900 MB, uploads will silently switch to Drive. No guest action needed."
                          : "Fix the Drive connection error above before failover will work."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dry-run result */}
              {storageTestResult && (
                <div className={`border p-5 ${storageTestResult.ok ? "border-emerald-300 bg-emerald-50/50" : "border-red-300 bg-red-50"}`}>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#545454] mb-2">Dry-Run Result</p>
                  <p className={`font-medium text-sm ${storageTestResult.ok ? "text-emerald-800" : "text-red-700"}`}>
                    {storageTestResult.message || storageTestResult.error}
                  </p>
                  {storageTestResult.ok && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
                      <div>
                        <span className="text-[#545454] block">Drive latency</span>
                        <span className="text-[#02084B] font-semibold">{storageTestResult.uploadLatencyMs}ms</span>
                      </div>
                      <div>
                        <span className="text-[#545454] block">Test file deleted</span>
                        <span className={storageTestResult.deletedAfterTest ? "text-emerald-700 font-semibold" : "text-amber-600 font-semibold"}>
                          {storageTestResult.deletedAfterTest ? "Yes ✓" : "No — check Drive"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#545454] block">Storage used</span>
                        <span className="text-[#02084B] font-semibold">{storageTestResult.storage?.usedMB} MB</span>
                      </div>
                      <div>
                        <span className="text-[#545454] block">Failover active</span>
                        <span className={storageTestResult.storage?.failoverWouldTrigger ? "text-amber-600 font-semibold" : "text-emerald-700 font-semibold"}>
                          {storageTestResult.storage?.failoverWouldTrigger ? "Yes ⚡" : "No (normal)"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!storageTestStatus && !storageTestResult && (
                <p className="text-xs text-[#545454] text-center py-6">
                  Click <strong>Check Status</strong> to see current storage + Drive connectivity, or <strong>Run Dry-Run</strong> to do a live upload test to Drive.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PHOTO MODERATION QUEUE */}
        {/* ========================================================================= */}
        {activeTab === "moderation" && (
          <section className="space-y-8 animate-in fade-in">
            <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl text-[#02084B] uppercase">
                  Guest Photo Moderation Queue
                </h2>
                <p className="text-xs text-[#545454]">
                  Review, edit captions, and approve photographs uploaded by wedding guests before they appear in the public gallery.
                </p>
              </div>
              <button
                onClick={fetchModerationQueue}
                className="inline-flex items-center gap-1.5 text-xs tracking-wider uppercase px-3 py-1.5 border border-[#DCD9C9] hover:bg-[#F2EEEB]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Queue</span>
              </button>
            </div>

            {pendingPhotos.length === 0 ? (
              <div className="bg-white border border-[#DCD9C9] p-12 text-center shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-serif text-xl text-[#02084B]">Moderation Queue Is Empty</h3>
                <p className="text-xs text-[#545454] mt-1">
                  All guest photographs have been moderated. New uploads will appear here immediately.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="bg-white border border-[#DCD9C9] shadow-sm flex flex-col overflow-hidden"
                  >
                    <div className="relative aspect-[4/3] bg-[#F2EEEB]">
                      <Image
                        src={photo.display_url}
                        alt={photo.caption || photo.filename}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-[#545454] mb-2">
                          <span className="font-medium text-[#02084B]">By {photo.uploader_name}</span>
                          <span>{new Date(photo.uploaded_at).toLocaleDateString()}</span>
                        </div>

                        {/* Caption Editor */}
                        {editingCaptionId === photo.id ? (
                          <div className="space-y-2 mb-3">
                            <textarea
                              rows={2}
                              value={editingCaptionText}
                              onChange={(e) => setEditingCaptionText(e.target.value)}
                              className="w-full p-2 text-xs border border-[#02084B] bg-[#FEFDF6]"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveCaption(photo.id)}
                                className="text-[11px] px-2.5 py-1 bg-[#02084B] text-white"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCaptionId(null)}
                                className="text-[11px] px-2.5 py-1 border"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4">
                            <p className="text-xs text-[#304254] font-serif italic mb-1">
                              &ldquo;{photo.caption || "No caption provided"}&rdquo;
                            </p>
                            <button
                              onClick={() => {
                                setEditingCaptionId(photo.id);
                                setEditingCaptionText(photo.caption || "");
                              }}
                              className="text-[10px] tracking-wider uppercase text-[#02084B] flex items-center gap-1 hover:underline"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit Caption</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Approval Actions */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E8E0D3]">
                        <button
                          onClick={() => handleModeratePhoto(photo.id, "approved")}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white text-xs uppercase tracking-wider hover:bg-emerald-700 transition-colors font-medium"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => handleModeratePhoto(photo.id, "rejected")}
                          className="px-3 py-2 border border-gray-300 text-gray-700 text-xs uppercase tracking-wider hover:bg-gray-100 transition-colors"
                        >
                          Reject
                        </button>

                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: GOOGLE DRIVE INTEGRATION & SYNC */}
        {/* ========================================================================= */}
        {activeTab === "drive" && (
          <section className="space-y-8 animate-in fade-in">
            <div className="bg-white border border-[#DCD9C9] p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#E8E0D3] gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Cloud className="w-5 h-5 text-[#02084B]" />
                    <h2 className="font-serif text-2xl text-[#02084B] uppercase">
                      Google Drive Wedding Folder
                    </h2>
                  </div>
                  <p className="text-xs text-[#545454]">
                    Read through a server-side Service Account with automatic photograph discovery and metadata synchronization.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleFlushPhotos}
                    variant="outline"
                    size="md"
                    className="gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    isLoading={isFlushing}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Flush Photos</span>
                  </Button>

                  <Button
                    onClick={handleTriggerDriveSync}
                    variant="primary"
                    size="md"
                    className="gap-2 self-start sm:self-auto"
                    isLoading={isSyncing}
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>Synchronize Drive Now</span>
                  </Button>
                </div>
              </div>

              {/* Status Indicator Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-[#FEFDF6] border border-[#E8E0D3]">
                  <span className="text-[10px] tracking-wider uppercase text-[#545454] block mb-1">
                    Service Account Auth
                  </span>
                  <div className="flex items-center gap-1.5">
                    {driveStatus?.hasServiceAccountEmail ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#02084B]" />
                    )}
                    <span className="text-xs font-medium text-[#02084B]">
                      {driveStatus?.clientEmail || "Local Service Account Mode"}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-[#FEFDF6] border border-[#E8E0D3]">
                  <span className="text-[10px] tracking-wider uppercase text-[#545454] block mb-1">
                    Private Key Credential
                  </span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-[#02084B]">
                      Secured Server-Side (Never Exposed)
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-[#FEFDF6] border border-[#E8E0D3]">
                  <span className="text-[10px] tracking-wider uppercase text-[#545454] block mb-1">
                    Target Folder ID
                  </span>
                  <div className="flex items-center gap-1.5">
                    <FolderSync className="w-4 h-4 text-[#02084B]" />
                    <span className="text-xs font-mono text-[#02084B] truncate">
                      {driveStatus?.folderId || "wedding-album-2026-drive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Sync Result Banner */}
              {syncResult && (
                <div
                  className={`p-5 border text-xs leading-relaxed animate-in fade-in ${
                    syncResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-sm mb-2">
                    {syncResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span>
                      {syncResult.success
                        ? "Google Drive Synchronized Successfully"
                        : "Synchronization Completed with Notice"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-emerald-200/60 font-mono">
                    <div>
                      <span className="text-[10px] text-emerald-700 uppercase block">Total Scanned</span>
                      <strong className="text-sm">{syncResult.totalDiscovered} photos</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 uppercase block">New Added</span>
                      <strong className="text-sm">{syncResult.newAdded} photos</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 uppercase block">Updated</span>
                      <strong className="text-sm">{syncResult.updated} photos</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 uppercase block">Sync Speed</span>
                      <strong className="text-sm">{syncResult.durationMs}ms</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Danger Zone: Flush All Existing Photos */}
              <div className="mt-8 pt-6 border-t border-red-200/60 bg-red-50/40 p-5 sm:p-6 border border-red-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-red-700 font-semibold text-xs uppercase tracking-wider mb-1">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>Danger Zone: Flush & Reset Gallery</span>
                    </div>
                    <p className="text-xs text-red-700/80 max-w-xl">
                      Permanently wipes all existing photo records, like counts, and cached thumbnails from Supabase and in-memory cache. Use this to clear the gallery before running a fresh sync.
                    </p>
                    {flushMessage && (
                      <p className="mt-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 inline-block border border-emerald-300">
                        {flushMessage}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleFlushPhotos}
                    variant="outline"
                    size="sm"
                    className="border-red-400 text-red-700 hover:bg-red-600 hover:text-white shrink-0 gap-2 self-start sm:self-auto"
                    isLoading={isFlushing}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Flush All Existing Photos</span>
                  </Button>
                </div>
              </div>

              {/* Storage Usage Card */}
              <div className={`bg-white border p-5 shadow-sm ${dashboardStats?.storage?.isNearLimit ? "border-amber-400 bg-amber-50/40" : "border-[#DCD9C9]"}`}>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Storage
                </span>
                <div className="flex items-baseline justify-between">
                  <span className={`font-serif text-3xl ${dashboardStats?.storage?.isNearLimit ? "text-amber-600" : "text-[#02084B]"}`}>
                    {dashboardStats?.storage?.usedMB ?? "—"}
                    <span className="text-sm font-sans font-normal ml-1">MB</span>
                  </span>
                  <span className="text-[11px] text-[#545454]">
                    / {dashboardStats?.storage?.limitMB ?? 1024} MB
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dashboardStats?.storage?.isNearLimit ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(dashboardStats?.storage?.percentUsed ?? 0, 100)}%` }}
                  />
                </div>
                {dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-amber-700 mt-1.5 font-medium">
                    ⚡ Drive failover active
                  </p>
                )}
                {!dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-emerald-700 mt-1.5">
                    {dashboardStats?.storage?.percentUsed ?? 0}% used
                  </p>
                )}
              </div>
            </div>

            {/* ── Storage Failover Test Panel ─────────────────────────────── */}
            <div className="bg-white border border-[#DCD9C9] p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-[#E8E0D3] gap-3">
                <div>
                  <h2 className="font-serif text-xl text-[#02084B] uppercase tracking-wide">
                    Storage Failover Test
                  </h2>
                  <p className="text-xs text-[#545454] mt-1">
                    Verify that the auto-failover to Google Drive is wired up correctly. The dry-run uploads a 67-byte test PNG and immediately deletes it — nothing stays in Drive.
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button
                    onClick={async () => {
                      setIsCheckingStorage(true);
                      setStorageTestStatus(null);
                      try {
                        const r = await fetch("/api/admin/storage-test");
                        setStorageTestStatus(await r.json());
                      } catch (e: any) {
                        setStorageTestStatus({ ok: false, error: e.message });
                      } finally {
                        setIsCheckingStorage(false);
                      }
                    }}
                    disabled={isCheckingStorage}
                    className="px-4 py-2 text-xs tracking-widest uppercase border border-[#02084B] text-[#02084B] hover:bg-[#02084B] hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isCheckingStorage ? "Checking…" : "Check Status"}
                  </button>
                  <button
                    onClick={async () => {
                      setIsRunningDriveTest(true);
                      setStorageTestResult(null);
                      try {
                        const r = await fetch("/api/admin/storage-test", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ simulate900mb: false }),
                        });
                        setStorageTestResult(await r.json());
                      } catch (e: any) {
                        setStorageTestResult({ ok: false, error: e.message });
                      } finally {
                        setIsRunningDriveTest(false);
                      }
                    }}
                    disabled={isRunningDriveTest}
                    className="px-4 py-2 text-xs tracking-widest uppercase bg-[#02084B] text-white hover:bg-[#304254] transition-colors disabled:opacity-50"
                  >
                    {isRunningDriveTest ? "Testing…" : "▶ Run Dry-Run"}
                  </button>
                </div>
              </div>

              {/* Status check result */}
              {storageTestStatus && (
                <div className="mb-6 space-y-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#545454] mb-2">
                    Status — checked {new Date(storageTestStatus.checkedAt || Date.now()).toLocaleTimeString()} · {storageTestStatus.latencyMs}ms
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Storage */}
                    <div className={`border p-4 ${storageTestStatus.storage?.isNearLimit ? "border-amber-400 bg-amber-50" : "border-emerald-200 bg-emerald-50/40"}`}>
                      <p className="text-[10px] uppercase tracking-widest text-[#545454] mb-1">Supabase Storage</p>
                      <p className={`text-2xl font-serif ${storageTestStatus.storage?.isNearLimit ? "text-amber-700" : "text-emerald-700"}`}>
                        {storageTestStatus.storage?.usedMB} MB
                      </p>
                      <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${storageTestStatus.storage?.isNearLimit ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(storageTestStatus.storage?.percentUsed ?? 0, 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] mt-1 text-[#545454]">
                        {storageTestStatus.storage?.percentUsed}% · {storageTestStatus.storage?.remainingMB} MB free
                      </p>
                      <p className="text-[11px] mt-1 font-medium">
                        Failover threshold: 900 MB
                      </p>
                      <p className={`text-[11px] mt-0.5 font-semibold ${storageTestStatus.storage?.failoverWouldTrigger ? "text-amber-700" : "text-emerald-700"}`}>
                        {storageTestStatus.storage?.failoverWouldTrigger ? "⚡ Would trigger failover NOW" : "✅ Supabase is primary (normal)"}
                      </p>
                    </div>

                    {/* Drive */}
                    <div className={`border p-4 ${storageTestStatus.drive?.connected ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50"}`}>
                      <p className="text-[10px] uppercase tracking-widest text-[#545454] mb-1">Google Drive</p>
                      <p className={`text-2xl font-serif ${storageTestStatus.drive?.connected ? "text-emerald-700" : "text-red-600"}`}>
                        {storageTestStatus.drive?.connected ? "✅ Connected" : "❌ Error"}
                      </p>
                      {storageTestStatus.drive?.folderId && (
                        <p className="text-[11px] mt-2 font-mono text-[#545454] break-all">
                          Folder: {storageTestStatus.drive.folderId.slice(0, 20)}…
                        </p>
                      )}
                      {storageTestStatus.drive?.error && (
                        <p className="text-[11px] mt-2 text-red-600">{storageTestStatus.drive.error}</p>
                      )}
                      <p className="text-[11px] mt-2 text-[#545454]">
                        {storageTestStatus.drive?.connected
                          ? "drive.file write scope active"
                          : "Cannot failover — fix credentials"}
                      </p>
                    </div>

                    {/* Overall */}
                    <div className={`border p-4 ${storageTestStatus.ok && storageTestStatus.drive?.connected ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50"}`}>
                      <p className="text-[10px] uppercase tracking-widest text-[#545454] mb-1">Failover Readiness</p>
                      <p className={`text-2xl font-serif ${storageTestStatus.ok && storageTestStatus.drive?.connected ? "text-emerald-700" : "text-red-600"}`}>
                        {storageTestStatus.ok && storageTestStatus.drive?.connected ? "Ready" : "Not Ready"}
                      </p>
                      <p className="text-[11px] mt-2 text-[#545454]">
                        {storageTestStatus.ok && storageTestStatus.drive?.connected
                          ? "If Supabase hits 900 MB, uploads will silently switch to Drive. No guest action needed."
                          : "Fix the Drive connection error above before failover will work."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dry-run result */}
              {storageTestResult && (
                <div className={`border p-5 ${storageTestResult.ok ? "border-emerald-300 bg-emerald-50/50" : "border-red-300 bg-red-50"}`}>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#545454] mb-2">Dry-Run Result</p>
                  <p className={`font-medium text-sm ${storageTestResult.ok ? "text-emerald-800" : "text-red-700"}`}>
                    {storageTestResult.message || storageTestResult.error}
                  </p>
                  {storageTestResult.ok && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
                      <div>
                        <span className="text-[#545454] block">Drive latency</span>
                        <span className="text-[#02084B] font-semibold">{storageTestResult.uploadLatencyMs}ms</span>
                      </div>
                      <div>
                        <span className="text-[#545454] block">Test file deleted</span>
                        <span className={storageTestResult.deletedAfterTest ? "text-emerald-700 font-semibold" : "text-amber-600 font-semibold"}>
                          {storageTestResult.deletedAfterTest ? "Yes ✓" : "No — check Drive"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#545454] block">Storage used</span>
                        <span className="text-[#02084B] font-semibold">{storageTestResult.storage?.usedMB} MB</span>
                      </div>
                      <div>
                        <span className="text-[#545454] block">Failover active</span>
                        <span className={storageTestResult.storage?.failoverWouldTrigger ? "text-amber-600 font-semibold" : "text-emerald-700 font-semibold"}>
                          {storageTestResult.storage?.failoverWouldTrigger ? "Yes ⚡" : "No (normal)"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!storageTestStatus && !storageTestResult && (
                <p className="text-xs text-[#545454] text-center py-6">
                  Click <strong>Check Status</strong> to see current storage + Drive connectivity, or <strong>Run Dry-Run</strong> to do a live upload test to Drive.
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      {/* CSV Bulk Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCD9C9] max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in">
            <h3 className="font-serif text-2xl text-[#02084B] uppercase mb-2">
              Bulk Import Wedding Guests
            </h3>
            <p className="text-xs text-[#545454] mb-4">
              Paste guest list rows below. Format: <code className="bg-[#FEFDF6] px-1 py-0.5 border">FirstName, LastName, PIN (optional)</code>
            </p>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="First Name, Last Name, PIN&#10;Arthur, Pendelton, 1234&#10;Victoria, Sterling&#10;Julian, Ross, 5678"
              className="w-full p-3 font-mono text-xs bg-[#FEFDF6] border border-[#DCD9C9] focus:outline-none focus:border-[#02084B] mb-4"
            />

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setCsvText(
                    "First Name, Last Name, PIN\nArthur, Pendelton, 1234\nVictoria, Sterling\nJulian, Ross, 5678"
                  )
                }
                className="text-[11px] text-[#02084B] hover:underline"
              >
                Insert Sample Data
              </button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCsvModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCsvImport}
                  isLoading={isImporting}
                >
                  Import Guests
                </Button>
              </div>

              {/* Storage Usage Card */}
              <div className={`bg-white border p-5 shadow-sm ${dashboardStats?.storage?.isNearLimit ? "border-amber-400 bg-amber-50/40" : "border-[#DCD9C9]"}`}>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Storage
                </span>
                <div className="flex items-baseline justify-between">
                  <span className={`font-serif text-3xl ${dashboardStats?.storage?.isNearLimit ? "text-amber-600" : "text-[#02084B]"}`}>
                    {dashboardStats?.storage?.usedMB ?? "—"}
                    <span className="text-sm font-sans font-normal ml-1">MB</span>
                  </span>
                  <span className="text-[11px] text-[#545454]">
                    / {dashboardStats?.storage?.limitMB ?? 1024} MB
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dashboardStats?.storage?.isNearLimit ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(dashboardStats?.storage?.percentUsed ?? 0, 100)}%` }}
                  />
                </div>
                {dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-amber-700 mt-1.5 font-medium">
                    ⚡ Drive failover active
                  </p>
                )}
                {!dashboardStats?.storage?.isNearLimit && (
                  <p className="text-[10px] text-emerald-700 mt-1.5">
                    {dashboardStats?.storage?.percentUsed ?? 0}% used
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
