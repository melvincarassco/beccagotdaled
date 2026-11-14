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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Guest, Photo } from "@/types";

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

export default function AdminPortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"overview" | "guests" | "moderation" | "drive">("overview");

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
                  placeholder="Master Passphrase (default: RebeccaDale2026!)"
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

            <div className="mt-6 pt-4 border-t border-[#E8E0D3] text-[11px] text-[#545454]">
              Default local password: <code className="bg-[#FEFDF6] px-1 border font-mono">RebeccaDale2026!</code>
            </div>
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
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm">
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Registered Guests
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-4xl text-[#02084B]">{totalGuests}</span>
                  <span className="text-xs text-emerald-700 font-medium">{activeCount} active</span>
                </div>
              </div>

              <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm">
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Gallery Photos
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-4xl text-[#02084B]">
                    {dashboardStats?.photos?.approvedPhotos || 6}
                  </span>
                  <span className="text-xs text-[#545454]">
                    {dashboardStats?.photos?.drivePhotos || 3} Drive • {dashboardStats?.photos?.guestPhotos || 3} Guests
                  </span>
                </div>
              </div>

              <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm">
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Total Platform Likes
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-4xl text-[#02084B]">
                    {dashboardStats?.photos?.totalLikes || 223}
                  </span>
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </div>
              </div>

              <div className="bg-white border border-[#DCD9C9] p-6 shadow-sm">
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#545454] block mb-1">
                  Pending Moderation
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-4xl text-amber-600">
                    {pendingPhotos.length}
                  </span>
                  {pendingPhotos.length > 0 ? (
                    <button
                      onClick={() => setActiveTab("moderation")}
                      className="text-xs text-[#02084B] underline"
                    >
                      Review now
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700">All clear</span>
                  )}
                </div>
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
            </div>
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
                      <th className="py-3.5 px-6 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D3] text-xs">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-[#545454]">
                          Loading wedding guest register...
                        </td>
                      </tr>
                    ) : filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-[#545454]">
                          No guests match your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredGuests.map((guest) => (
                        <tr key={guest.id} className="hover:bg-[#FEFDF6]/60 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-serif text-base text-[#02084B]">
                              {guest.first_name} {guest.last_name}
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
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
