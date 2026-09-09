export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
  phone?: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  productCount?: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  categoryId: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  unit: string; // e.g. 'pcs', 'kg', 'box'
  supplier: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  totalSpent: number;
  ordersCount: number;
  creditBalance: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage or fixed
  total: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'TRANSFER';

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  subtotal: number;
  taxRate: number; // e.g. 0.08 for 8%
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  changeGiven: number;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  notes?: string;
  createdAt: string;
}

export type StockAdjustmentType = 'RESTOCK' | 'SALE' | 'DAMAGE' | 'RETURN' | 'AUDIT';

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockAdjustmentType;
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export type AppView =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'categories'
  | 'customers'
  | 'sales_history'
  | 'reports'
  | 'stock'
  | 'users'
  | 'java_architecture';
