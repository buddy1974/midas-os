"use client";

import { useEffect, useState, useRef } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { Contact } from "@/lib/schema";
import AddContactModal from "./AddContactModal";

const PAGE_SIZE = 20;

function formatBudget(min: number | null, max: number | null): string {
  const fmtK = (n: number) => `£${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmtK(min)} – ${fmtK(max)}`;
  if (min) return `${fmtK(min)}+`;
  if (max) return `up to ${fmtK(max)}`;
  return "—";
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  hot: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
  warm: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  cold: { bg: "rgba(96,165,250,0.15)", text: "#60a5fa" },
  vip: { bg: "rgba(201,168,76,0.2)", text: "#C9A84C" },
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 67 ? "#22c55e" : score >= 34 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 rounded-full"
        style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs tabular-nums w-7 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function ContactsTable() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchContacts(q: string, status: string, type: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (status) params.set("status", status);
      if (type) params.set("contact_type", type);
      const res = await fetch(`/api/contacts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json() as Contact[];
      setContacts(data);
      setPage(0);
      setError("");
    } catch {
      setError("Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchContacts(search, statusFilter, typeFilter);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, statusFilter, typeFilter]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.ceil(contacts.length / PAGE_SIZE);
  const paginated = contacts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const startIdx = page * PAGE_SIZE + 1;
  const endIdx = Math.min((page + 1) * PAGE_SIZE, contacts.length);

  return (
    <>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded px-3 py-2 text-sm outline-none flex-1 min-w-[180px]"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <option value="">All Statuses</option>
          {["hot", "warm", "cold", "vip"].map((s) => (
            <option key={s} value={s}>{s.toUpperCase()}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <option value="">All Types</option>
          {["investor", "buyer", "vendor", "lead"].map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <button
          onClick={() => { setEditContact(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-semibold"
          style={{ backgroundColor: "var(--color-gold)", color: "#080809" }}
        >
          <Plus size={14} />
          Add Contact
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded text-sm text-red-400"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--color-border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
                {["Name", "Email", "Phone", "Type", "Budget", "Score", "Status", "Added", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.05)", width: "80%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-text-dim)" }}>
                    No contacts found
                  </td>
                </tr>
              ) : (
                paginated.map((contact) => {
                  const status = contact.status ?? "cold";
                  const sc = STATUS_COLORS[status] ?? STATUS_COLORS.cold;
                  return (
                    <tr
                      key={contact.id}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface)",
                      }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text)" }}>
                        {contact.name}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--color-text-dim)" }}>
                        {contact.email ?? "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--color-text-dim)" }}>
                        {contact.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 capitalize" style={{ color: "var(--color-text-dim)" }}>
                        {contact.contactType ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--color-text-dim)" }}>
                        {formatBudget(contact.budgetMin, contact.budgetMax)}
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: "100px" }}>
                        <ScoreBar score={contact.score ?? 0} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase"
                          style={{ backgroundColor: sc.bg, color: sc.text }}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--color-text-dim)" }}>
                        {new Date(contact.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditContact(contact); setShowModal(true); }}
                            style={{ color: "var(--color-text-dim)" }}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id)}
                            disabled={deletingId === contact.id}
                            className="disabled:opacity-50"
                            style={{ color: "#ef4444" }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {contacts.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            {loading ? "Loading…" : `Showing ${startIdx}–${endIdx} of ${contacts.length} contacts`}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded text-xs disabled:opacity-40"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-dim)",
              }}
            >
              ← Prev
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded text-xs disabled:opacity-40"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-dim)",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddContactModal
          onClose={() => { setShowModal(false); setEditContact(null); }}
          onSaved={(contact) => {
            if (editContact) {
              setContacts((prev) => prev.map((c) => (c.id === contact.id ? contact : c)));
            } else {
              setContacts((prev) => [contact, ...prev]);
            }
            setShowModal(false);
            setEditContact(null);
          }}
          initial={editContact ?? undefined}
          editId={editContact?.id}
        />
      )}
    </>
  );
}
