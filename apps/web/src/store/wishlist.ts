import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  addedAt: string;
}

interface WishlistStore {
  items: WishlistItem[];
  toggle: (item: Omit<WishlistItem, 'addedAt'>) => void;
  isWishlisted: (productId: string) => boolean;
  remove: (productId: string) => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const exists = get().isWishlisted(item.productId);
        if (exists) {
          get().remove(item.productId);
        } else {
          set((state) => ({
            items: [...state.items, { ...item, addedAt: new Date().toISOString() }],
          }));
        }
      },
      isWishlisted: (productId) => get().items.some((i) => i.productId === productId),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
    }),
    {
      name: 'xydv-wishlist',
      storage: createJSONStorage(() => ({
        getItem: (name: string): string | null => {
          if (typeof window === 'undefined') return null;
          try {
            const val = localStorage.getItem(name);
            if (val) return val;
            return localStorage.getItem('vertex-wishlist');
          } catch {
            return null;
          }
        },
        setItem: (name: string, value: string): void => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.setItem(name, value);
          } catch {}
        },
        removeItem: (name: string): void => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.removeItem(name);
            localStorage.removeItem('vertex-wishlist');
          } catch {}
        },
      })),
    },
  ),
);
