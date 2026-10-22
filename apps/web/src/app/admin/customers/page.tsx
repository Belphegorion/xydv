'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlass,
  ShieldCheck,
  Prohibit,
  Eye,
  CheckCircle,
  Warning,
  X,
  ArrowClockwise,
  UserCheck,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog';
import { useAdminAuthStore } from '../../../store/adminAuth';
import type { User, Order, UserAddress } from '@vertex/types';

interface CustomerSummary {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  isBlocked: boolean;
  loyaltyPoints: number;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

interface CustomerDetailPayload {
  user: {
    _id: string;
    name: string;
    email: string;
    role: 'customer' | 'admin';
    isBlocked: boolean;
    loyaltyPoints: number;
    addresses: UserAddress[];
    createdAt: string;
    updatedAt: string;
  };
  orders: Order[];
  orderCount: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const { user: currentAdmin } = useAdminAuthStore();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Profile Drawer / Modal state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetailPayload | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Action dialogs
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    customer: CustomerSummary;
    newRole: 'customer' | 'admin';
  } | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const [blockTarget, setBlockTarget] = useState<{
    customer: CustomerSummary;
    block: boolean;
  } | null>(null);
  const [isUpdatingBlock, setIsUpdatingBlock] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams: Record<string, string | number | boolean> = {
        page,
        limit: 15,
      };
      if (search.trim()) queryParams.search = search.trim();
      if (roleFilter !== 'all') queryParams.role = roleFilter;
      if (statusFilter !== 'all') queryParams.status = statusFilter;

      const res = await api.get<{
        data: CustomerSummary[];
        total: number;
        totalPages: number;
      }>('/admin/customers', { params: queryParams });

      setCustomers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch customer directory';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Open customer profile
  const handleOpenProfile = async (id: string) => {
    setSelectedCustomerId(id);
    setIsLoadingDetail(true);
    try {
      const res = await api.get<{ data: CustomerDetailPayload }>(`/admin/customers/${id}`);
      setCustomerDetail(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load customer profile';
      setFeedback({ type: 'error', message: msg });
      setSelectedCustomerId(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Confirm role update
  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return;
    if (isUpdatingRole) return;

    if (roleChangeTarget.customer._id === currentAdmin?._id) {
      setFeedback({ type: 'error', message: 'You cannot demote your own admin account.' });
      setRoleChangeTarget(null);
      return;
    }

    setIsUpdatingRole(true);
    try {
      await api.patch(`/admin/customers/${roleChangeTarget.customer._id}/role`, {
        role: roleChangeTarget.newRole,
      });

      setFeedback({
        type: 'success',
        message: `Account role for "${roleChangeTarget.customer.name}" set to ${roleChangeTarget.newRole.toUpperCase()}.`,
      });
      setRoleChangeTarget(null);
      fetchCustomers();
      if (selectedCustomerId === roleChangeTarget.customer._id) {
        handleOpenProfile(roleChangeTarget.customer._id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update account role';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Confirm block toggle
  const handleConfirmBlockChange = async () => {
    if (!blockTarget) return;
    if (isUpdatingBlock) return;

    if (blockTarget.customer._id === currentAdmin?._id && blockTarget.block) {
      setFeedback({ type: 'error', message: 'You cannot suspend your own admin account.' });
      setBlockTarget(null);
      return;
    }

    setIsUpdatingBlock(true);
    try {
      await api.patch(`/admin/customers/${blockTarget.customer._id}/block`, {
        isBlocked: blockTarget.block,
      });

      setFeedback({
        type: 'success',
        message: `Account for "${blockTarget.customer.name}" has been ${
          blockTarget.block ? 'SUSPENDED' : 'UNBLOCKED'
        }.`,
      });
      setBlockTarget(null);
      fetchCustomers();
      if (selectedCustomerId === blockTarget.customer._id) {
        handleOpenProfile(blockTarget.customer._id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update account status';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsUpdatingBlock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-mono text-xl font-bold tracking-wider text-[#f5f5f5] uppercase">
            Customer Directory & Permissions
          </h2>
          <p className="mt-0.5 font-mono text-xs text-[#71717a]">
            Audit customer accounts, manage administrative roles, and enforce security suspensions (
            {total} registered users)
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCustomers}
          className="inline-flex items-center gap-2 rounded border border-[#1f1f1f] bg-[#111111] px-3.5 py-2 font-mono text-xs tracking-wider text-[#a0a0a0] uppercase transition-colors hover:border-[#333333] hover:text-[#f5f5f5] active:scale-[0.97]"
        >
          <ArrowClockwise size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* Notifications */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded border p-3 font-mono text-xs ${
            feedback.type === 'success'
              ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]'
              : 'border-[#ff3b3b]/30 bg-[#ff3b3b]/10 text-[#ff3b3b]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle size={16} /> : <Warning size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="p-1 hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="grid grid-cols-1 gap-3 rounded border border-[#1f1f1f] bg-[#111111] p-3.5 sm:grid-cols-3">
        <div className="relative">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute top-3 left-3 text-[#71717a]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email address..."
            className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] py-2 pr-3 pl-9 font-mono text-xs text-[#f5f5f5] placeholder-[#52525b] focus:border-[#e8ff00] focus:outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers Only</option>
          <option value="admin">Administrators Only</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
        >
          <option value="all">All Account Statuses</option>
          <option value="active">Active Accounts</option>
          <option value="blocked">Suspended / Fraud Flagged</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden rounded border border-[#1f1f1f] bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="border-b border-[#1f1f1f] bg-[#161616] font-mono tracking-wider text-[#a0a0a0] uppercase">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total Spent</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#71717a]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e8ff00] border-t-transparent" />
                      <span className="font-mono text-xs uppercase">Loading Directory...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center font-mono text-[#71717a] uppercase">
                    No customers found matching filter criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const isCurrentAdmin = c._id === currentAdmin?._id;

                  return (
                    <tr key={c._id} className="transition-colors hover:bg-[#141414]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#262626] bg-[#181818] font-mono text-xs font-bold text-[#e8ff00]">
                            {c.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#f5f5f5]">{c.name}</p>
                            {isCurrentAdmin && (
                              <span className="font-mono text-[9px] text-[#e8ff00] uppercase">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[#a0a0a0]">{c.email}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                            c.role === 'admin'
                              ? 'bg-[#e8ff00]/15 text-[#e8ff00]'
                              : 'bg-[#1f1f1f] text-[#a0a0a0]'
                          }`}
                        >
                          {c.role === 'admin' && <ShieldCheck size={12} />}
                          <span>{c.role}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {c.isBlocked ? (
                          <span className="inline-flex items-center gap-1 rounded bg-[#ff3b3b]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#ff3b3b] uppercase">
                            <Prohibit size={12} />
                            <span>Suspended</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-[#22c55e]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#22c55e] uppercase">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono text-[#a0a0a0]">{c.orderCount}</td>

                      <td className="px-4 py-3 font-mono font-bold text-[#f5f5f5]">
                        ₹{c.totalSpent.toFixed(2)}
                      </td>

                      <td className="px-4 py-3 font-mono text-[#71717a]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenProfile(c._id)}
                            className="rounded p-1.5 text-[#a0a0a0] transition-colors hover:bg-[#1f1f1f] hover:text-[#f5f5f5]"
                            title="Inspect History"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Role Toggle Button */}
                          {!isCurrentAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                setRoleChangeTarget({
                                  customer: c,
                                  newRole: c.role === 'admin' ? 'customer' : 'admin',
                                })
                              }
                              className={`rounded p-1.5 transition-colors ${
                                c.role === 'admin'
                                  ? 'text-[#a0a0a0] hover:bg-[#ff3b3b]/10 hover:text-[#ff3b3b]'
                                  : 'text-[#a0a0a0] hover:bg-[#e8ff00]/10 hover:text-[#e8ff00]'
                              }`}
                              title={c.role === 'admin' ? 'Demote to Customer' : 'Promote to Admin'}
                            >
                              <ShieldCheck size={16} />
                            </button>
                          )}

                          {/* Block Toggle Button */}
                          {!isCurrentAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                setBlockTarget({
                                  customer: c,
                                  block: !c.isBlocked,
                                })
                              }
                              className={`rounded p-1.5 transition-colors ${
                                c.isBlocked
                                  ? 'text-[#22c55e] hover:bg-[#22c55e]/10'
                                  : 'text-[#a0a0a0] hover:bg-[#ff3b3b]/10 hover:text-[#ff3b3b]'
                              }`}
                              title={c.isBlocked ? 'Unblock Account' : 'Suspend Account'}
                            >
                              <Prohibit size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-[#1f1f1f] px-4 py-3 font-mono text-xs text-[#a0a0a0]">
          <span>
            Page {page} of {totalPages} ({total} users)
          </span>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-1 text-[#f5f5f5] uppercase active:scale-[0.97] disabled:opacity-30"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-1 text-[#f5f5f5] uppercase active:scale-[0.97] disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Customer Profile & Purchase History Modal */}
      {selectedCustomerId && customerDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="my-8 w-full max-w-3xl rounded border border-[#1f1f1f] bg-[#111111] p-6 text-[#f5f5f5] shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-[#1f1f1f] pb-4">
              <div>
                <h3 className="font-mono text-sm font-bold tracking-wider text-[#e8ff00] uppercase">
                  Customer Profile: {customerDetail.user.name}
                </h3>
                <p className="font-mono text-[10px] text-[#71717a]">
                  Member since {new Date(customerDetail.user.createdAt).toLocaleDateString()} •{' '}
                  {customerDetail.orderCount} total orders
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                }}
                className="p-1 text-[#71717a] hover:text-[#f5f5f5]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Account Overview Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded border border-[#1f1f1f] bg-[#0a0a0a] p-3">
                  <span className="block font-mono text-[10px] text-[#71717a] uppercase">
                    Account Status
                  </span>
                  <span
                    className={`mt-1 inline-block font-mono text-xs font-bold uppercase ${
                      customerDetail.user.isBlocked ? 'text-[#ff3b3b]' : 'text-[#22c55e]'
                    }`}
                  >
                    {customerDetail.user.isBlocked ? 'Suspended' : 'Active Account'}
                  </span>
                </div>

                <div className="rounded border border-[#1f1f1f] bg-[#0a0a0a] p-3">
                  <span className="block font-mono text-[10px] text-[#71717a] uppercase">
                    Assigned Role
                  </span>
                  <span className="mt-1 inline-block font-mono text-xs font-bold text-[#e8ff00] uppercase">
                    {customerDetail.user.role}
                  </span>
                </div>

                <div className="rounded border border-[#1f1f1f] bg-[#0a0a0a] p-3">
                  <span className="block font-mono text-[10px] text-[#71717a] uppercase">
                    Lifetime Spend
                  </span>
                  <span className="mt-1 inline-block font-mono text-xs font-bold text-[#f5f5f5]">
                    ₹{customerDetail.totalSpent.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Purchase History Table */}
              <div>
                <h4 className="mb-2 font-mono text-xs tracking-wider text-[#a0a0a0] uppercase">
                  Order & Transaction History ({customerDetail.orders.length})
                </h4>

                <div className="overflow-hidden rounded border border-[#1f1f1f]">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="border-b border-[#1f1f1f] bg-[#181818] font-mono text-[10px] text-[#71717a] uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Order Ref</th>
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5">Items</th>
                        <th className="px-3 py-2.5">Amount</th>
                        <th className="px-3 py-2.5">Payment</th>
                        <th className="px-3 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f1f] bg-[#0a0a0a]">
                      {customerDetail.orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center font-mono text-[#71717a]">
                            No orders placed by this account yet.
                          </td>
                        </tr>
                      ) : (
                        customerDetail.orders.map((o) => (
                          <tr key={o._id}>
                            <td className="px-3 py-2.5 font-mono font-bold text-[#e8ff00]">
                              #{o._id.slice(-6).toUpperCase()}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[#a0a0a0]">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[#a0a0a0]">
                              {o.items?.length || 0} products
                            </td>
                            <td className="px-3 py-2.5 font-mono font-bold text-[#f5f5f5]">
                              ₹{o.total.toFixed(2)}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[11px] uppercase">
                              <span
                                className={
                                  o.paymentStatus === 'captured'
                                    ? 'text-[#22c55e]'
                                    : o.paymentStatus === 'refunded'
                                      ? 'text-[#ff3b3b]'
                                      : 'text-[#f59e0b]'
                                }
                              >
                                {o.paymentStatus}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[10px] text-[#f5f5f5] uppercase">
                              {o.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(roleChangeTarget)}
        title={`Change Role: ${roleChangeTarget?.newRole.toUpperCase()}`}
        description={`Are you sure you want to change permissions for "${roleChangeTarget?.customer.name}" (${roleChangeTarget?.customer.email}) from ${roleChangeTarget?.customer.role} to ${roleChangeTarget?.newRole}?`}
        confirmText="Confirm Role Update"
        isDestructive={roleChangeTarget?.newRole === 'customer'}
        isLoading={isUpdatingRole}
        onConfirm={handleConfirmRoleChange}
        onCancel={() => setRoleChangeTarget(null)}
      />

      {/* Account Block Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(blockTarget)}
        title={blockTarget?.block ? 'Suspend Customer Account' : 'Restore Customer Account'}
        description={`Are you sure you want to ${
          blockTarget?.block
            ? 'suspend this account? The user will immediately be blocked from logging in, refreshing sessions, or checking out.'
            : 'restore account access for this customer?'
        }`}
        confirmText={blockTarget?.block ? 'Suspend Account' : 'Restore Access'}
        isDestructive={Boolean(blockTarget?.block)}
        isLoading={isUpdatingBlock}
        onConfirm={handleConfirmBlockChange}
        onCancel={() => setBlockTarget(null)}
      />
    </div>
  );
}
