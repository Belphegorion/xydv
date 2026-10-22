/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  Funnel,
  X,
  UploadSimple,
  CheckCircle,
  Warning,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog';
import type { Product, ProductVariant, CategoryItem } from '@vertex/types';

function AdminProductsContent() {
  const searchParams = useSearchParams();
  const actionParam = searchParams.get('action');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [inStockFilter, setInStockFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('XYDV');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number>(148);
  const [compareAt, setCompareAt] = useState<number | undefined>(undefined);
  const [tagsInput, setTagsInput] = useState('');
  const [images, setImages] = useState<Array<{ url: string; alt?: string; isPrimary?: boolean }>>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      sku: 'XYDV-001-BLK-M',
      color: 'Black',
      colorHex: '#000000',
      size: 'M',
      price: 148,
      stock: 20,
    },
  ]);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState<boolean>(false);

  const handleRequestCloseModal = () => {
    if (isDirty) {
      setShowUnsavedConfirm(true);
    } else {
      setIsModalOpen(false);
      setIsDirty(false);
    }
  };

  // Delete dialog state
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams: Record<string, string | number | boolean> = {
        page,
        limit: 15,
        sort,
      };
      if (search.trim()) queryParams.search = search.trim();
      if (categoryFilter !== 'all') queryParams.category = categoryFilter;
      if (inStockFilter !== '') queryParams.inStock = inStockFilter;

      const res = await api.get<{
        data: Product[];
        total: number;
        totalPages: number;
      }>('/admin/products', { params: queryParams });

      setProducts(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch catalog products';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryFilter, inStockFilter, sort]);

  // Fetch categories for dropdown
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get<{ data: CategoryItem[] }>('/admin/categories');
      setCategories(res.data);
      if (res.data.length > 0 && !category) {
        setCategory(res.data[0].slug);
      }
    } catch {
      // Ignore
    }
  }, [category]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const actionInitializedRef = React.useRef(false);

  useEffect(() => {
    if (actionParam === 'new' && !actionInitializedRef.current) {
      actionInitializedRef.current = true;
      setIsEditing(false);
      setCurrentProductId(null);
      setName('');
      setDescription('');
      if (categories.length > 0) setCategory(categories[0].slug);
      setPrice(148);
      setCompareAt(undefined);
      setTagsInput('');
      setImages([]);
      setVariants([
        {
          sku: 'XYDV-001-BLK-M',
          color: 'Black',
          colorHex: '#000000',
          size: 'M',
          price: 148,
          stock: 20,
        },
      ]);
      setIsModalOpen(true);
    }
  }, [actionParam, categories]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [feedback]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Handle image file upload with client-side validation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (isUploading) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setFeedback({
          type: 'error',
          message: `File "${file.name}" is not a valid image. Only image files (JPEG, PNG, WebP) are accepted.`,
        });
        e.target.value = '';
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setFeedback({
          type: 'error',
          message: `File "${file.name}" exceeds the maximum 5MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller file.`,
        });
        e.target.value = '';
        return;
      }
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      const res = await api.post<{ data: { urls: string[] } }>('/admin/upload', formData);
      if (res.data?.urls) {
        const newImages = res.data.urls.map((url, idx) => ({
          url,
          alt: `${name || 'Product'} image`,
          isPrimary: images.length === 0 && idx === 0,
        }));
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentProductId(null);
    setName('');
    setBrand('XYDV');
    setDescription('');
    setCategory(categories[0]?.slug || 'tops');
    setPrice(2999);
    setCompareAt(undefined);
    setTagsInput('tactical, waterproof');
    setImages([]);
    setVariants([
      {
        sku: `XYDV-${Date.now().toString().slice(-4)}-BLK-M`,
        color: 'Black',
        colorHex: '#000000',
        size: 'M',
        price: 2999,
        stock: 25,
      },
    ]);
    setIsPublished(true);
    setLowStockThreshold(5);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (p: Product) => {
    setIsEditing(true);
    setCurrentProductId(p._id || p.id || null);
    setName(p.name);
    setBrand(p.brand || 'XYDV');
    setDescription(p.description || '');
    setCategory(p.category || 'tops');
    setPrice(p.price);
    const validCompareAt =
      p.compareAt && p.compareAt > p.price
        ? p.compareAt
        : p.originalPrice && p.originalPrice > p.price
          ? p.originalPrice
          : undefined;
    setCompareAt(validCompareAt);
    setTagsInput((p.tags || []).join(', '));
    setImages(
      (p.images || []).map((img) =>
        typeof img === 'string'
          ? { url: img, isPrimary: false }
          : { url: img.url, alt: img.alt, isPrimary: img.isPrimary },
      ),
    );
    setVariants(
      p.variants && p.variants.length > 0
        ? p.variants
        : [
            {
              sku: `XYDV-STD-M`,
              color: 'Black',
              colorHex: '#000000',
              size: 'M',
              price: p.price,
              stock: 10,
            },
          ],
    );
    setIsPublished(p.isPublished !== false);
    setLowStockThreshold(p.lowStockThreshold || 5);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  // Save product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Product title is required' });
      return;
    }

    setIsSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        brand: brand.trim(),
        description: description.trim(),
        category: category.trim().toLowerCase(),
        price: Number(price),
        compareAt: compareAt && Number(compareAt) > Number(price) ? Number(compareAt) : undefined,
        tags,
        images,
        variants,
        isPublished,
        lowStockThreshold: Number(lowStockThreshold) || 5,
      };

      if (isEditing && currentProductId) {
        await api.patch(`/admin/products/${currentProductId}`, payload);
        setFeedback({ type: 'success', message: `Product "${name}" updated successfully.` });
      } else {
        await api.post('/admin/products', payload);
        setFeedback({ type: 'success', message: `Product "${name}" created successfully.` });
      }

      setIsDirty(false);
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/products/${productToDelete.id}`);
      setFeedback({
        type: 'success',
        message: `Product "${productToDelete.name}" deleted successfully.`,
      });
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  // Variant operations
  const handleAddVariant = () => {
    const skuCode = `XYDV-${Date.now().toString().slice(-4)}-BLK-${['S', 'M', 'L'][variants.length % 3]}`;
    setVariants((prev) => [
      ...prev,
      {
        sku: skuCode,
        color: 'Black',
        colorHex: '#000000',
        size: 'L',
        price: Number(price) || 148,
        stock: 15,
      },
    ]);
  };

  const handleUpdateVariant = (
    idx: number,
    field: keyof ProductVariant,
    val: ProductVariant[keyof ProductVariant]
  ) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveVariant = (idx: number) => {
    if (variants.length <= 1) {
      setFeedback({ type: 'error', message: 'A product must contain at least one inventory variant.' });
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-mono text-xl font-bold uppercase tracking-wider text-[#f5f5f5]">
            Product Catalog
          </h2>
          <p className="font-mono text-xs text-[#71717a] mt-0.5">
            Manage listings, multi-angle imagery, and size/color inventory variants ({total} total products)
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-none border border-[#e8ff00] bg-[#e8ff00] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[#0a0a0a] hover:bg-[#e8ff00]/90 transition-colors active:scale-[0.97]"
        >
          <Plus size={16} weight="bold" />
          <span>New Product</span>
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

      {/* Search, Filter & Sort Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded border border-[#1f1f1f] bg-[#111111] p-3.5">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-3 text-[#71717a]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search title, SKU, tag..."
            className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] py-2 pl-9 pr-3 font-mono text-xs text-[#f5f5f5] placeholder-[#52525b] focus:border-[#e8ff00] focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="rounded border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Stock Filter */}
        <select
          value={inStockFilter}
          onChange={(e) => {
            setInStockFilter(e.target.value);
            setPage(1);
          }}
          className="rounded border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
        >
          <option value="">All Stock Statuses</option>
          <option value="true">In Stock Only</option>
          <option value="false">Out of Stock Only</option>
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="rounded border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Title: A to Z</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded border border-[#1f1f1f] bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="border-b border-[#1f1f1f] bg-[#161616] font-mono uppercase tracking-wider text-[#a0a0a0]">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Variants</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#71717a]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e8ff00] border-t-transparent" />
                      <span className="font-mono text-xs uppercase">Loading Catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#71717a] font-mono uppercase">
                    No products found matching active filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const primaryImage =
                    typeof p.images?.[0] === 'string'
                      ? p.images[0]
                      : p.images?.[0]?.url || p.variants?.[0]?.imageUrl || '/brand-assets/xydv-logo.png';
                  const totalStock = (p.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);

                  return (
                    <tr key={p._id || p.id} className="hover:bg-[#141414] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-10 flex-shrink-0 overflow-hidden rounded border border-[#222222] bg-[#181818]">
                            <img
                              src={primaryImage}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-mono text-xs font-bold text-[#f5f5f5]">{p.name}</p>
                            <p className="font-mono text-[10px] text-[#71717a]">slug: {p.slug}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono uppercase text-[#a0a0a0]">
                        {p.category}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-[#f5f5f5]">₹{p.price}</span>
                        {p.compareAt && (
                          <span className="ml-1.5 text-[10px] text-[#71717a] line-through">
                            ₹{p.compareAt}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[#a0a0a0]">
                        <div className="flex items-center gap-1.5">
                          <span>{p.variants?.length || 0} SKUs</span>
                          <span className="text-[10px] text-[#71717a]">({totalStock} total units)</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {p.inStock && totalStock > 0 ? (
                          totalStock <= 5 ? (
                            <span className="inline-flex items-center rounded bg-[#ff3b3b]/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#ff3b3b]">
                              Low Stock ({totalStock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded bg-[#22c55e]/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#22c55e]">
                              In Stock
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center rounded bg-[#71717a]/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#71717a]">
                            Exhausted
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="rounded p-1.5 text-[#a0a0a0] hover:bg-[#1f1f1f] hover:text-[#f5f5f5] transition-colors"
                            aria-label={`Edit ${p.name}`}
                          >
                            <PencilSimple size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setProductToDelete({
                                id: p._id || p.id || '',
                                name: p.name,
                              })
                            }
                            className="rounded p-1.5 text-[#a0a0a0] hover:bg-[#ff3b3b]/10 hover:text-[#ff3b3b] transition-colors"
                            aria-label={`Delete ${p.name}`}
                          >
                            <Trash size={16} />
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
        <div className="flex items-center justify-between border-t border-[#1f1f1f] px-4 py-3 font-mono text-xs text-[#a0a0a0]">
          <span>
            Page {page} of {totalPages} ({total} products)
          </span>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-1 uppercase text-[#f5f5f5] disabled:opacity-30 active:scale-[0.97]"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-1 uppercase text-[#f5f5f5] disabled:opacity-30 active:scale-[0.97]"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Product Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="my-8 w-full max-w-3xl rounded border border-[#1f1f1f] bg-[#111111] p-6 shadow-2xl text-[#f5f5f5]">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-4 mb-6">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#e8ff00]">
                {isEditing ? `Edit Product: ${name}` : 'Create New Product'}
              </h3>
              <button
                type="button"
                onClick={handleRequestCloseModal}
                className="p-1 text-[#71717a] hover:text-[#f5f5f5]"
              >
                <X size={20} />
              </button>
            </div>

            {feedback && (
              <div
                className={`flex items-center justify-between rounded border p-3 mb-6 font-mono text-xs ${
                  feedback.type === 'success'
                    ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]'
                    : 'border-[#ff3b3b]/30 bg-[#ff3b3b]/10 text-[#ff3b3b]'
                }`}
                role="alert"
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

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs uppercase text-[#a0a0a0] mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setIsDirty(true);
                      setName(e.target.value);
                    }}
                    placeholder="e.g. Waterproof Technical Shell"
                    className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2.5 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase text-[#a0a0a0] mb-1.5">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => {
                      setIsDirty(true);
                      setBrand(e.target.value);
                    }}
                    className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2.5 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase text-[#a0a0a0] mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setIsDirty(true);
                      setCategory(e.target.value);
                    }}
                    className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2.5 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono text-xs uppercase text-[#a0a0a0] mb-1.5">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={price}
                      onChange={(e) => {
                        setIsDirty(true);
                        const newPrice = Number(e.target.value);
                        const oldPrice = Number(price);
                        setPrice(newPrice);
                        setVariants((prev) =>
                          prev.map((v) =>
                            v.price === oldPrice || !v.price ? { ...v, price: newPrice } : v,
                          ),
                        );
                      }}
                      className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2.5 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase text-[#a0a0a0] mb-1.5">
                      Compare Price (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={compareAt ?? ''}
                      onChange={(e) => {
                        setIsDirty(true);
                        setCompareAt(e.target.value ? Number(e.target.value) : undefined);
                      }}
                      placeholder="Discount"
                      className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2.5 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                  <div>
                    <label className="block font-mono text-xs uppercase text-[#a0a0a0] mb-1.5">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={lowStockThreshold}
                      onChange={(e) => {
                        setIsDirty(true);
                        setLowStockThreshold(Number(e.target.value));
                      }}
                      className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2.5 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col justify-center pt-2">
                    <label className="flex items-center gap-2 cursor-pointer mt-3">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => {
                          setIsDirty(true);
                          setIsPublished(e.target.checked);
                        }}
                        className="h-4 w-4 rounded border-[#1f1f1f] bg-[#0a0a0a] text-[#e8ff00] focus:ring-0 cursor-pointer accent-[#e8ff00]"
                      />
                      <span className="font-mono text-xs uppercase text-[#f5f5f5]">
                        Published (Storefront Visible)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono text-xs uppercase text-[#a0a0a0] mb-1.5">
                  Technical Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specify fabric engineering, membrane ratings, and tactical ergonomics..."
                  className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2.5 font-sans text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block font-mono text-xs uppercase text-[#a0a0a0] mb-1.5">
                  Search Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="tactical, waterproof, gore-tex, training"
                  className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2.5 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
                />
              </div>

              {/* Multiple Images Upload & Gallery */}
              <div className="space-y-3 pt-2 border-t border-[#1f1f1f]">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-xs uppercase tracking-wider text-[#e8ff00]">
                    Product Images ({images.length})
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded border border-[#1f1f1f] bg-[#181818] px-3 py-1 font-mono text-xs uppercase tracking-wider text-[#f5f5f5] hover:bg-[#222222]">
                    <UploadSimple size={14} />
                    <span>{isUploading ? 'Uploading...' : 'Upload Images'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {images.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {images.map((img, idx) => (
                      <div
                        key={img.url || idx}
                        className="group relative h-20 w-full overflow-hidden rounded border border-[#1f1f1f] bg-[#0a0a0a]"
                      >
                        <img src={img.url} alt="Upload" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 rounded bg-black/80 p-1 text-[#ff3b3b] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-[#1f1f1f] bg-[#0a0a0a] p-4 text-center font-mono text-xs text-[#71717a]">
                    No images uploaded yet. Click &quot;Upload Images&quot; to select files.
                  </div>
                )}
              </div>

              {/* Variant Management Matrix */}
              <div className="space-y-3 pt-2 border-t border-[#1f1f1f]">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-xs uppercase tracking-wider text-[#e8ff00]">
                    Variants & Stock Matrix ({variants.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="inline-flex items-center gap-1 font-mono text-xs uppercase text-[#e8ff00] hover:underline"
                  >
                    <Plus size={14} />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div
                      key={v.sku || idx}
                      className="grid grid-cols-1 sm:grid-cols-6 gap-2 rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2.5 items-center font-mono text-xs"
                    >
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-[#71717a] block">SKU</label>
                        <input
                          type="text"
                          required
                          value={v.sku}
                          onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                          className="w-full bg-transparent border-b border-[#222222] text-[#f5f5f5] py-0.5 focus:outline-none focus:border-[#e8ff00]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#71717a] block">Size</label>
                        <select
                          value={v.size}
                          onChange={(e) => handleUpdateVariant(idx, 'size', e.target.value)}
                          className="w-full bg-[#111111] border border-[#222222] text-[#f5f5f5] py-0.5 px-1 focus:outline-none"
                        >
                          {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'ONE SIZE'].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-[#71717a] block">Color</label>
                          <input
                            type="text"
                            value={v.color || ''}
                            onChange={(e) => handleUpdateVariant(idx, 'color', e.target.value)}
                            placeholder="Black"
                            className="w-full bg-transparent border-b border-[#222222] text-[#f5f5f5] py-0.5 focus:outline-none focus:border-[#e8ff00]"
                          />
                        </div>
                        <input
                          type="color"
                          value={v.colorHex || '#000000'}
                          onChange={(e) => handleUpdateVariant(idx, 'colorHex', e.target.value)}
                          className="h-6 w-6 mt-3.5 cursor-pointer bg-transparent border-0"
                          title="Choose Color Hex"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#71717a] block">Stock</label>
                        <input
                          type="number"
                          min={0}
                          required
                          value={v.stock}
                          onChange={(e) => handleUpdateVariant(idx, 'stock', Number(e.target.value))}
                          className="w-full bg-transparent border-b border-[#222222] text-[#f5f5f5] py-0.5 focus:outline-none focus:border-[#e8ff00]"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0">
                        <div>
                          <label className="text-[10px] text-[#71717a] block">Price (₹)</label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={v.price}
                            onChange={(e) =>
                              handleUpdateVariant(idx, 'price', Number(e.target.value))
                            }
                            className="w-16 bg-transparent border-b border-[#222222] text-[#f5f5f5] py-0.5 focus:outline-none focus:border-[#e8ff00]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-1 mt-3.5 text-[#ff3b3b] hover:opacity-75"
                          title="Remove variant"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f1f1f]">
                <button
                  type="button"
                  onClick={handleRequestCloseModal}
                  className="rounded border border-[#1f1f1f] bg-transparent px-4 py-2 font-mono text-xs uppercase text-[#a0a0a0] hover:text-[#f5f5f5]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded border border-[#e8ff00] bg-[#e8ff00] px-6 py-2 font-mono text-xs font-bold uppercase text-[#0a0a0a] hover:bg-[#e8ff00]/90 disabled:opacity-50 active:scale-[0.97]"
                >
                  {isSaving ? 'Saving...' : isEditing ? 'Update Listing' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal (PIPE-MED-04) */}
      <ConfirmDialog
        isOpen={showUnsavedConfirm}
        title="Discard Unsaved Changes?"
        description="You have unsaved modifications in this product listing. Are you sure you want to discard them?"
        confirmText="Discard Changes"
        cancelText="Continue Editing"
        isDestructive={true}
        onConfirm={() => {
          setShowUnsavedConfirm(false);
          setIsDirty(false);
          setIsModalOpen(false);
        }}
        onCancel={() => setShowUnsavedConfirm(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        title="Delete Product Listing"
        description={`Are you sure you want to permanently delete "${productToDelete?.name}"? All associated variant inventory records will be removed.`}
        confirmText="Delete Product"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-xs text-[#71717a]">Loading catalog...</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}
