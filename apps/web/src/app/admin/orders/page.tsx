/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MagnifyingGlass,
  Printer,
  ArrowClockwise,
  Eye,
  CheckCircle,
  Warning,
  X,
  CreditCard,
  Truck,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog';
import type { Order, OrderStatus } from '@vertex/types';

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusParam || 'all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    const s = searchParams.get('status');
    setStatusFilter(s || 'all');
  }, [searchParams]);

  // Selected order for detail view
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('processing');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Refund dialog state
  const [refundOrderTarget, setRefundOrderTarget] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('Customer return requested');
  const [isRefunding, setIsRefunding] = useState(false);

  // Printable invoice modal state
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams: Record<string, string | number | boolean> = {
        page,
        limit: 15,
      };
      if (search.trim()) queryParams.search = search.trim();
      if (statusFilter !== 'all') queryParams.status = statusFilter;
      if (startDate) {
        const datePart = startDate.includes('T') ? startDate.split('T')[0] : startDate;
        const [y, m, d] = datePart.split('-').map(Number);
        const startLocal = new Date(y, m - 1, d, 0, 0, 0, 0);
        queryParams.startDate = startLocal.toISOString();
      }
      if (endDate) {
        const datePart = endDate.includes('T') ? endDate.split('T')[0] : endDate;
        const [y, m, d] = datePart.split('-').map(Number);
        const endLocal = new Date(y, m - 1, d, 23, 59, 59, 999);
        queryParams.endDate = endLocal.toISOString();
      }

      const res = await api.get<{
        data: Order[];
        total: number;
        totalPages: number;
      }>('/admin/orders', { params: queryParams });

      setOrders(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch customer orders';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdatingStatus) return;
    if (!selectedOrder) return;

    setIsUpdatingStatus(true);
    try {
      const res = await api.patch<{ data: Order }>(`/admin/orders/${selectedOrder._id}/status`, {
        status: newStatus,
        trackingNumber: trackingNumber.trim() || undefined,
      });

      setSelectedOrder(res.data);
      setFeedback({
        type: 'success',
        message: `Order #${selectedOrder._id.slice(-6)} status updated to "${newStatus}".`,
      });
      fetchOrders();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update order status';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExecuteRefund = async () => {
    if (isRefunding) return;
    if (!refundOrderTarget) return;

    setIsRefunding(true);
    try {
      await api.post(`/admin/orders/${refundOrderTarget._id}/refund`, {
        reason: refundReason.trim(),
      });
      setFeedback({
        type: 'success',
        message: `Order #${refundOrderTarget._id.slice(-6)} refunded successfully and inventory restored.`,
      });
      setRefundOrderTarget(null);
      if (selectedOrder?._id === refundOrderTarget._id) {
        setSelectedOrder(null);
      }
      fetchOrders();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Refund processing failed';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsRefunding(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config: Record<string, { bg: string; text: string; border: string }> = {
      delivered: {
        bg: 'bg-[#22c55e]/10',
        text: 'text-[#15803d] dark:text-[#22c55e]',
        border: 'border-[#22c55e]/30',
      },
      shipped: {
        bg: 'bg-[#38bdf8]/10',
        text: 'text-[#0284c7] dark:text-[#38bdf8]',
        border: 'border-[#38bdf8]/30',
      },
      processing: {
        bg: 'bg-[var(--text-primary)]/10 dark:bg-[#e8ff00]/10',
        text: 'text-[var(--text-primary)] dark:text-[#e8ff00]',
        border: 'border-[var(--text-primary)]/30 dark:border-[#e8ff00]/40',
      },
      confirmed: {
        bg: 'bg-[#f59e0b]/10',
        text: 'text-[#b45309] dark:text-[#f59e0b]',
        border: 'border-[#f59e0b]/30',
      },
      pending: {
        bg: 'bg-[var(--bg-elevated)]',
        text: 'text-[var(--text-muted)]',
        border: 'border-[var(--border)]',
      },
      cancelled: {
        bg: 'bg-[#b91c1c]/10 dark:bg-[#ff3b3b]/10',
        text: 'text-[#b91c1c] dark:text-[#ff3b3b]',
        border: 'border-[#b91c1c]/30 dark:border-[#ff3b3b]/30',
      },
    };
    const c = config[status.toLowerCase()] || config.pending;
    return (
      <span
        className={`inline-flex items-center rounded-none border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase ${c.bg} ${c.text} ${c.border}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-mono text-xl font-bold tracking-wider text-[var(--text-primary)] uppercase">
            Order Fulfillment & Invoicing
          </h2>
          <p className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">
            Track customer shipments, process status updates, print invoices and issue Razorpay
            refunds ({total} total orders)
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="btn-tactile inline-flex items-center gap-2 rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97]"
        >
          <ArrowClockwise size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Notifications */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-none border p-3 font-mono text-xs ${
            feedback.type === 'success'
              ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#15803d] dark:text-[#22c55e]'
              : 'border-[#b91c1c]/30 bg-[#b91c1c]/10 text-[#b91c1c] dark:border-[#ff3b3b]/30 dark:bg-[#ff3b3b]/10 dark:text-[#ff3b3b]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle size={16} /> : <Warning size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-70"
            aria-label="Dismiss feedback"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 gap-3 rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute top-3 left-3 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search order ID, user, phone..."
            className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pr-3 pl-9 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Start Date */}
        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
            title="Start Date"
          />
        </div>

        {/* End Date */}
        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
            title="End Date"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-none border border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)] font-mono tracking-wider text-[var(--text-muted)] uppercase">
              <tr>
                <th className="px-4 py-3">Order Ref</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Fulfillment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--text-primary)] border-t-transparent dark:border-[#e8ff00]" />
                      <span className="font-mono text-xs uppercase">Loading Orders Queue...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center font-mono text-[var(--text-muted)] uppercase"
                  >
                    No orders found matching active criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const itemCount = (o.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
                  const shortId = o._id.slice(-6).toUpperCase();
                  const userRef =
                    typeof o.userId === 'object' && o.userId !== null ? o.userId : null;
                  const customerName =
                    o.shippingAddress?.fullName || userRef?.name || 'Guest Checkout';

                  return (
                    <tr key={o._id} className="transition-colors hover:bg-[var(--bg-elevated)]">
                      <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)] dark:text-[#e8ff00]">
                        #{shortId}
                      </td>

                      <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3">
                        <p className="max-w-[140px] truncate font-medium text-[var(--text-primary)]">
                          {customerName}
                        </p>
                        <p className="max-w-[140px] truncate font-mono text-[10px] text-[var(--text-muted)]">
                          {o.shippingAddress?.city}, {o.shippingAddress?.country}
                        </p>
                      </td>

                      <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">
                        {itemCount} units ({o.items?.length || 0} SKUs)
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)]">
                        ₹{o.total.toFixed(2)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block font-mono text-[10px] font-bold uppercase ${
                            o.paymentStatus === 'captured'
                              ? 'text-[#15803d] dark:text-[#22c55e]'
                              : o.paymentStatus === 'refunded'
                                ? 'text-[#b91c1c] dark:text-[#ff3b3b]'
                                : 'text-[#b45309] dark:text-[#f59e0b]'
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3">{getStatusBadge(o.status)}</td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(o)}
                            className="btn-tactile inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-none p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                            title="Inspect order"
                            aria-label="Inspect order"
                            data-testid="inspect-order-btn"
                            data-order-id={o._id}
                          >
                            <Eye size={16} />
                            <span className="sr-only">Inspect order #{shortId}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInvoiceOrder(o)}
                            className="btn-tactile inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-none p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] active:scale-[0.97] dark:hover:text-[#e8ff00]"
                            title="Print Invoice"
                            aria-label={`Print invoice for order #${shortId}`}
                            data-testid="print-invoice-btn"
                          >
                            <Printer size={16} />
                            <span className="sr-only">Print invoice</span>
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

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
          <span>
            Page {page} of {totalPages} ({total} orders)
          </span>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-tactile rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97] disabled:opacity-30"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn-tactile rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97] disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail & Fulfillment Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm dark:bg-black/80"
          role="dialog"
          aria-modal="true"
        >
          <div className="my-8 w-full max-w-3xl rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase dark:text-[#e8ff00]">
                    Order #{selectedOrder._id.slice(-6).toUpperCase()}
                  </h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="btn-tactile inline-flex items-center gap-1.5 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97]"
                >
                  <Printer size={14} />
                  <span>Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="btn-tactile p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                  aria-label="Close details"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Customer & Shipping Summary */}
              <div className="grid grid-cols-1 gap-4 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-4 font-mono text-xs sm:grid-cols-2">
                <div>
                  <span className="mb-1 block text-[10px] text-[var(--text-muted)] uppercase">
                    Shipping Destination
                  </span>
                  <p className="font-bold text-[var(--text-primary)]">
                    {selectedOrder.shippingAddress?.fullName}
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    {selectedOrder.shippingAddress?.line1 || selectedOrder.shippingAddress?.street}
                  </p>
                  {selectedOrder.shippingAddress?.line2 && (
                    <p className="text-[var(--text-secondary)]">
                      {selectedOrder.shippingAddress.line2}
                    </p>
                  )}
                  <p className="text-[var(--text-secondary)]">
                    {selectedOrder.shippingAddress?.city},{' '}
                    {selectedOrder.shippingAddress?.postalCode}
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    {selectedOrder.shippingAddress?.country}
                  </p>
                  <p className="mt-1 text-[var(--text-muted)]">
                    Tel: {selectedOrder.shippingAddress?.phone}
                  </p>
                </div>

                <div>
                  <span className="mb-1 block text-[10px] text-[var(--text-muted)] uppercase">
                    Payment Gateway Details
                  </span>
                  <p className="text-[var(--text-secondary)]">
                    Method: <span className="text-[var(--text-primary)]">Razorpay Authorized</span>
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    Payment ID:{' '}
                    <span className="text-[var(--text-primary)] dark:text-[#e8ff00]">
                      {selectedOrder.razorpayPaymentId || '—'}
                    </span>
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    Order ID:{' '}
                    <span className="text-[var(--text-primary)]">
                      {selectedOrder.razorpayOrderId || '—'}
                    </span>
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    Status:{' '}
                    <span className="font-bold text-[var(--text-primary)]">
                      {selectedOrder.paymentStatus}
                    </span>
                  </p>

                  {selectedOrder.refundId && (
                    <div className="mt-2 rounded-none border border-[#b91c1c]/30 bg-[#b91c1c]/10 p-2 text-[11px] text-[#b91c1c] dark:border-[#ff3b3b]/30 dark:bg-[#ff3b3b]/10 dark:text-[#ff3b3b]">
                      Refund ID: {selectedOrder.refundId}
                      {selectedOrder.refundReason && <p>Reason: {selectedOrder.refundReason}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="mb-2 font-mono text-xs tracking-wider text-[var(--text-muted)] uppercase">
                  Line Items
                </h4>
                <div className="overflow-hidden rounded-none border border-[var(--border)]">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="border-b border-[var(--border)] bg-[var(--bg-surface)] font-mono text-[10px] text-[var(--text-muted)] uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Item</th>
                        <th className="px-3 py-2.5">SKU</th>
                        <th className="px-3 py-2.5">Variant</th>
                        <th className="px-3 py-2.5 text-right">Price</th>
                        <th className="px-3 py-2.5 text-right">Qty</th>
                        <th className="px-3 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-elevated)]">
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-9 w-8 rounded-none border border-[var(--border)] object-cover"
                                />
                              )}
                              <span className="font-medium text-[var(--text-primary)]">
                                {item.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[var(--text-secondary)]">
                            {item.sku}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[var(--text-secondary)]">
                            {item.color} / {item.size}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-[var(--text-secondary)]">
                            ₹{item.price}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-[var(--text-primary)]">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-[var(--text-primary)]">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="mt-3 flex justify-end font-mono text-xs">
                  <div className="w-64 space-y-1.5 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Subtotal:</span>
                      <span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Shipping:</span>
                      <span>₹{selectedOrder.shipping?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Tax:</span>
                      <span>₹{selectedOrder.tax?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--border)] pt-1.5 text-sm font-bold text-[var(--text-primary)] dark:text-[#e8ff00]">
                      <span>Total Paid:</span>
                      <span>₹{selectedOrder.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update & Actions */}
              <div className="space-y-4 rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                <h4 className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase dark:text-[#e8ff00]">
                  Fulfillment Status & Logistics
                </h4>

                <form
                  onSubmit={handleUpdateStatus}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                >
                  <div>
                    <label className="mb-1 block font-mono text-[10px] text-[var(--text-secondary)] uppercase">
                      Order Status
                    </label>
                    {(() => {
                      const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
                        pending: ['confirmed', 'cancelled'],
                        confirmed: ['processing', 'cancelled'],
                        processing: ['shipped', 'cancelled'],
                        shipped: ['delivered', 'cancelled'],
                        delivered: [],
                        cancelled: [],
                      };
                      const nextTransitions = ALLOWED_TRANSITIONS[selectedOrder.status] || [];
                      const isTerminal = nextTransitions.length === 0;

                      return (
                        <select
                          value={newStatus}
                          disabled={isTerminal}
                          onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                          className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none disabled:opacity-50 dark:focus:border-[#e8ff00]"
                        >
                          <option value={selectedOrder.status}>
                            {selectedOrder.status.toUpperCase()}{' '}
                            {isTerminal ? '(TERMINAL)' : '(CURRENT)'}
                          </option>
                          {nextTransitions.map((st) => (
                            <option key={st} value={st}>
                              Advance to {st.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] text-[var(--text-secondary)] uppercase">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. FEDEX-98124018"
                      className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={
                        isUpdatingStatus ||
                        selectedOrder.status === 'delivered' ||
                        selectedOrder.status === 'cancelled'
                      }
                      className="btn-tactile w-full rounded-none border border-[var(--text-primary)] bg-[var(--text-primary)] py-2 font-mono text-xs font-bold text-[var(--bg)] uppercase transition-colors hover:opacity-90 active:scale-[0.97] disabled:opacity-50 dark:border-[#e8ff00] dark:bg-[#e8ff00] dark:text-[#0a0a0a]"
                    >
                      {isUpdatingStatus ? 'Updating...' : 'Save Fulfillment'}
                    </button>
                  </div>
                </form>

                {/* Refund Action */}
                {selectedOrder.paymentStatus !== 'refunded' && (
                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                    <div>
                      <p className="font-mono text-xs text-[var(--text-secondary)]">
                        Need to issue a full payment refund?
                      </p>
                      <p className="font-sans text-[11px] text-[var(--text-muted)]">
                        Calls Razorpay Refund API and restores reserved item stock automatically.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRefundOrderTarget(selectedOrder)}
                      className="btn-tactile rounded-none border border-[#ff3b3b]/40 bg-[#ff3b3b]/10 px-3.5 py-1.5 font-mono text-xs font-bold text-[#ff3b3b] uppercase transition-colors hover:bg-[#ff3b3b] hover:text-white active:scale-[0.97]"
                    >
                      Issue Refund
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {invoiceOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm dark:bg-black/85"
          role="dialog"
          aria-modal="true"
        >
          <div className="my-8 w-full max-w-2xl rounded-none border border-[var(--border)] bg-white p-8 text-[#0a0a0a] shadow-2xl print:m-0 print:border-none print:p-0">
            <div className="mb-6 flex items-center justify-between border-b border-[#e4e4e7] pb-4 print:hidden">
              <span className="font-mono text-xs font-bold tracking-wider text-[#0a0a0a] uppercase">
                Print Preview: Invoice #{invoiceOrder._id.slice(-6).toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="btn-tactile inline-flex items-center gap-1.5 rounded-none bg-[#0a0a0a] px-3.5 py-1.5 font-mono text-xs tracking-wider text-[#ffffff] uppercase transition-colors hover:bg-[#333333] active:scale-[0.97]"
                >
                  <Printer size={15} />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(null)}
                  className="btn-tactile p-1 text-[#71717a] hover:text-[#0a0a0a] active:scale-[0.97]"
                  aria-label="Close invoice preview"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div id="printable-invoice" ref={invoiceRef} className="space-y-6 font-sans text-xs">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-invoice, #printable-invoice * {
                    visibility: visible !important;
                  }
                  #printable-invoice {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                    padding: 24px !important;
                  }
                }
              `}</style>
              <div className="flex items-start justify-between border-b border-[#e4e4e7] pb-6">
                <div>
                  <h1 className="font-mono text-2xl font-bold tracking-widest text-[#0a0a0a]">
                    XYDV
                  </h1>
                  <p className="font-mono text-[10px] text-[#71717a] uppercase">
                    High Performance Technical Apparel
                  </p>
                  <p className="mt-2 text-[#52525b]">support@xydv.com</p>
                </div>
                <div className="text-right font-mono">
                  <h2 className="text-lg font-bold text-[#0a0a0a]">COMMERCIAL INVOICE</h2>
                  <p className="text-[#71717a]">INV-{invoiceOrder._id.slice(-8).toUpperCase()}</p>
                  <p className="text-[#71717a]">
                    Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="mb-1 font-mono text-[10px] font-bold text-[#71717a] uppercase">
                    Billed & Shipped To:
                  </h3>
                  <p className="font-bold text-[#0a0a0a]">
                    {invoiceOrder.shippingAddress?.fullName}
                  </p>
                  <p className="text-[#52525b]">
                    {invoiceOrder.shippingAddress?.line1 || invoiceOrder.shippingAddress?.street}
                  </p>
                  {invoiceOrder.shippingAddress?.line2 && (
                    <p className="text-[#52525b]">{invoiceOrder.shippingAddress.line2}</p>
                  )}
                  <p className="text-[#52525b]">
                    {invoiceOrder.shippingAddress?.city}, {invoiceOrder.shippingAddress?.postalCode}
                  </p>
                  <p className="text-[#52525b]">{invoiceOrder.shippingAddress?.country}</p>
                  <p className="mt-1 text-[#71717a]">Tel: {invoiceOrder.shippingAddress?.phone}</p>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <h3 className="mb-1 text-[10px] font-bold text-[#71717a] uppercase">
                    Payment Status:
                  </h3>
                  <p className="font-bold text-[#15803d] uppercase">{invoiceOrder.paymentStatus}</p>
                  <p className="text-[#71717a]">
                    Transaction Ref: {invoiceOrder.razorpayPaymentId || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Line items table */}
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-[#0a0a0a] font-mono text-[10px] uppercase">
                    <th className="py-2">Description</th>
                    <th className="py-2">SKU</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e4e7]">
                  {invoiceOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium">
                        {item.name} ({item.color} - {item.size})
                      </td>
                      <td className="py-2 font-mono text-[#71717a]">{item.sku}</td>
                      <td className="py-2 text-right font-mono">₹{item.price.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono">{item.quantity}</td>
                      <td className="py-2 text-right font-mono font-bold">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end border-t border-[#e4e4e7] pt-4 font-mono text-xs">
                <div className="w-48 space-y-1.5">
                  <div className="flex justify-between text-[#71717a]">
                    <span>Subtotal:</span>
                    <span>₹{invoiceOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#71717a]">
                    <span>Shipping:</span>
                    <span>₹{invoiceOrder.shipping?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#71717a]">
                    <span>Taxes:</span>
                    <span>₹{invoiceOrder.tax?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-[#0a0a0a] pt-1.5 text-sm font-bold text-[#0a0a0a]">
                    <span>Total:</span>
                    <span>₹{invoiceOrder.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="border-t border-[#e4e4e7] pt-8 text-center font-mono text-[9px] text-[#71717a] uppercase">
                Thank you for your order • Official XYDV High-Performance Guarantee
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(refundOrderTarget)}
        title="Execute Payment Refund"
        description={`Are you sure you want to refund ₹${refundOrderTarget?.total.toFixed(2)} for Order #${refundOrderTarget?._id.slice(-6).toUpperCase()}? This will issue a payment refund through Razorpay and automatically restore product stock.`}
        confirmText="Confirm Refund"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isRefunding}
        onConfirm={handleExecuteRefund}
        onCancel={() => setRefundOrderTarget(null)}
      />
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 font-mono text-xs text-[var(--text-muted)]">Loading orders...</div>
      }
    >
      <AdminOrdersContent />
    </Suspense>
  );
}
