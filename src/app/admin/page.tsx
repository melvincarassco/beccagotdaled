"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import {
  Shield,
  UserPlus,
  Users,
  CheckCircle,
  XCircle,
  Search,
  Upload,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  KeyRound,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Guest } from "@/types";

export default function AdminPortalPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch guests list
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

  useEffect(() => {
    fetchGuests();
  }, []);

  // Handle adding single guest
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
      }
    } catch {
      setFormFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggling guest active status (Turn On / Turn Off)
  const handleToggleGuest = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    // Optimistic UI update
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
        // Revert on failure
        setGuests((prev) =>
          prev.map((g) => (g.id === id ? { ...g, is_active: currentStatus } : g))
        );
      }
    } catch {
      // Revert on error
      setGuests((prev) =>
        prev.map((g) => (g.id === id ? { ...g, is_active: currentStatus } : g))
      );
    }
  };

  // Handle deleting a guest
  const handleDeleteGuest = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the guest register?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/guests/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGuests((prev) => prev.filter((g) => g.id !== id));
      }
    } catch {
      alert("Failed to delete guest.");
    }
  };

  // Handle CSV bulk import
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
      } else {
        alert(data.error || "CSV import failed.");
      }
    } catch {
      alert("Network error during import.");
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered guest list
  const filteredGuests = guests.filter((g) => {
    const fullName = `${g.first_name} ${g.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || fullName.includes(query);

    if (statusFilter === "active") {
      return matchesSearch && g.is_active;
    }
    if (statusFilter === "inactive") {
      return matchesSearch && !g.is_active;
    }
    return matchesSearch;
  });

  const totalGuests = guests.length;
  const activeCount = guests.filter((g) => g.is_active).length;
  const inactiveCount = totalGuests - activeCount;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2]">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-6 sm:px-10 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#EAE3D9]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#D9CEB2] bg-white text-[11px] tracking-[0.25em] uppercase text-[#746E65] mb-3">
              <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Admin Management Portal</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl tracking-[0.06em] uppercase text-[#22201E]">
              Wedding Guest Register
            </h1>
            <p className="text-xs sm:text-sm text-[#746E65] mt-1 font-light">
              Add registered wedding guests, manage invitations, and toggle guest access on or off.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex gap-3">
            <button
              onClick={() => setShowCsvModal(true)}
              className="inline-flex items-center gap-2 text-xs tracking-wider uppercase px-4 py-2.5 bg-white border border-[#D9CEB2] hover:border-[#C5A059] text-[#22201E] transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#C5A059]" />
              <span>Bulk CSV Import</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-[#EAE3D9] p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] tracking-[0.2em] uppercase text-[#746E65] block mb-1">
                Total Guests
              </span>
              <span className="font-serif text-4xl text-[#22201E]">{totalGuests}</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#D9CEB2] flex items-center justify-center">
              <Users className="w-6 h-6 text-[#22201E]" />
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

          <div className="bg-white border border-[#EAE3D9] p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] tracking-[0.2em] uppercase text-[#746E65] block mb-1">
                Turned OFF (Inactive)
              </span>
              <span className="font-serif text-4xl text-[#746E65]">{inactiveCount}</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#D9CEB2] flex items-center justify-center">
              <XCircle className="w-6 h-6 text-[#746E65]" />
            </div>
          </div>
        </div>

        {/* Add Guest Card */}
        <div className="bg-white border border-[#D9CEB2] p-6 sm:p-8 shadow-sm mb-12">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-[#C5A059]" />
            <h2 className="font-serif text-xl sm:text-2xl text-[#22201E] uppercase tracking-wide">
              Add New Wedding Guest
            </h2>
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
              <label className="block text-xs tracking-wider uppercase text-[#22201E] mb-1 font-medium">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Charlotte"
                required
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D9CEB2] text-sm text-[#22201E] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs tracking-wider uppercase text-[#22201E] mb-1 font-medium">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Hayes"
                required
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D9CEB2] text-sm text-[#22201E] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs tracking-wider uppercase text-[#22201E] mb-1 font-medium flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-[#C5A059]" />
                <span>Optional PIN</span>
              </label>
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="e.g. 2026 (Optional)"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D9CEB2] text-sm text-[#22201E] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="sm:col-span-3 flex flex-col justify-end">
              <div className="flex items-center gap-3 h-[42px]">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs tracking-wider uppercase text-[#22201E]">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-[#C5A059]"
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
        <div className="bg-white border border-[#EAE3D9] shadow-sm">
          {/* Table Controls */}
          <div className="p-4 sm:p-6 border-b border-[#EAE3D9] flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#746E65] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered guests..."
                className="w-full pl-9 pr-3.5 py-2 bg-[#FAF7F2] border border-[#D9CEB2] text-xs focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center space-x-2">
              {(["all", "active", "inactive"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`text-xs tracking-wider uppercase px-3.5 py-1.5 transition-colors ${
                    statusFilter === filter
                      ? "bg-[#22201E] text-white"
                      : "bg-[#FAF7F2] text-[#746E65] border border-[#EAE3D9] hover:text-[#22201E]"
                  }`}
                >
                  {filter === "all" ? "All Guests" : filter === "active" ? "Turned ON" : "Turned OFF"}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#EAE3D9] text-[11px] tracking-[0.2em] uppercase text-[#746E65]">
                  <th className="py-3.5 px-6 font-medium">Guest Name</th>
                  <th className="py-3.5 px-6 font-medium">PIN Protection</th>
                  <th className="py-3.5 px-6 font-medium">Status / Turn On</th>
                  <th className="py-3.5 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D9] text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#746E65]">
                      Loading wedding guest register...
                    </td>
                  </tr>
                ) : filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#746E65]">
                      No guests match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      {/* Name */}
                      <td className="py-4 px-6">
                        <div className="font-serif text-base text-[#22201E]">
                          {guest.first_name} {guest.last_name}
                        </div>
                        <span className="text-[10px] tracking-wider text-[#746E65] uppercase">
                          Added {new Date(guest.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      {/* PIN */}
                      <td className="py-4 px-6">
                        {guest.pin_code ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-[#FAF7F2] border border-[#D9CEB2] px-2 py-0.5 text-[#22201E]">
                            <KeyRound className="w-3 h-3 text-[#C5A059]" />
                            <span>{guest.pin_code}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#746E65] italic">No PIN (Direct Entry)</span>
                        )}
                      </td>

                      {/* Turn On / Turn Off Toggle */}
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

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteGuest(guest.id, `${guest.first_name} ${guest.last_name}`)
                          }
                          className="p-1.5 text-[#746E65] hover:text-red-600 transition-colors"
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
      </main>

      {/* CSV Bulk Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9CEB2] max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in">
            <h3 className="font-serif text-2xl text-[#22201E] uppercase mb-2">
              Bulk Import Wedding Guests
            </h3>
            <p className="text-xs text-[#746E65] mb-4">
              Paste guest list rows below. Format: <code className="bg-[#FAF7F2] px-1 py-0.5 border">FirstName, LastName, PIN (optional)</code>
            </p>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="First Name, Last Name, PIN&#10;Arthur, Pendelton, 1234&#10;Victoria, Sterling&#10;Julian, Ross, 5678"
              className="w-full p-3 font-mono text-xs bg-[#FAF7F2] border border-[#D9CEB2] focus:outline-none focus:border-[#C5A059] mb-4"
            />

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setCsvText(
                    "First Name, Last Name, PIN\nArthur, Pendelton, 1234\nVictoria, Sterling\nJulian, Ross, 5678"
                  )
                }
                className="text-[11px] text-[#C5A059] hover:underline"
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
