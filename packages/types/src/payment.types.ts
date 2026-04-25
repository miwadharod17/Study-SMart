export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        email: string;
        contact: string;
      };
    };
  };
  created_at: number;
}

export interface StripeWebhookPayload {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      metadata: Record<string, string>;
    };
  };
}

export interface PaymentInitiateInput {
  orderId: string;
  amount: number;
  currency?: string;            // default INR
  notes?: Record<string, string>;
}

export interface PaymentVerifyInput {
  orderId: string;
  paymentId: string;
  signature?: string;           // razorpay signature
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  method: string;
  paidAt: Date;
}

export interface RefundInput {
  paymentId: string;
  amount?: number;              // partial refund if specified
  reason?: string;
}
