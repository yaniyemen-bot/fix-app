export type ID = string;

export type Role = 'manager' | 'accountant' | 'employee';

export interface AppUser {
  id: ID;
  name: string;
  role: Role;
}

export interface Company {
  id: ID;
  name: string;
  phone: string;
  address: string;
  email: string;
  taxNumber: string;
  notes: string;
  createdAt: string;
}

export interface Work {
  id: ID;
  companyId: ID;
  date: string; // YYYY-MM-DD
  type: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  notes: string;
  invoiceId: ID | null;
  createdAt: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid';

export interface Invoice {
  id: ID;
  number: string;
  companyId: ID;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  workIds: ID[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  notes: string;
  createdAt: string;
  paidAt: string | null;
}

export interface CurrencySettings {
  /** رمز العملة الدولي - قابل للكتابة اليدوية (SAR, USD, IQD ...) */
  code: string;
  /** رمز العملة المعروض - قابل للكتابة اليدوية (ر.س, $, د.ع ...) */
  symbol: string;
  /** اسم العملة - قابل للكتابة اليدوية */
  name: string;
  /** عدد الخانات العشرية 0-3 */
  decimals: number;
  /** موضع الرمز قبل أو بعد الرقم */
  placement: 'before' | 'after';
  /** فاصل الآلاف */
  thousands: string;
  /** فاصل الخانات العشرية */
  decimalSep: string;
  /** كود العملة الجاهزة المختارة، أو null عند الإدخال اليدوي */
  preset: string | null;
}

export interface Settings {
  businessName: string;
  ownerName: string;
  phone: string;
  taxNumber: string;
  address: string;
  currency: CurrencySettings;
  monthlyLimit: number;
  defaultTaxRate: number;
  paymentTermsDays: number;
  /** رابط مباشر لملف APK يستخدمه زر التحميل داخل التطبيق */
  apkUrl: string;
}

export interface AppData {
  companies: Company[];
  works: Work[];
  invoices: Invoice[];
  settings: Settings;
  users: AppUser[];
  currentUserId: ID;
}

export interface AlertItem {
  id: string;
  kind: 'overdue' | 'unpaid' | 'limit' | 'unbilled' | 'draft';
  title: string;
  body: string;
  severity: 'danger' | 'warning' | 'info';
  invoiceId?: ID;
  companyId?: ID;
  amount?: number;
}
