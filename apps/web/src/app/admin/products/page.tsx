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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

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
  const [images, setImages] = useState<
    Array<{ url: string; alt?: string; isPrimary?: boolean; isSecondary?: boolean }>
  >([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [specs, setSpecs] = useState<Array<{ label: string; value: string }>>([
    { label: 'Fabric', value: '4-Way Stretch Cordura Ripstop' },
  ]);
  const [featuresInput, setFeaturesInput] = useState<string>('');
  const [discipline, setDiscipline] = useState<string>('all');
  const [gender, setGender] = useState<string>('unisex');
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
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isBestseller, setIsBestseller] = useState<boolean>(false);
  const [materialsInput, setMaterialsInput] = useState<string>('');
  const [sizeChart, setSizeChart] = useState<string>('');
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
        setIsDirty(true);
        const newImages = res.data.urls.map((url, idx) => ({
          url,
          alt: `${name || 'Product'} image`,
          isPrimary: images.length === 0 && idx === 0,
          isSecondary: (images.length === 0 && idx === 1) || (images.length === 1 && idx === 0),
        }));
        setImages((prev) => {
          const combined = [...prev, ...newImages];
          if (combined.length > 0 && !combined.some((img) => img.isPrimary)) {
            combined[0] = { ...combined[0], isPrimary: true };
          }
          return combined;
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (targetIdx: number) => {
    setIsDirty(true);
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== targetIdx);
      if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
        updated[0] = { ...updated[0], isPrimary: true, isSecondary: false };
      }
      return updated;
    });
  };

  const handleSetPrimaryImage = (targetIdx: number) => {
    setIsDirty(true);
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isPrimary: idx === targetIdx,
        isSecondary: idx === (targetIdx === 0 ? 1 : 0),
      })),
    );
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setIsDirty(true);
    setImages((prev) => {
      const isFirst = prev.length === 0;
      const combined = [
        ...prev,
        {
          url,
          alt: `${name || 'Product'} image`,
          isPrimary: isFirst,
          isSecondary: prev.length === 1,
        },
      ];
      if (!combined.some((img) => img.isPrimary)) {
        combined[0] = { ...combined[0], isPrimary: true };
      }
      return combined;
    });
    setImageUrlInput('');
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
    setImageUrlInput('');
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
    setIsFeatured(false);
    setIsBestseller(false);
    setMaterialsInput('');
    setSizeChart('');
    setLowStockThreshold(5);
    setSpecs([
      { label: 'Fabric', value: '4-Way Stretch Cordura Ripstop' },
      { label: 'Weight', value: '180 GSM' },
      { label: 'Treatment', value: 'DWR Water Repellent' },
    ]);
    setFeaturesInput(
      'SweatShield+ moisture management\nReinforced ergonomic seams\nLaser-cut ventilation zones',
    );
    setDiscipline('all');
    setGender('unisex');
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
    setImageUrlInput('');
    setSpecs(
      Array.isArray(p.specs) && p.specs.length > 0
        ? p.specs.map((s) => ({ label: s.label || '', value: s.value || '' }))
        : [
            { label: 'Fabric', value: '4-Way Stretch Cordura' },
            { label: 'Care', value: 'Machine wash cold' },
          ],
    );
    setFeaturesInput(Array.isArray(p.features) ? p.features.join('\n') : '');
    setDiscipline(p.discipline || 'all');
    setGender(p.gender || 'unisex');
    const rawImages = (p.images || []).map((img, idx) =>
      typeof img === 'string'
        ? { url: img, isPrimary: idx === 0, isSecondary: idx === 1 }
        : {
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary ?? idx === 0,
            isSecondary: img.isSecondary ?? idx === 1,
          },
    );
    if (rawImages.length > 0 && !rawImages.some((img) => img.isPrimary)) {
      rawImages[0].isPrimary = true;
    }
    setImages(rawImages);
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
    setIsFeatured(Boolean(p.isFeatured || p.featured));
    setIsBestseller(Boolean(p.bestseller));
    setMaterialsInput(Array.isArray(p.materials) ? p.materials.join(', ') : '');
    setSizeChart(p.sizeChart ? JSON.stringify(p.sizeChart, null, 2) : '');
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

      const hasAnyPrimary = images.some((i) => i.isPrimary);
      const normalizedImages = images.map((img, idx) => {
        const isPrimary = hasAnyPrimary ? Boolean(img.isPrimary) : idx === 0;
        return {
          url: img.url.trim(),
          alt: img.alt?.trim() || `${name.trim()} image ${idx + 1}`,
          isPrimary,
          isSecondary: isPrimary ? false : Boolean(img.isSecondary),
        };
      });

      if (normalizedImages.length > 0 && !normalizedImages.some((i) => i.isPrimary)) {
        normalizedImages[0].isPrimary = true;
        normalizedImages[0].isSecondary = false;
      }

      const primaryImgUrl =
        normalizedImages.find((i) => i.isPrimary)?.url || normalizedImages[0]?.url;

      const cleanSpecs = specs
        .filter((s) => s.label.trim() && s.value.trim())
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }));
      const cleanFeatures = featuresInput
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const cleanMaterials = materialsInput
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      let parsedSizeChart: Record<string, Record<string, string>> | undefined = undefined;
      if (sizeChart.trim()) {
        try {
          parsedSizeChart = JSON.parse(sizeChart.trim());
        } catch {
          // Keep as undefined if invalid JSON
        }
      }

      const payload = {
        name: name.trim(),
        brand: brand.trim(),
        description: description.trim(),
        category: category.trim().toLowerCase(),
        price: Number(price),
        compareAt: compareAt && Number(compareAt) > Number(price) ? Number(compareAt) : undefined,
        tags,
        images: normalizedImages,
        imageUrl: primaryImgUrl,
        variants,
        isPublished,
        isFeatured,
        bestseller: isBestseller,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        specs: cleanSpecs,
        features: cleanFeatures,
        materials: cleanMaterials.length > 0 ? cleanMaterials : undefined,
        sizeChart: parsedSizeChart,
        discipline: discipline.trim().toLowerCase(),
        gender: gender.trim().toLowerCase(),
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
    val: ProductVariant[keyof ProductVariant],
  ) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveVariant = (idx: number) => {
    if (variants.length <= 1) {
      setFeedback({
        type: 'error',
        message: 'A product must contain at least one inventory variant.',
      });
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-mono text-xl font-bold tracking-wider text-[var(--text-primary)] uppercase">
            Product Catalog
          </h2>
          <p className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">
            Manage listings, multi-angle imagery, and size/color inventory variants ({total} total
            products)
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-tactile inline-flex items-center gap-2 rounded-none border border-[var(--text-primary)] bg-[var(--text-primary)] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase transition-colors hover:opacity-90 active:scale-[0.97] dark:border-[#e8ff00] dark:bg-[#e8ff00] dark:text-[#0a0a0a]"
        >
          <Plus size={16} weight="bold" />
          <span>New Product</span>
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

      {/* Search, Filter & Sort Toolbar */}
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
            placeholder="Search title, SKU, tag..."
            className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pr-3 pl-9 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
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
          className="rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
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
          className="rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
        >
          <option value="newest">Newest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Title: A to Z</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-none border border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)] font-mono tracking-wider text-[var(--text-muted)] uppercase">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Variants</th>
                <th className="px-4 py-3">Stock Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--text-primary)] border-t-transparent dark:border-[#e8ff00]" />
                      <span className="font-mono text-xs uppercase">Loading Catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center font-mono text-[var(--text-muted)] uppercase"
                  >
                    No products found matching active filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const primaryImage =
                    typeof p.images?.[0] === 'string'
                      ? p.images[0]
                      : p.images?.[0]?.url ||
                        p.variants?.[0]?.imageUrl ||
                        '/brand-assets/xydv-logo.png';
                  const totalStock = (p.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);

                  return (
                    <tr
                      key={p._id || p.id}
                      className="transition-colors hover:bg-[var(--bg-elevated)]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-10 flex-shrink-0 overflow-hidden rounded-none border border-[var(--border)] bg-[var(--bg-elevated)]">
                            <img
                              src={primaryImage}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-mono text-xs font-bold text-[var(--text-primary)]">
                              {p.name}
                            </p>
                            <p className="font-mono text-[10px] text-[var(--text-muted)]">
                              slug: {p.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[var(--text-secondary)] uppercase">
                        {p.category}
                      </td>

                      <td className="px-4 py-3 font-mono">
                        {p.effectivePricePaise &&
                        p.effectivePricePaise <
                          (p.sellingPricePaise ?? Math.round(p.price * 100)) ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-emerald-400">
                                ₹{(p.effectivePricePaise / 100).toFixed(0)}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] line-through">
                                ₹{p.price}
                              </span>
                            </div>
                            {p.discountBadgeLabel && (
                              <span className="mt-0.5 inline-block rounded bg-[var(--accent)]/15 px-1.5 py-0.5 text-[9px] font-bold text-[var(--accent)] border border-[var(--accent)]/30">
                                {p.discountBadgeLabel}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-[var(--text-primary)]">₹{p.price}</span>
                            {p.compareAt && (
                              <span className="ml-1.5 text-[10px] text-[var(--text-muted)] line-through">
                                ₹{p.compareAt}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1.5">
                          <span>{p.variants?.length || 0} SKUs</span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            ({totalStock} total units)
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {p.inStock && totalStock > 0 ? (
                          totalStock <= 5 ? (
                            <span className="inline-flex items-center rounded-none border border-[#b91c1c]/30 bg-[#b91c1c]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#b91c1c] uppercase dark:border-[#ff3b3b]/30 dark:bg-[#ff3b3b]/10 dark:text-[#ff3b3b]">
                              Low Stock ({totalStock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-none border border-[#22c55e]/30 bg-[#22c55e]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#15803d] uppercase dark:text-[#22c55e]">
                              In Stock
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--text-muted)] uppercase">
                            Exhausted
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="btn-tactile inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-none p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] active:scale-[0.97]"
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
                            className="btn-tactile inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-none p-2 text-[var(--text-muted)] transition-colors hover:bg-[#b91c1c]/10 hover:text-[#b91c1c] active:scale-[0.97] dark:hover:bg-[#ff3b3b]/10 dark:hover:text-[#ff3b3b]"
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
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
          <span>
            Page {page} of {totalPages} ({total} products)
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

      {/* Product Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={handleRequestCloseModal}
            aria-hidden="true"
          />

          <div className="relative flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-4xl flex-col rounded-none border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl overflow-hidden">
            {/* Pinned Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
              <div>
                <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--text-primary)] dark:text-[#e8ff00] uppercase">
                  CATALOG MANAGEMENT
                </span>
                <h3 id="product-modal-title" className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase dark:text-[#e8ff00]">
                  {isEditing ? `Edit Product: ${name}` : 'Create New Product'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleRequestCloseModal}
                className="btn-tactile p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Body */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
                {feedback && (
                  <div
                    className={`flex items-center justify-between rounded-none border p-3 font-mono text-xs ${
                      feedback.type === 'success'
                        ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#15803d] dark:text-[#22c55e]'
                        : 'border-[#b91c1c]/30 bg-[#b91c1c]/10 text-[#b91c1c] dark:border-[#ff3b3b]/30 dark:bg-[#ff3b3b]/10 dark:text-[#ff3b3b]'
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
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
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
                    className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => {
                      setIsDirty(true);
                      setBrand(e.target.value);
                    }}
                    className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setIsDirty(true);
                      setCategory(e.target.value);
                    }}
                    className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                    Discipline
                  </label>
                  <select
                    value={discipline}
                    onChange={(e) => {
                      setIsDirty(true);
                      setDiscipline(e.target.value);
                    }}
                    className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                  >
                    <option value="all">ALL DISCIPLINES</option>
                    <option value="run">RUN (DIV.01)</option>
                    <option value="train">TRAIN (DIV.02)</option>
                    <option value="rec">REC (DIV.03)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => {
                      setIsDirty(true);
                      setGender(e.target.value);
                    }}
                    className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                  >
                    <option value="unisex">UNISEX</option>
                    <option value="men">MEN</option>
                    <option value="women">WOMEN</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
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
                      className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
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
                      className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                  <div>
                    <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
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
                      className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => {
                          setIsDirty(true);
                          setIsPublished(e.target.checked);
                        }}
                        className="h-4 w-4 cursor-pointer rounded-none border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] accent-[var(--text-primary)] focus:ring-0 dark:text-[#e8ff00] dark:accent-[#e8ff00]"
                      />
                      <span className="font-mono text-xs text-[var(--text-primary)] uppercase">
                        Published
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => {
                          setIsDirty(true);
                          setIsFeatured(e.target.checked);
                        }}
                        className="h-4 w-4 cursor-pointer rounded-none border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] accent-[var(--text-primary)] focus:ring-0 dark:text-[#e8ff00] dark:accent-[#e8ff00]"
                      />
                      <span className="font-mono text-xs text-[var(--text-primary)] uppercase">
                        Featured
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isBestseller}
                        onChange={(e) => {
                          setIsDirty(true);
                          setIsBestseller(e.target.checked);
                        }}
                        className="h-4 w-4 cursor-pointer rounded-none border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] accent-[var(--text-primary)] focus:ring-0 dark:text-[#e8ff00] dark:accent-[#e8ff00]"
                      />
                      <span className="font-mono text-xs text-[var(--text-primary)] uppercase">
                        Bestseller
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                  Technical Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => {
                    setIsDirty(true);
                    setDescription(e.target.value);
                  }}
                  placeholder="Specify fabric engineering, membrane ratings, and tactical ergonomics..."
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-sans text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                  Search Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => {
                    setIsDirty(true);
                    setTagsInput(e.target.value);
                  }}
                  placeholder="tactical, waterproof, gore-tex, training"
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                />
              </div>

              {/* Technical Features (Bullet Items) */}
              <div>
                <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                  Technical Features (One bullet item per line)
                </label>
                <textarea
                  rows={3}
                  value={featuresInput}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFeaturesInput(e.target.value);
                  }}
                  placeholder="e.g. SweatShield+ anti-odor fabric&#10;4-way mechanical stretch&#10;Laser-cut breathable vents"
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                />
              </div>

              {/* Materials */}
              <div>
                <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                  Materials & Textile Composition (Comma separated)
                </label>
                <input
                  type="text"
                  value={materialsInput}
                  onChange={(e) => {
                    setIsDirty(true);
                    setMaterialsInput(e.target.value);
                  }}
                  placeholder="e.g. 88% Cordura Nylon, 12% Spandex, DWR coating"
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                />
              </div>

              {/* Size Chart Matrix */}
              <div>
                <label className="mb-1.5 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                  Size Chart Matrix (Optional JSON format)
                </label>
                <textarea
                  rows={2}
                  value={sizeChart}
                  onChange={(e) => {
                    setIsDirty(true);
                    setSizeChart(e.target.value);
                  }}
                  placeholder='e.g. {"chest": {"S": "36-38", "M": "40-42"}, "waist": {"S": "30", "M": "32"}}'
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                />
              </div>

              {/* Technical Specifications Key-Value Table */}
              <div className="space-y-3 border-t border-[var(--border)] pt-2">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase dark:text-[#e8ff00]">
                    Technical Specifications ({specs.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirty(true);
                      setSpecs((prev) => [...prev, { label: '', value: '' }]);
                    }}
                    className="btn-tactile inline-flex items-center gap-1 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 font-mono text-xs text-[var(--text-primary)] uppercase hover:border-[var(--text-primary)] active:scale-[0.97]"
                  >
                    <Plus size={12} />
                    <span>Add Spec</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {specs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(e) => {
                          setIsDirty(true);
                          const val = e.target.value;
                          setSpecs((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, label: val } : s)),
                          );
                        }}
                        placeholder="Label (e.g. Fabric, Weight, Membrane)"
                        className="w-1/3 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => {
                          setIsDirty(true);
                          const val = e.target.value;
                          setSpecs((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, value: val } : s)),
                          );
                        }}
                        placeholder="Value (e.g. 4-Way Stretch Cordura, 180 GSM, DWR)"
                        className="flex-1 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsDirty(true);
                          setSpecs((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="btn-tactile p-2 text-[#b91c1c] hover:opacity-75 active:scale-[0.97] dark:text-[#ff3b3b]"
                        aria-label="Remove spec"
                        title="Remove spec"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multiple Images Upload & Gallery */}
              <div className="space-y-3 border-t border-[var(--border)] pt-2">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase dark:text-[#e8ff00]">
                    Product Images ({images.length})
                  </label>
                  <label className="btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97]">
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

                {/* Add Image by URL */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    placeholder="Add image URL (/products/lookbook-1.jpg or https://...)"
                    className="flex-1 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="btn-tactile inline-flex min-h-[34px] items-center gap-1 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97]"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>

                {images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {images.map((img, idx) => (
                      <div
                        key={img.url || idx}
                        className={`group relative h-24 w-full overflow-hidden rounded-none border bg-[var(--bg-elevated)] ${
                          img.isPrimary
                            ? 'border-[#e8ff00] ring-1 ring-[#e8ff00]'
                            : 'border-[var(--border)]'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.alt || 'Upload'}
                          className="h-full w-full object-cover"
                        />

                        {/* Primary Badge or Set Primary Action */}
                        {img.isPrimary ? (
                          <span className="absolute bottom-1 left-1 rounded-none border border-[#e8ff00]/60 bg-black/90 px-1 py-0.5 font-mono text-[9px] font-bold tracking-wider text-[#e8ff00] uppercase">
                            Primary
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="btn-tactile absolute bottom-1 left-1 rounded-none bg-black/85 px-1.5 py-0.5 font-mono text-[9px] text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#e8ff00] active:scale-[0.97]"
                            aria-label={`Set image ${idx + 1} as primary`}
                            title="Set as primary"
                          >
                            Set Primary
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="btn-tactile absolute top-1 right-1 rounded-none bg-black/80 p-1 text-[#ff3b3b] opacity-0 transition-opacity group-hover:opacity-100 active:scale-[0.97]"
                          aria-label={`Remove image ${idx + 1}`}
                          title="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-none border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-center font-mono text-xs text-[var(--text-muted)]">
                    No images uploaded yet. Click &quot;Upload Images&quot; or paste an image URL.
                  </div>
                )}
              </div>

              {/* Variant Management Matrix */}
              <div className="space-y-3 border-t border-[var(--border)] pt-2">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase dark:text-[#e8ff00]">
                    Variants & Stock Matrix ({variants.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirty(true);
                      handleAddVariant();
                    }}
                    className="inline-flex items-center gap-1 font-mono text-xs text-[var(--text-primary)] uppercase hover:underline dark:text-[#e8ff00]"
                  >
                    <Plus size={14} />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div
                      key={v.sku || idx}
                      className="grid grid-cols-1 items-center gap-2 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs sm:grid-cols-6"
                    >
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-[var(--text-muted)]">SKU</label>
                        <input
                          type="text"
                          required
                          value={v.sku}
                          onChange={(e) => {
                            setIsDirty(true);
                            handleUpdateVariant(idx, 'sku', e.target.value);
                          }}
                          className="w-full border-b border-[var(--border)] bg-transparent py-0.5 text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-[var(--text-muted)]">Size</label>
                        <select
                          value={v.size}
                          onChange={(e) => {
                            setIsDirty(true);
                            handleUpdateVariant(idx, 'size', e.target.value);
                          }}
                          className="w-full border border-[var(--border)] bg-[var(--bg-surface)] px-1 py-0.5 text-[var(--text-primary)] focus:outline-none"
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
                          <label className="block text-[10px] text-[var(--text-muted)]">
                            Color
                          </label>
                          <input
                            type="text"
                            value={v.color || ''}
                            onChange={(e) => {
                              setIsDirty(true);
                              handleUpdateVariant(idx, 'color', e.target.value);
                            }}
                            placeholder="Black"
                            className="w-full border-b border-[var(--border)] bg-transparent py-0.5 text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                          />
                        </div>
                        <input
                          type="color"
                          value={v.colorHex || '#000000'}
                          onChange={(e) => {
                            setIsDirty(true);
                            handleUpdateVariant(idx, 'colorHex', e.target.value);
                          }}
                          className="mt-3.5 h-6 w-6 cursor-pointer border-0 bg-transparent"
                          title="Choose Color Hex"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-[var(--text-muted)]">Stock</label>
                        <input
                          type="number"
                          min={0}
                          required
                          value={v.stock}
                          onChange={(e) => {
                            setIsDirty(true);
                            handleUpdateVariant(idx, 'stock', Number(e.target.value));
                          }}
                          className="w-full border-b border-[var(--border)] bg-transparent py-0.5 text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 sm:justify-end sm:pt-0">
                        <div>
                          <label className="block text-[10px] text-[var(--text-muted)]">
                            Price (₹)
                          </label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={v.price}
                            onChange={(e) => {
                              setIsDirty(true);
                              handleUpdateVariant(idx, 'price', Number(e.target.value));
                            }}
                            className="w-16 border-b border-[var(--border)] bg-transparent py-0.5 text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsDirty(true);
                            handleRemoveVariant(idx);
                          }}
                          className="btn-tactile mt-3.5 p-1 text-[#b91c1c] hover:opacity-75 active:scale-[0.97] dark:text-[#ff3b3b]"
                          title="Remove variant"
                          aria-label="Remove variant"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pinned Form Actions */}
            <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-4">
              <button
                type="button"
                onClick={handleRequestCloseModal}
                className="btn-tactile rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 font-mono text-xs tracking-wider text-[var(--text-muted)] uppercase transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-[0.97]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-tactile rounded-none border border-[var(--text-primary)] bg-[var(--text-primary)] px-6 py-2 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase transition-colors hover:opacity-90 active:scale-[0.97] disabled:opacity-50 dark:border-[#e8ff00] dark:bg-[#e8ff00] dark:text-[#0a0a0a]"
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
        cancelText="Cancel"
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
    <Suspense
      fallback={
        <div className="p-8 font-mono text-xs text-[var(--text-muted)]">Loading catalog...</div>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}
