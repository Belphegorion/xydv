import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  color: string;
  colorHex: string;
  size: string;
  price: number;
  compareAt?: number;
  image: string;
  quantity: number;
  sku: string;
  maxStock?: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  // Actions
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  // Computed
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (newItem, quantity = 1) => {
        const flooredQty = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
        const maxLimit = newItem.maxStock ?? 99;
        const existing = get().items.find((i) => i.id === newItem.id);
        if (existing) {
          const itemMax = existing.maxStock ?? maxLimit;
          set((state) => ({
            items: state.items.map((i) =>
              i.id === newItem.id
                ? { ...i, quantity: Math.min(i.quantity + flooredQty, itemMax) }
                : i,
            ),
            isOpen: true,
          }));
        } else {
          set((state) => ({
            items: [
              ...state.items,
              { ...newItem, quantity: Math.min(flooredQty, maxLimit) },
            ],
            isOpen: true,
          }));
        }
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) => {
        if (!Number.isFinite(quantity) || quantity <= 0) {
          get().removeItem(id);
          return;
        }
        const flooredQty = Math.floor(quantity);
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id !== id) return i;
            const maxLimit = i.maxStock ?? 99;
            return { ...i, quantity: Math.min(flooredQty, maxLimit) };
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'vertex-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
