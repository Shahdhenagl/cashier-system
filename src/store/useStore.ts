import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ─── Types ───────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  barcode: string;
  purchase_price: number;
  sale_price: number;
  stock_quantity: number;
  category_id: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface OrderItem extends Product {
  quantity: number;
  returned_quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  timestamp: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  paid_amount: number;
  type: 'sale' | 'payment';
  date: string;
  customer?: Customer;
}

export interface StoreSettings {
  name: string;
  currency: string;
  logo: string;
  taxRate: number;
  themeColor: string;
  address: string;
  phone: string;
  phone2: string;
}

// ─── Store Interface ──────────────────────────────────────────
interface CashierStore {
  storeSettings: StoreSettings;
  products: Product[];
  categories: Category[];
  customers: Customer[];
  cart: OrderItem[];
  orders: Order[];
  invoiceCounter: number;
  activeInvoiceId: string;
  isLoading: boolean;
  dbError: string | null;

  // Data loading
  loadAll: () => Promise<void>;

  // Cart
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Operations
  checkout: (total: number, customerDetails?: { name: string; phone: string }, paidAmount?: number, type?: 'sale' | 'payment') => Promise<string>;
  processReturn: (orderId: string, productId: string, returnQty: number) => Promise<boolean>;

  // Admin
  updateSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────
function mapSettings(row: Record<string, unknown>): StoreSettings {
  return {
    name: (row.name as string) ?? 'محلي',
    currency: (row.currency as string) ?? 'ج.م',
    logo: (row.logo as string) ?? '',
    taxRate: (row.tax_rate as number) ?? 0,
    themeColor: (row.theme_color as string) ?? '#4f46e5',
    address: (row.address as string) ?? '',
    phone: (row.phone as string) ?? '',
    phone2: (row.phone2 as string) ?? '',
  };
}

// ─── Store ───────────────────────────────────────────────────
export const useStore = create<CashierStore>((set, get) => ({
  storeSettings: {
    name: 'محل اللحوم الطازجة',
    currency: 'ج.م',
    logo: 'https://cdn-icons-png.flaticon.com/512/3143/3143641.png',
    taxRate: 0,
    themeColor: '#4f46e5',
    address: '',
    phone: '',
    phone2: '',
  },
  products: [],
  categories: [],
  customers: [],
  cart: [],
  orders: [],
  invoiceCounter: 1,
  activeInvoiceId: '1',
  isLoading: false,
  dbError: null,

  // ── Load all data from Supabase ────────────────────────────
  loadAll: async () => {
    set({ isLoading: true, dbError: null });
    try {
      const [settingsRes, categoriesRes, productsRes, customersRes, ordersRes, counterRes] =
        await Promise.all([
          supabase.from('store_settings').select('*').single(),
          supabase.from('categories').select('*').order('name'),
          supabase.from('products').select('*').order('name'),
          supabase.from('customers').select('*').order('created_at', { ascending: false }),
          supabase
            .from('orders')
            .select('*, customers(*), order_items(*, products(*))')
            .order('created_at', { ascending: false })
            .limit(200),
          supabase.from('invoice_counter').select('current_value').single(),
        ]);

      const settings = settingsRes.data ? mapSettings(settingsRes.data as Record<string, unknown>) : get().storeSettings;

      const customers: Customer[] = ((customersRes.data ?? []) as Record<string, unknown>[]).map((c) => ({
        id: c.id as string,
        name: c.name as string,
        phone: c.phone as string,
        timestamp: c.created_at as string,
      }));

      const orders: Order[] = ((ordersRes.data ?? []) as Record<string, unknown>[]).map((o) => {
        const custRow = o.customers as Record<string, unknown> | null;
        const itemRows = (o.order_items as Record<string, unknown>[]) ?? [];
        const items: OrderItem[] = itemRows.map((i) => {
          const prod = (i.products as Record<string, unknown>) ?? {};
          return {
            id: (i.product_id as string) ?? (i.id as string),
            name: (i.product_name as string) ?? (prod.name as string) ?? '',
            barcode: (prod.barcode as string) ?? '',
            purchase_price: (prod.purchase_price as number) ?? 0,
            sale_price: i.sale_price as number,
            stock_quantity: (prod.stock_quantity as number) ?? 0,
            category_id: (prod.category_id as string) ?? '',
            quantity: i.quantity as number,
            returned_quantity: (i.returned_quantity as number) ?? 0,
          };
        });
        return {
          id: o.id as string,
          total: o.total as number,
          paid_amount: (o.paid_amount as number) ?? (o.total as number),
          type: (o.type as string) as 'sale' | 'payment' ?? 'sale',
          date: o.created_at as string,
          items,
          customer: custRow
            ? { id: custRow.id as string, name: custRow.name as string, phone: custRow.phone as string, timestamp: custRow.created_at as string }
            : undefined,
        };
      });

      const counter = (counterRes.data as Record<string, unknown> | null)?.current_value as number ?? 1;

      set({
        storeSettings: settings,
        categories: (categoriesRes.data ?? []) as Category[],
        products: (productsRes.data ?? []) as unknown as Product[],
        customers,
        orders,
        invoiceCounter: counter,
        activeInvoiceId: counter.toString(),
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, dbError: String(err) });
    }
  },

  // ── Cart ───────────────────────────────────────────────────
  addToCart: (product) =>
    set((state) => {
      if (product.stock_quantity <= 0) return state;
      const existing = state.cart.find((i) => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return state;
        return { cart: state.cart.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)) };
      }
      return { cart: [...state.cart, { ...product, quantity: 1, returned_quantity: 0 }] };
    }),

  removeFromCart: (productId) => set((state) => ({ cart: state.cart.filter((i) => i.id !== productId) })),

  updateQuantity: (productId, quantity) =>
    set((state) => {
      const product = state.products.find((p) => p.id === productId);
      if (!product) return state;
      const validQty = Math.max(1, Math.min(quantity, product.stock_quantity));
      return { cart: state.cart.map((i) => (i.id === productId ? { ...i, quantity: validQty } : i)) };
    }),

  clearCart: () => set({ cart: [] }),

  // ── Checkout ───────────────────────────────────────────────
  checkout: async (total, customerDetails, paidAmount = total, type = 'sale') => {
    const state = get();
    if (state.cart.length === 0 && type !== 'payment') return state.activeInvoiceId;

    const invoiceId = state.activeInvoiceId;
    let customerId: string | null = null;
    let finalCustomer: Customer | undefined;

    // Upsert customer
    if (customerDetails?.phone.trim()) {
      const phone = customerDetails.phone.trim();
      const existing = state.customers.find((c) => c.phone === phone);
      if (existing) {
        customerId = existing.id;
        finalCustomer = existing;
      } else {
        const { data: newCust } = await supabase
          .from('customers')
          .insert({ name: customerDetails.name || 'بدون اسم', phone })
          .select()
          .single();
        if (newCust) {
          customerId = (newCust as Record<string, unknown>).id as string;
          finalCustomer = {
            id: customerId,
            name: (newCust as Record<string, unknown>).name as string,
            phone,
            timestamp: (newCust as Record<string, unknown>).created_at as string,
          };
        }
      }
    }

    // Insert order
    const { error: orderError } = await supabase.from('orders').insert({ 
      id: invoiceId, 
      total, 
      paid_amount: paidAmount,
      type,
      customer_id: customerId 
    });

    if (orderError) {
      console.error("Order Insert Error:", orderError);
      alert(`خطأ في الحفظ: ${orderError.message}`);
      return invoiceId; // Exit maybe? or throw
    }

    // Insert order items
    const itemsPayload = state.cart.map((item) => ({
      order_id: invoiceId,
      product_id: item.id,
      product_name: item.name,
      barcode: item.barcode,
      quantity: item.quantity,
      returned_quantity: 0,
      sale_price: item.sale_price,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
    if (itemsError) {
      console.error("Order Items Insert Error:", itemsError);
    }

    // Update stock
    for (const item of state.cart) {
      const newQty = (state.products.find((p) => p.id === item.id)?.stock_quantity ?? 0) - item.quantity;
      await supabase.from('products').update({ stock_quantity: Math.max(0, newQty) }).eq('id', item.id);
    }

    // Increment counter
    const nextCounter = state.invoiceCounter + 1;
    await supabase.from('invoice_counter').update({ current_value: nextCounter }).eq('id', 1);

    // Build new order for local state
    const newOrder: Order = {
      id: invoiceId,
      items: state.cart.map((i) => ({ ...i })),
      total,
      paid_amount: paidAmount,
      type,
      date: new Date().toISOString(),
      customer: finalCustomer,
    };

    const updatedProducts = state.products.map((p) => {
      const cartItem = state.cart.find((c) => c.id === p.id);
      return cartItem ? { ...p, stock_quantity: Math.max(0, p.stock_quantity - cartItem.quantity) } : p;
    });

    const updatedCustomers = finalCustomer && !state.customers.find((c) => c.id === finalCustomer!.id)
      ? [finalCustomer, ...state.customers]
      : state.customers;

    set({
      orders: [newOrder, ...state.orders],
      cart: [],
      products: updatedProducts,
      customers: updatedCustomers,
      invoiceCounter: nextCounter,
      activeInvoiceId: nextCounter.toString(),
    });

    return invoiceId;
  },

  // ── Returns ────────────────────────────────────────────────
  processReturn: async (orderId, productId, returnQty) => {
    const state = get();
    const orderIndex = state.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return false;

    const order = state.orders[orderIndex];
    const itemIndex = order.items.findIndex((i) => i.id === productId);
    if (itemIndex === -1) return false;

    const item = order.items[itemIndex];
    const available = item.quantity - item.returned_quantity;
    if (returnQty <= 0 || returnQty > available) return false;

    const newReturnedQty = item.returned_quantity + returnQty;

    // Update DB
    const orderItemRow = await supabase
      .from('order_items')
      .select('id, returned_quantity')
      .eq('order_id', orderId)
      .eq('product_id', productId)
      .single();

    if (orderItemRow.data) {
      await supabase
        .from('order_items')
        .update({ returned_quantity: newReturnedQty })
        .eq('id', (orderItemRow.data as Record<string, unknown>).id as string);
    }

    const product = state.products.find((p) => p.id === productId);
    if (product) {
      await supabase
        .from('products')
        .update({ stock_quantity: product.stock_quantity + returnQty })
        .eq('id', productId);
    }

    // Update local state
    const updatedItems = order.items.map((i, idx) =>
      idx === itemIndex ? { ...i, returned_quantity: newReturnedQty } : i
    );
    const updatedOrders = state.orders.map((o, idx) =>
      idx === orderIndex ? { ...o, items: updatedItems } : o
    );
    const updatedProducts = state.products.map((p) =>
      p.id === productId ? { ...p, stock_quantity: p.stock_quantity + returnQty } : p
    );

    set({ orders: updatedOrders, products: updatedProducts });
    return true;
  },

  // ── Admin ──────────────────────────────────────────────────
  updateSettings: async (newSettings) => {
    const mapped: Record<string, unknown> = {};
    if (newSettings.name !== undefined) mapped.name = newSettings.name;
    if (newSettings.currency !== undefined) mapped.currency = newSettings.currency;
    if (newSettings.logo !== undefined) mapped.logo = newSettings.logo;
    if (newSettings.taxRate !== undefined) mapped.tax_rate = newSettings.taxRate;
    if (newSettings.themeColor !== undefined) mapped.theme_color = newSettings.themeColor;
    if (newSettings.address !== undefined) mapped.address = newSettings.address;
    if (newSettings.phone !== undefined) mapped.phone = newSettings.phone;
    if (newSettings.phone2 !== undefined) mapped.phone2 = newSettings.phone2;

    await supabase.from('store_settings').update(mapped).eq('id', (await supabase.from('store_settings').select('id').single()).data?.id);
    set((state) => ({ storeSettings: { ...state.storeSettings, ...newSettings } }));
  },

  addProduct: async (product) => {
    const { data } = await supabase.from('products').insert(product).select().single();
    if (data) set((state) => ({ products: [data as unknown as Product, ...state.products] }));
  },

  updateProduct: async (id, updated) => {
    await supabase.from('products').update(updated).eq('id', id);
    set((state) => ({ products: state.products.map((p) => (p.id === id ? { ...p, ...updated } : p)) }));
  },

  deleteProduct: async (id) => {
    await supabase.from('products').delete().eq('id', id);
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
  },
}));
