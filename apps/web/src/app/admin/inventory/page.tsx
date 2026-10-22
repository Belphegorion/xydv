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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch inventory' });
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
      await api.patch(
        `/admin/inventory/${editingItem.productId}/variants/${editingItem.sku}`,
        {
          stock: Number(newStock),
        },
      );

      setFeedback({
        type: 'success',
        message: `Inventory stock for SKU ${editingItem.sku} updated to ${newStock} units.`,
      });
      setEditingItem(null);
      fetchInventory();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update stock' });
    } finally {
      setIsUpdatingStock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-mono text-xl font-bold uppercase tracking-wider text-[#f5f5f5]">
            Inventory & Stock Control
          </h2>
          <p className="font-mono text-xs text-[#71717a] mt-0.5">
            Monitor SKU levels, configure low-stock safety limits, and audit real-time stock holds
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInventory}
          className="inline-flex items-center gap-2 rounded border border-[#1f1f1f] bg-[#111111] px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-[#a0a0a0] hover:text-[#f5f5f5] hover:border-[#333333] transition-colors active:scale-[0.97]"
        >
          <ArrowClockwise size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Sync Matrix</span>
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

      {/* Low-stock Warning Header Banner */}
      {totalLowStock > 0 && (
        <div className="flex items-center justify-between rounded border border-[#ff3b3b]/30 bg-[#ff3b3b]/10 p-4 text-[#ff3b3b]">
          <div className="flex items-center gap-3">
            <Warning size={22} weight="bold" />
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wider">
                Low-Stock SKU Alerts Active
              </p>
              <p className="font-sans text-xs text-[#ff3b3b]/80 mt-0.5">
                {totalLowStock} SKU variants currently have &le; {threshold} units remaining in inventory.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setLowStockOnly(!lowStockOnly);
              setPage(1);
            }}
            className="rounded border border-[#ff3b3b]/40 bg-[#ff3b3b]/20 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#ffffff] hover:bg-[#ff3b3b] transition-colors active:scale-[0.97]"
          >
            {lowStockOnly ? 'Show All SKUs' : 'Filter Low-Stock'}
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded border border-[#1f1f1f] bg-[#111111] p-3.5">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-3 text-[#71717a]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search product name, SKU code, or colorway..."
            className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] py-2 pl-9 pr-3 font-mono text-xs text-[#f5f5f5] placeholder-[#52525b] focus:border-[#e8ff00] focus:outline-none"
          />
        </div>

        {/* Configurable Threshold */}
        <div className="flex items-center gap-2">
          <label className="font-mono text-xs uppercase text-[#a0a0a0] flex-shrink-0">
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
            className="w-20 rounded border border-[#1f1f1f] bg-[#0a0a0a] py-1.5 px-2 font-mono text-xs text-[#e8ff00] text-center focus:border-[#e8ff00] focus:outline-none"
          />
          <span className="font-mono text-[10px] text-[#71717a]">units</span>
        </div>
      </div>

      {/* Inventory Matrix Table */}
      <div className="overflow-hidden rounded border border-[#1f1f1f] bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="border-b border-[#1f1f1f] bg-[#161616] font-mono uppercase tracking-wider text-[#a0a0a0]">
              <tr>
                <th className="py-3 px-4">SKU Identifier</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Colorway & Swatch</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Reserved Hold</th>
                <th className="py-3 px-4 text-right">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#71717a]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e8ff00] border-t-transparent" />
                      <span className="font-mono text-xs uppercase">Auditing Stock Matrix...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#71717a] font-mono uppercase">
                    No variant inventory matching criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.sku}
                    className={`hover:bg-[#141414] transition-colors ${
                      item.isLowStock ? 'bg-[#ff3b3b]/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#e8ff00]">
                      {item.sku}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-mono text-xs font-bold text-[#f5f5f5]">
                        {item.productName}
                      </p>
                      <p className="font-mono text-[10px] uppercase text-[#71717a]">
                        {item.category}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-[#333333]"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span className="font-mono text-[#a0a0a0]">{item.color}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-[#f5f5f5]">
                      {item.size}
                    </td>

                    <td className="py-3 px-4 font-mono text-[#a0a0a0]">
                      ₹{item.price}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            item.stock === 0
                              ? 'text-[#ff3b3b]'
                              : item.isLowStock
                              ? 'text-[#ff3b3b]'
                              : 'text-[#22c55e]'
                          }`}
                        >
                          {item.stock} units
                        </span>
                        {item.isLowStock && (
                          <span className="rounded bg-[#ff3b3b]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#ff3b3b] uppercase">
                            LOW
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[#71717a]">
                      {item.reservedStock} holds
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEditStock(item)}
                        className="inline-flex items-center gap-1 rounded border border-[#1f1f1f] bg-[#161616] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[#a0a0a0] hover:border-[#e8ff00] hover:text-[#e8ff00] transition-colors"
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
        <div className="border-t border-[#1f1f1f] px-4 py-3 font-mono text-xs text-[#a0a0a0] flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>
            {items.length} SKUs displayed ({totalLowStock} low-stock alerts) &bull; Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-[#1f1f1f] bg-[#161616] px-3 py-1 font-mono text-xs uppercase text-[#f5f5f5] hover:border-[#333333] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="font-mono text-xs text-[#e8ff00] px-1">{page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-[#1f1f1f] bg-[#161616] px-3 py-1 font-mono text-xs uppercase text-[#f5f5f5] hover:border-[#333333] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <span className="text-[10px] text-[#52525b] uppercase">
            Threshold: &le; {threshold} units
          </span>
        </div>
      </div>

      {/* Edit Stock Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded border border-[#1f1f1f] bg-[#111111] p-6 text-[#f5f5f5] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3 mb-4">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#e8ff00]">
                  Adjust SKU Stock
                </h3>
                <p className="font-mono text-[10px] text-[#71717a]">{editingItem.sku}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 text-[#71717a] hover:text-[#f5f5f5]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-4">
              <div>
                <p className="text-xs text-[#a0a0a0] mb-2 font-mono">
                  Product: <span className="text-[#f5f5f5] font-bold">{editingItem.productName}</span>
                </p>
                <p className="text-xs text-[#a0a0a0] mb-4 font-mono">
                  Variant: <span className="text-[#f5f5f5]">{editingItem.color} / {editingItem.size}</span>
                </p>

                <label className="block font-mono text-xs uppercase text-[#a0a0a0] mb-1.5">
                  Available Warehouse Stock (Units)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-3 font-mono text-sm text-[#e8ff00] font-bold focus:border-[#e8ff00] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f1f1f]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded border border-[#1f1f1f] bg-transparent px-4 py-2 font-mono text-xs uppercase text-[#a0a0a0] hover:text-[#f5f5f5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStock}
                  className="rounded border border-[#e8ff00] bg-[#e8ff00] px-5 py-2 font-mono text-xs font-bold uppercase text-[#0a0a0a] hover:bg-[#e8ff00]/90 disabled:opacity-50 active:scale-[0.97]"
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
    <Suspense fallback={<div className="p-8 font-mono text-xs text-[#71717a]">Loading inventory matrix...</div>}>
      <AdminInventoryContent />
    </Suspense>
  );
}
