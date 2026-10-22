import type { RazorpayCheckoutOptions } from '@vertex/types';

export interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: string, handler: (response: unknown) => void): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export {};
