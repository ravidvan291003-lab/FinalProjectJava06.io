import {
  User,
  Category,
  Product,
  Customer,
  Sale,
  StockLog,
  CartItem,
  PaymentMethod,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_STOCK_LOGS,
} from '../data/mockData';

const STORAGE_KEYS = {
  USERS: 'pos_users_v1',
  CURRENT_USER: 'pos_current_user_v1',
  CATEGORIES: 'pos_categories_v1',
  PRODUCTS: 'pos_products_v1',
  CUSTOMERS: 'pos_customers_v1',
  SALES: 'pos_sales_v1',
  STOCK_LOGS: 'pos_stock_logs_v1',
  SESSION_START: 'pos_session_start_v1',
};

function getStoredItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const storageService = {
  // Session / Auth
  getCurrentUser(): User {
    const user = getStoredItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!user) {
      // Default to Admin Alexandra Vance
      setStoredItem(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
      setStoredItem(STORAGE_KEYS.SESSION_START, new Date().toISOString());
      return INITIAL_USERS[0];
    }
    return user;
  },

  setCurrentUser(user: User): void {
    setStoredItem(STORAGE_KEYS.CURRENT_USER, user);
    setStoredItem(STORAGE_KEYS.SESSION_START, new Date().toISOString());
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION_START);
  },

  getSessionStart(): string {
    let start = localStorage.getItem(STORAGE_KEYS.SESSION_START);
    if (!start) {
      start = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.SESSION_START, start);
    }
    return start;
  },

  // Users
  getUsers(): User[] {
    return getStoredItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    setStoredItem(STORAGE_KEYS.USERS, users);
  },

  deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId);
    setStoredItem(STORAGE_KEYS.USERS, users);
  },

  // Categories
  getCategories(): Category[] {
    return getStoredItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },

  saveCategory(cat: Category): void {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === cat.id);
    if (index >= 0) {
      categories[index] = cat;
    } else {
      categories.unshift(cat);
    }
    setStoredItem(STORAGE_KEYS.CATEGORIES, categories);
  },

  deleteCategory(catId: string): void {
    const categories = this.getCategories().filter((c) => c.id !== catId);
    setStoredItem(STORAGE_KEYS.CATEGORIES, categories);
  },

  // Products
  getProducts(): Product[] {
    return getStoredItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  saveProduct(prod: Product): void {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === prod.id);
    const now = new Date().toISOString().split('T')[0];
    if (index >= 0) {
      products[index] = { ...prod, updatedAt: now };
    } else {
      products.unshift({ ...prod, createdAt: now, updatedAt: now });
    }
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  },

  deleteProduct(prodId: string): void {
    const products = this.getProducts().filter((p) => p.id !== prodId);
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  },

  // Customers
  getCustomers(): Customer[] {
    return getStoredItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },

  saveCustomer(cust: Customer): void {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === cust.id);
    if (index >= 0) {
      customers[index] = cust;
    } else {
      customers.unshift(cust);
    }
    setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
  },

  deleteCustomer(custId: string): void {
    const customers = this.getCustomers().filter((c) => c.id !== custId);
    setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
  },

  // Sales & Checkout
  getSales(): Sale[] {
    return getStoredItem<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  },

  createSale(params: {
    cart: CartItem[];
    customer?: Customer | null;
    paymentMethod: PaymentMethod;
    amountReceived: number;
    discountPercent?: number;
    taxRate?: number;
    notes?: string;
    cashier: User;
  }): Sale {
    const products = this.getProducts();
    const stockLogs = this.getStockLogs();
    const sales = this.getSales();
    const customers = this.getCustomers();

    const taxRate = params.taxRate ?? 0.08;
    const discountPercent = params.discountPercent ?? 0;

    let subtotal = 0;
    const saleItems = params.cart.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      subtotal += itemSubtotal;
      return {
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: item.product.costPrice,
        discount: item.discount,
        total: itemSubtotal,
      };
    });

    const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number((taxableAmount * taxRate).toFixed(2));
    const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

    const amountReceived = params.amountReceived > 0 ? params.amountReceived : totalAmount;
    const changeGiven = Math.max(0, Number((amountReceived - totalAmount).toFixed(2)));

    // Generate Invoice Number: INV-YYYY-SEQ
    const nextSeq = 100 + sales.length + 1;
    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}-${String(nextSeq).padStart(4, '0')}`;
    const dateFormatted = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      customerId: params.customer?.id,
      customerName: params.customer ? params.customer.name : 'Walk-in Customer',
      customerPhone: params.customer?.phone,
      cashierId: params.cashier.id,
      cashierName: params.cashier.name,
      items: saleItems,
      subtotal: Number(subtotal.toFixed(2)),
      taxRate,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod: params.paymentMethod,
      amountReceived,
      changeGiven,
      paymentStatus: 'PAID',
      notes: params.notes,
      createdAt: dateFormatted,
    };

    // 1. Deduct Stock & Append Stock Logs
    params.cart.forEach((cartItem) => {
      const prodIndex = products.findIndex((p) => p.id === cartItem.product.id);
      if (prodIndex >= 0) {
        const prevStock = products[prodIndex].stock;
        const newStock = Math.max(0, prevStock - cartItem.quantity);
        products[prodIndex].stock = newStock;

        stockLogs.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          productId: cartItem.product.id,
          productName: cartItem.product.name,
          sku: cartItem.product.sku,
          type: 'SALE',
          quantityChange: -cartItem.quantity,
          previousStock: prevStock,
          newStock,
          reason: `Sale ${invoiceNumber}`,
          userId: params.cashier.id,
          userName: params.cashier.name,
          createdAt: dateFormatted,
        });
      }
    });

    // 2. Update Customer Total Spent
    if (params.customer) {
      const custIndex = customers.findIndex((c) => c.id === params.customer?.id);
      if (custIndex >= 0) {
        customers[custIndex].totalSpent = Number((customers[custIndex].totalSpent + totalAmount).toFixed(2));
        customers[custIndex].ordersCount += 1;
        setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    // 3. Save updated collections
    sales.unshift(newSale);
    setStoredItem(STORAGE_KEYS.SALES, sales);
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
    setStoredItem(STORAGE_KEYS.STOCK_LOGS, stockLogs);

    return newSale;
  },

  // Stock Management & Adjustments
  getStockLogs(): StockLog[] {
    return getStoredItem<StockLog[]>(STORAGE_KEYS.STOCK_LOGS, INITIAL_STOCK_LOGS);
  },

  adjustStock(params: {
    productId: string;
    type: 'RESTOCK' | 'DAMAGE' | 'RETURN' | 'AUDIT';
    quantityChange: number; // positive or negative
    reason: string;
    user: User;
  }): void {
    const products = this.getProducts();
    const stockLogs = this.getStockLogs();
    const prodIndex = products.findIndex((p) => p.id === params.productId);
    if (prodIndex < 0) return;

    const target = products[prodIndex];
    const prevStock = target.stock;
    const newStock = Math.max(0, prevStock + params.quantityChange);
    target.stock = newStock;

    const now = new Date();
    const dateFormatted = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    stockLogs.unshift({
      id: `log-${Date.now()}`,
      productId: target.id,
      productName: target.name,
      sku: target.sku,
      type: params.type,
      quantityChange: params.quantityChange,
      previousStock: prevStock,
      newStock,
      reason: params.reason,
      userId: params.user.id,
      userName: params.user.name,
      createdAt: dateFormatted,
    });

    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
    setStoredItem(STORAGE_KEYS.STOCK_LOGS, stockLogs);
  },

  // Reset demo data
  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.STOCK_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SESSION_START);
  },
};
