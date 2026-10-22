'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, PencilSimple, Trash, X, CheckCircle, Warning } from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog';
import type { CategoryItem } from '@vertex/types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ data: CategoryItem[] }>('/admin/categories');
      setCategories(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch categories';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setIsEditing(true);
    setEditId(cat._id || '');
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      if (isEditing && editId) {
        await api.patch(`/admin/categories/${editId}`, {
          name: name.trim(),
          description: description.trim(),
          image: image.trim(),
        });
        setFeedback({ type: 'success', message: `Category "${name}" updated successfully.` });
      } else {
        await api.post('/admin/categories', {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          image: image.trim(),
        });
        setFeedback({ type: 'success', message: `Category "${name}" created successfully.` });
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save category';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!catToDelete) return;
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/categories/${catToDelete.id}`);
      setFeedback({
        type: 'success',
        message: `Category "${catToDelete.name}" deleted successfully.`,
      });
      setCatToDelete(null);
      fetchCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-mono text-xl font-bold tracking-wider text-[var(--text-primary)] uppercase">
            Catalog Categories
          </h2>
          <p className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">
            Organize and classify products into technical collections ({categories.length}{' '}
            categories)
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-tactile inline-flex items-center gap-2 rounded-none border border-[var(--text-primary)] bg-[var(--text-primary)] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase transition-colors hover:opacity-90 active:scale-[0.97] dark:border-[#e8ff00] dark:bg-[#e8ff00] dark:text-[#0a0a0a]"
        >
          <Plus size={16} weight="bold" />
          <span>New Category</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-none border p-3 font-mono text-xs ${
            feedback.type === 'success'
              ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#15803d] dark:text-[#22c55e]'
              : 'border-[#ff3b3b]/30 bg-[#ff3b3b]/10 text-[#ff3b3b]'
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

      {/* Categories Grid / Table */}
      <div className="overflow-hidden rounded-none border border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)] font-mono tracking-wider text-[var(--text-muted)] uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug Identifier</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Active Listings</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--text-primary)] border-t-transparent dark:border-[#e8ff00]" />
                      <span className="font-mono text-xs uppercase">Loading Categories...</span>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center font-mono text-[var(--text-muted)] uppercase"
                  >
                    No categories defined yet.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr
                    key={c._id || c.slug}
                    className="transition-colors hover:bg-[var(--bg-elevated)]"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)]">
                      {c.name}
                    </td>

                    <td className="px-4 py-3 font-mono text-[var(--text-primary)] dark:text-[#e8ff00]">
                      /{c.slug}
                    </td>

                    <td className="max-w-xs truncate px-4 py-3 text-[var(--text-secondary)]">
                      {c.description || '—'}
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <span className="rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-primary)]">
                        {c.productCount ?? 0} products
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="btn-tactile rounded-none p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                          aria-label={`Edit ${c.name}`}
                        >
                          <PencilSimple size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setCatToDelete({ id: c._id || '', name: c.name })}
                          className="btn-tactile rounded-none p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[#ff3b3b]/10 hover:text-[#ff3b3b] active:scale-[0.97]"
                          aria-label={`Delete ${c.name}`}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm dark:bg-black/80"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase dark:text-[#e8ff00]">
                {isEditing ? `Edit Category: ${name}` : 'New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-tactile p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Footwear & Compression"
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                />
              </div>

              {!isEditing && (
                <div>
                  <label className="mb-1 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                    Slug (Optional, auto-generated)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. footwear-compression"
                    className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Category collection overview..."
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-sans text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                  Header Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://... or /img.webp"
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-tactile rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-xs tracking-wider text-[var(--text-muted)] uppercase transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-tactile rounded-none border border-[var(--text-primary)] bg-[var(--text-primary)] px-5 py-2 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase transition-colors hover:opacity-90 active:scale-[0.97] disabled:opacity-50 dark:border-[#e8ff00] dark:bg-[#e8ff00] dark:text-[#0a0a0a]"
                >
                  {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(catToDelete)}
        title="Delete Category"
        description={`Are you sure you want to delete category "${catToDelete?.name}"?`}
        confirmText="Delete Category"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setCatToDelete(null)}
      />
    </div>
  );
}
