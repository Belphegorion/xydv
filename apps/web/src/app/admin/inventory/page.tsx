'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MagnifyingGlass,
  Warning,
  CheckCircle,
  X,
  PencilSimple,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

interface InventoryItem {
  productId: string;
  productName: string;
  productSlug: string;
  category: string;
  sku: string;
  color: string;
  colorHex: string;
  size: string;
  price: number;
  stock: number;
  reservedStock: number;
  isLowStock: boolean;
}

function AdminInventoryContent() {
  const searchParams = useSearchParams();
  const lowStockParam = searchParams.get('lowStock') === 'true';
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [lowStockOnly, setLowStockOnly] = useState(lowStockParam);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalLowStock, setTotalLowStock] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    const isLow = searchParams.get('lowStock') === 'true';
    setLowStockOnly(isLow);
    const p = parseInt(searchParams.get('page') || '', 10);
    if (!isNaN(p) && p > 0) {
      setPage(p);
    }
  }, [searchParams]);

  // Edit stock inline modal state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{
        data: InventoryItem[];
        totalItems: number;
        totalLowStock: number;
        threshold: number;
        totalPages?: number;
      }>('/admin/inventory', {
        params: {
          threshold,
          lowStock: lowStockOnly ? 'true' : 'false',
          search: search.trim() || undefined,
          page,
          limit: 20,
        },
      });

      setItems(res.data);
      setTotalItems(res.totalItems);
      setTotalLowStock(res.totalLowStock);
      const calculatedPages = res.totalPages || Math.ceil(res.totalItems / 20) || 1;
      setTotalPages(calculatedPages);
      if (page > calculatedPages && calculatedPages > 0) {
        setPage(calculatedPages);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [threshold, lowStockOnly, search, page]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleOpenEditStock = (item: InventoryItem) => {
    setEditingItem(item);
    setNewStock(item.stock);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdatingStock) return;
    if (!editingItem) return;

    setIsUpdatingStock(true);
    try {
      await api.patch(`/admin/inventory/${editingItem.productId}/variants/${editingItem.sku}`, {
        stock: Number(newStock),
      });

      setFeedback({
        type: 'success',
        message: `Inventory stock for SKU ${editingItem.sku} updated to ${newStock} units.`,
      });
      setEditingItem(null);
      fetchInventory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update stock';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsUpdatingStock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-mono text-xl font-bold tracking-wider text-[var(--text-primary)] uppercase">
            Inventory & Stock Control
          </h2>
          <p className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">
            Monitor SKU levels, configure low-stock safety limits, and audit real-time stock holds
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInventory}
          className="btn-tactile inline-flex items-center gap-2 rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97]"
        >
          <ArrowClockwise size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Sync Matrix</span>
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

      {/* Low-stock Warning Header Banner */}
      {totalLowStock > 0 && (
        <div className="flex items-center justify-between rounded-none border border-[#b91c1c]/30 bg-[#b91c1c]/10 p-4 text-[#b91c1c] dark:border-[#ff3b3b]/30 dark:bg-[#ff3b3b]/10 dark:text-[#ff3b3b]">
          <div className="flex items-center gap-3">
            <Warning size={22} weight="bold" />
            <div>
              <p className="font-mono text-xs font-bold tracking-wider uppercase">
                Low-Stock SKU Alerts Active
              </p>
              <p className="mt-0.5 font-sans text-xs text-[#b91c1c]/90 dark:text-[#ff3b3b]/80">
                {totalLowStock} SKU variants currently have &le; {threshold} units remaining in
                inventory.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setLowStockOnly(!lowStockOnly);
              setPage(1);
            }}
            className="btn-tactile rounded-none border border-[#b91c1c]/40 bg-[#b91c1c]/20 px-3 py-1.5 font-mono text-xs font-bold tracking-wider text-[#b91c1c] uppercase transition-colors hover:bg-[#b91c1c] hover:text-white active:scale-[0.97] dark:border-[#ff3b3b]/40 dark:bg-[#ff3b3b]/20 dark:text-white dark:hover:bg-[#ff3b3b]"
          >
            {lowStockOnly ? 'Show All SKUs' : 'Filter Low-Stock'}
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-3.5 sm:grid-cols-3">
        {/* Search */}
        <div className="relative sm:col-span-2">
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
            placeholder="Search product name, SKU code, or colorway..."
            className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pr-3 pl-9 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
          />
        </div>

        {/* Configurable Threshold */}
        <div className="flex items-center gap-2">
          <label className="flex-shrink-0 font-mono text-xs text-[var(--text-secondary)] uppercase">
            Alert Threshold:
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={threshold}
            onChange={(e) => {
              setThreshold(Math.max(1, Number(e.target.value)));
              setPage(1);
            }}
            className="w-20 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-center font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:text-[#e8ff00] dark:focus:border-[#e8ff00]"
          />
          <span className="font-mono text-[10px] text-[var(--text-muted)]">units</span>
        </div>
      </div>

      {/* Inventory Matrix Table */}
      <div className="overflow-hidden rounded-none border border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)] font-mono tracking-wider text-[var(--text-muted)] uppercase">
              <tr>
                <th className="px-4 py-3">SKU Identifier</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Colorway & Swatch</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Available Stock</th>
                <th className="px-4 py-3">Reserved Hold</th>
                <th className="px-4 py-3 text-right">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--text-primary)] border-t-transparent dark:border-[#e8ff00]" />
                      <span className="font-mono text-xs uppercase">Auditing Stock Matrix...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center font-mono text-[var(--text-muted)] uppercase"
                  >
                    No variant inventory matching criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.sku}
                    className={`transition-colors hover:bg-[var(--bg-elevated)] ${
                      item.isLowStock ? 'bg-[#ff3b3b]/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)] dark:text-[#e8ff00]">
                      {item.sku}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-bold text-[var(--text-primary)]">
                        {item.productName}
                      </p>
                      <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase">
                        {item.category}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-[var(--border)]"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span className="font-mono text-[var(--text-secondary)]">{item.color}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)]">
                      {item.size}
                    </td>

                    <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">
                      ₹{item.price}
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            item.stock === 0
                              ? 'text-[#b91c1c] dark:text-[#ff3b3b]'
                              : item.isLowStock
                                ? 'text-[#b91c1c] dark:text-[#ff3b3b]'
                                : 'text-[#15803d] dark:text-[#22c55e]'
                          }`}
                        >
                          {item.stock} units
                        </span>
                        {item.isLowStock && (
                          <span className="rounded-none border border-[#b91c1c]/30 bg-[#b91c1c]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#b91c1c] uppercase dark:border-[#ff3b3b]/30 dark:bg-[#ff3b3b]/20 dark:text-[#ff3b3b]">
                            LOW
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-[var(--text-muted)]">
                      {item.reservedStock} holds
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEditStock(item)}
                        className="btn-tactile inline-flex min-h-[36px] items-center gap-1.5 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97]"
                        aria-label={`Adjust stock for SKU ${item.sku}`}
                      >
                        <PencilSimple size={13} />
                        <span>Set Stock</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info & Pagination Controls */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 font-mono text-xs text-[var(--text-muted)] sm:flex-row">
          <span>
            {items.length} SKUs displayed ({totalLowStock} low-stock alerts) &bull; Page {page} of{' '}
            {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-tactile rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-1 font-mono text-xs text-[var(--text-primary)] dark:text-[#e8ff00]">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn-tactile rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase">
            Threshold: &le; {threshold} units
          </span>
        </div>
      </div>

      {/* Edit Stock Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm dark:bg-black/80"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase dark:text-[#e8ff00]">
                  Adjust SKU Stock
                </h3>
                <p className="font-mono text-[10px] text-[var(--text-muted)]">{editingItem.sku}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="btn-tactile p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-4">
              <div>
                <p className="mb-2 font-mono text-xs text-[var(--text-secondary)]">
                  Product:{' '}
                  <span className="font-bold text-[var(--text-primary)]">
                    {editingItem.productName}
                  </span>
                </p>
                <p className="mb-4 font-mono text-xs text-[var(--text-secondary)]">
                  Variant:{' '}
                  <span className="text-[var(--text-primary)]">
                    {editingItem.color} / {editingItem.size}
                  </span>
                </p>

                <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                  Available Warehouse Stock (Units)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-3 font-mono text-sm font-bold text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:text-[#e8ff00] dark:focus:border-[#e8ff00]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn-tactile rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-xs tracking-wider text-[var(--text-muted)] uppercase transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStock}
                  className="btn-tactile rounded-none border border-[var(--text-primary)] bg-[var(--text-primary)] px-5 py-2 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase transition-colors hover:opacity-90 active:scale-[0.97] disabled:opacity-50 dark:border-[#e8ff00] dark:bg-[#e8ff00] dark:text-[#0a0a0a]"
                >
                  {isUpdatingStock ? 'Saving...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 font-mono text-xs text-[var(--text-muted)]">
          Loading inventory matrix...
        </div>
      }
    >
      <AdminInventoryContent />
    </Suspense>
  );
}
