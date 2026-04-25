export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  RAZORPAY = 'RAZORPAY',
  STRIPE = 'STRIPE',
  COD = 'COD',                  // Cash on Delivery
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  productImage: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;           // razorpay/stripe payment ID
  deliveryAddress?: string;
  sellerContactShared: boolean; // seller can share contact after order confirmed
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  totalAmount: number;
}

export interface CartItem {
  productId: string;
  productTitle: string;
  productImage: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
}

export interface CreateOrderInput {
  items: { productId: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  notes?: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}
