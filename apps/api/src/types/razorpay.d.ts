declare module 'razorpay' {
  export interface RazorpayOptions {
    key_id: string;
    key_secret: string;
    headers?: Record<string, string>;
  }

  export interface RazorpayOrderCreateOptions {
    amount: number;
    currency: string;
    receipt?: string;
    partial_payment?: boolean;
    notes?: Record<string, string>;
    payment_capture?: boolean | 1 | 0;
  }

  export interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt?: string;
    offer_id?: string | null;
    status: string;
    attempts: number;
    notes?: Record<string, string>;
    created_at: number;
  }

  export interface RazorpayPayment {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: string;
    order_id: string;
    method?: string;
    email?: string;
    contact?: string;
    created_at: number;
  }

  export interface RazorpayRefund {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    payment_id: string;
    status: string;
    [key: string]: unknown;
  }

  class Razorpay {
    constructor(options: RazorpayOptions);
    orders: {
      create(options: RazorpayOrderCreateOptions): Promise<RazorpayOrder>;
      fetch(orderId: string): Promise<RazorpayOrder>;
      all(options?: Record<string, unknown>): Promise<{ items: RazorpayOrder[] }>;
    };
    payments: {
      fetch(paymentId: string): Promise<RazorpayPayment>;
      capture(paymentId: string, amount: number, currency: string): Promise<RazorpayPayment>;
      refund(paymentId: string, options?: Record<string, unknown>): Promise<RazorpayRefund>;
    };
  }

  export default Razorpay;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
declare module 'mongoose' {
  interface Query<
    ResultType,
    DocType,
    THelpers = {},
    RawDocType = DocType,
    QueryOp = 'find',
    TVM = {},
  > {
    sort(
      arg?:
        | string
        | Record<string, 1 | -1 | 'asc' | 'desc' | number>
        | [string, 1 | -1 | 'asc' | 'desc' | number][]
        | undefined
        | null,
      options?: { override?: boolean },
    ): this;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
