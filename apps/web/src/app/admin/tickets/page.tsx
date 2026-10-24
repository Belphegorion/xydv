'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChatText,
  CheckCircle,
  Warning,
  X,
  ArrowClockwise,
  Eye,
  Envelope,
  User,
  Tag,
  Calendar,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

interface SupportTicket {
  _id: string;
  ticketId: string;
  name: string;
  email: string;
  topic: string;
  orderId?: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams: Record<string, string | number> = {
        page,
        limit: 20,
      };
      if (statusFilter !== 'all') {
        queryParams.status = statusFilter;
      }
      const qs = new URLSearchParams(
        Object.entries(queryParams).map(([k, v]) => [k, String(v)]),
      ).toString();

      const res = await api.get<{
        success: boolean;
        data: SupportTicket[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/admin/tickets?${qs}`);

      if (res && res.data) {
        setTickets(res.data);
        setTotal(res.pagination?.total ?? res.data.length);
        setTotalPages(res.pagination?.pages ?? 1);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load support tickets';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdateStatus = async (ticketId: string, newStatus: SupportTicket['status']) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/admin/tickets/${ticketId}/status`, { status: newStatus });
      setFeedback({
        type: 'success',
        message: `Ticket status successfully updated to ${newStatus.replace('_', ' ').toUpperCase()}.`,
      });
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      fetchTickets();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update ticket status';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 rounded-none border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-amber-500 uppercase">
            OPEN
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-none border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-sky-400 uppercase">
            IN PROGRESS
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 rounded-none border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
            RESOLVED
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 rounded-none border border-[var(--border)] bg-zinc-800/40 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
            CLOSED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span className="font-mono text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase">
              CLIENT SERVICES DISPATCH
            </span>
          </div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-[var(--text-primary)] uppercase">
            SUPPORT TICKETS
          </h1>
          <p className="font-sans text-xs text-[var(--text-secondary)]">
            Manage athlete support requests, sizing inquiries, order dispatches, and ticket lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTickets}
            disabled={isLoading}
            className="btn-tactile flex items-center gap-2 border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2 font-mono text-xs font-semibold text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] disabled:opacity-50"
          >
            <ArrowClockwise size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center justify-between border p-4 font-mono text-xs ${
            feedback.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/40 bg-red-500/10 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle size={18} weight="bold" />
            ) : (
              <Warning size={18} weight="bold" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-80"
            aria-label="Dismiss feedback"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            Filter Status:
          </span>
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`border px-3 py-1 font-mono text-xs tracking-wider uppercase transition-colors ${
                statusFilter === st
                  ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-black'
                  : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="font-mono text-xs text-[var(--text-muted)]">
          Total: <span className="font-bold text-[var(--text-primary)]">{total}</span> ticket{total === 1 ? '' : 's'}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="overflow-x-auto border border-[var(--border)] bg-[var(--bg-surface)]">
        <table className="w-full text-left font-sans text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg)] font-mono text-[11px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
              <th className="px-4 py-3.5">TICKET ID</th>
              <th className="px-4 py-3.5">ATHLETE</th>
              <th className="px-4 py-3.5">TOPIC</th>
              <th className="px-4 py-3.5">ORDER ID</th>
              <th className="px-4 py-3.5">STATUS</th>
              <th className="px-4 py-3.5">CREATED</th>
              <th className="px-4 py-3.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading && tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center font-mono text-xs text-[var(--text-muted)]">
                  Loading tickets pipeline...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center font-mono text-xs text-[var(--text-muted)]">
                  No support tickets found matching criteria.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t._id} className="transition-colors hover:bg-[var(--bg)]/50">
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-[var(--text-primary)]">
                    {t.ticketId}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-[var(--text-primary)]">{t.name}</div>
                    <div className="font-mono text-[11px] text-[var(--text-secondary)]">{t.email}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-[var(--text-primary)]">{t.topic}</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-[var(--text-muted)]">
                    {t.orderId ? `#${t.orderId}` : '—'}
                  </td>
                  <td className="px-4 py-3.5">{getStatusBadge(t.status)}</td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-[var(--text-muted)]">
                    {new Date(t.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(t)}
                        className="btn-tactile inline-flex items-center gap-1 border border-[var(--border)] bg-transparent px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--text-secondary)] uppercase transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                        title="View Transmission Details"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>

                      <select
                        value={t.status}
                        disabled={isUpdatingStatus}
                        onChange={(e) =>
                          handleUpdateStatus(t._id, e.target.value as SupportTicket['status'])
                        }
                        className="border border-[var(--border)] bg-[var(--bg)] px-2 py-1 font-mono text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        aria-label={`Update status for ticket ${t.ticketId}`}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border border-[var(--border)] px-3 py-1.5 font-mono text-xs uppercase disabled:opacity-40"
          >
            Previous
          </button>
          <span className="font-mono text-xs text-[var(--text-secondary)]">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="border border-[var(--border)] px-3 py-1.5 font-mono text-xs uppercase disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-modal-title"
        >
          <div
            className="w-full max-w-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mb-6 flex items-start justify-between border-b border-[var(--border)] pb-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <ChatText size={18} className="text-[var(--accent)]" />
                  <span className="font-mono text-xs font-bold text-[var(--accent)] uppercase">
                    ATHLETE TRANSMISSION
                  </span>
                </div>
                <h2
                  id="ticket-modal-title"
                  className="font-mono text-lg font-bold tracking-tight text-[var(--text-primary)] uppercase"
                >
                  {selectedTicket.ticketId}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Info Grid */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2.5 border border-[var(--border)] bg-[var(--bg)] p-3">
                <User size={16} className="text-[var(--text-muted)]" />
                <div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Athlete Name</div>
                  <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                    {selectedTicket.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 border border-[var(--border)] bg-[var(--bg)] p-3">
                <Envelope size={16} className="text-[var(--text-muted)]" />
                <div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Email Address</div>
                  <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                    {selectedTicket.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 border border-[var(--border)] bg-[var(--bg)] p-3">
                <Tag size={16} className="text-[var(--text-muted)]" />
                <div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Topic & Order</div>
                  <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                    {selectedTicket.topic} {selectedTicket.orderId ? `(#${selectedTicket.orderId})` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 border border-[var(--border)] bg-[var(--bg)] p-3">
                <Calendar size={16} className="text-[var(--text-muted)]" />
                <div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Status</div>
                  <div className="mt-0.5">{getStatusBadge(selectedTicket.status)}</div>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div className="mb-6">
              <div className="mb-1.5 font-mono text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                TRANSMISSION MESSAGE
              </div>
              <div className="whitespace-pre-wrap border border-[var(--border)] bg-[var(--bg)] p-4 font-mono text-xs leading-relaxed text-[var(--text-primary)]">
                {selectedTicket.message}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--text-secondary)] uppercase">
                  Change Status:
                </span>
                <select
                  value={selectedTicket.status}
                  disabled={isUpdatingStatus}
                  onChange={(e) =>
                    handleUpdateStatus(
                      selectedTicket._id,
                      e.target.value as SupportTicket['status'],
                    )
                  }
                  className="border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  aria-label="Change status in modal"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="btn-tactile border border-[var(--border)] bg-[var(--text-primary)] px-5 py-2 font-mono text-xs font-bold text-[var(--bg)] uppercase transition-colors hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
