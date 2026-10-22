/**
 * Client Runtime Simulation for VERTEX E2E Testing Track
 * Faithfully mirrors browser DOM events, Zustand cart store, localStorage persistence,
 * focus trap mechanics, and Razorpay checkout modal interactions.
 */
import { COMMERCE_RULES, calculateCartMetrics, MOTION_SPECS } from './contracts.mjs';

export class LocalStorageMock {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

export class CartStoreSimulator {
  constructor({ storage = new LocalStorageMock(), storageKey = 'vertex-cart' } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.items = [];
    this.isOpen = false;
    this.motionMode = 'spring'; // 'spring' or 'reduced-motion'
    this.hydrate();
  }

  hydrate() {
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.state && Array.isArray(parsed.state.items)) {
          this.items = parsed.state.items;
        } else if (Array.isArray(parsed.items)) {
          this.items = parsed.items;
        }
      }
    } catch {
      this.items = [];
    }
  }

  persist() {
    this.storage.setItem(
      this.storageKey,
      JSON.stringify({
        state: { items: this.items },
        version: 0,
      }),
    );
  }

  openCart() {
    this.isOpen = true;
  }

  closeCart() {
    this.isOpen = false;
  }

  addItem(product, variant, quantity = 1) {
    if (quantity <= 0) return { success: false, reason: 'Invalid quantity' };
    if (!variant || variant.stock <= 0) return { success: false, reason: 'Out of stock' };

    const itemId = `${product._id}::${variant.id}`;
    const existing = this.items.find((i) => i.id === itemId);

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > variant.stock) {
        existing.quantity = variant.stock; // Clamped to maxStock
      } else {
        existing.quantity = newQty;
      }
    } else {
      const clampedQty = Math.min(quantity, variant.stock);
      this.items.push({
        id: itemId,
        productId: product._id,
        name: product.name,
        price: product.price,
        image: variant.imageUrl,
        secondaryImage: variant.secondaryImageUrl,
        variant: { ...variant },
        quantity: clampedQty,
        maxStock: variant.stock,
      });
    }

    this.isOpen = true;
    this.persist();
    return { success: true, itemId };
  }

  updateQuantity(id, quantity) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return { success: false, reason: 'Item not found' };

    if (quantity <= 0) {
      this.removeItem(id);
      return { success: true, removed: true };
    }

    // Clamp to available stock bounds
    const clamped = Math.min(Math.floor(quantity), item.maxStock);
    item.quantity = clamped;
    this.persist();
    return { success: true, quantity: clamped };
  }

  removeItem(id) {
    this.items = this.items.filter((i) => i.id !== id);
    this.persist();
  }

  swapVariant(itemId, newVariant) {
    const itemIndex = this.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) return { success: false, reason: 'Item not found' };
    if (!newVariant || newVariant.stock <= 0)
      return { success: false, reason: 'Variant out of stock' };

    const currentItem = this.items[itemIndex];
    const newItemId = `${currentItem.productId}::${newVariant.id}`;

    // If an item with the new variant already exists, merge quantities
    const existingTarget = this.items.find((i) => i.id === newItemId && i.id !== itemId);
    if (existingTarget) {
      const mergedQty = Math.min(existingTarget.quantity + currentItem.quantity, newVariant.stock);
      existingTarget.quantity = mergedQty;
      this.items.splice(itemIndex, 1);
    } else {
      currentItem.id = newItemId;
      currentItem.variant = { ...newVariant };
      currentItem.image = newVariant.imageUrl;
      currentItem.secondaryImage = newVariant.secondaryImageUrl;
      currentItem.maxStock = newVariant.stock;
      currentItem.quantity = Math.min(currentItem.quantity, newVariant.stock);
    }

    this.persist();
    return { success: true, newItemId };
  }

  clearCart() {
    this.items = [];
    this.persist();
  }

  getMetrics() {
    return calculateCartMetrics(this.items);
  }

  getItemCount() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }
}

export class FocusTrapSimulator {
  constructor(
    focusableSelectors = ['close-button', 'qty-dec', 'qty-inc', 'swatch-btn', 'checkout-button'],
  ) {
    this.elements = focusableSelectors;
    this.currentIndex = 0;
    this.isOpen = false;
    this.triggerElement = null;
  }

  activate(trigger = 'cart-icon-btn') {
    this.isOpen = true;
    this.triggerElement = trigger;
    this.currentIndex = 0; // Focus starts on first element (e.g. close button)
  }

  deactivate() {
    this.isOpen = false;
    const restored = this.triggerElement;
    this.triggerElement = null;
    return restored; // Returns element to restore focus to
  }

  getActiveElement() {
    if (!this.isOpen || this.elements.length === 0) return null;
    return this.elements[this.currentIndex];
  }

  handleTab(shiftKey = false) {
    if (!this.isOpen || this.elements.length === 0) return null;

    if (shiftKey) {
      // Backward traversal (Shift+Tab)
      this.currentIndex = (this.currentIndex - 1 + this.elements.length) % this.elements.length;
    } else {
      // Forward traversal (Tab)
      this.currentIndex = (this.currentIndex + 1) % this.elements.length;
    }
    return this.elements[this.currentIndex];
  }

  handleEscape() {
    return this.deactivate();
  }
}

export class RazorpayCheckoutModalSimulator {
  constructor({ keyId = 'rzp_test_vertex_1234567890' } = {}) {
    this.keyId = keyId;
    this.isLoaded = false;
    this.isOpen = false;
    this.currentOptions = null;
  }

  loadScript() {
    this.isLoaded = true;
    return Promise.resolve(true);
  }

  open(options) {
    if (!this.isLoaded) throw new Error('Razorpay SDK not loaded');
    if (!options.order_id) throw new Error('Missing order_id in options');
    if (!options.key) throw new Error('Missing key in options');
    this.currentOptions = options;
    this.isOpen = true;
    return this;
  }

  simulateSuccess(paymentId, signature) {
    if (!this.isOpen || !this.currentOptions) throw new Error('Modal is not open');
    this.isOpen = false;
    const response = {
      razorpay_order_id: this.currentOptions.order_id,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    };
    if (typeof this.currentOptions.handler === 'function') {
      this.currentOptions.handler(response);
    }
    return response;
  }

  simulateDismiss() {
    if (!this.isOpen || !this.currentOptions) return;
    this.isOpen = false;
    if (this.currentOptions.modal && typeof this.currentOptions.modal.ondismiss === 'function') {
      this.currentOptions.modal.ondismiss();
    }
  }
}
