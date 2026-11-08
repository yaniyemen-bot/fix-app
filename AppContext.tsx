import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertItem,
  AppData,
  AppUser,
  Company,
  CurrencySettings,
  ID,
  Invoice,
  InvoiceStatus,
  Role,
  Settings,
  Work,
} from '../lib/types';
import { DEFAULT_SETTINGS, clearData, loadData, saveData } from '../lib/storage';
import { buildSeedData, nextInvoiceNumber } from '../lib/seed';
import {
  addDays,
  addMonthsToKey,
  currentMonthKey,
  daysBetween,
  formatMoney,
  lastMonthKeys,
  monthKeyOf,
  monthLabel,
  todayISO,
  uid,
} from '../lib/format';

// ================= التعريفات المالية الجديدة مدمجة ومحكمة =================
export interface CashFlow {
  id: string;
  type: 'income' | 'expense';
  details: string;
  amount: number;
  date: string;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  type: 'receipt' | 'payment';
  invoiceId?: string;
  companyId?: string;
  amount: number;
  date: string;
  description: string;
}

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

interface AppContextValue {
  ready: boolean;
  companies: Company[];
  works: Work[];
  invoices: Invoice[];
  cashFlows: CashFlow[]; // مضاف حديثاً
  vouchers: Voucher[];   // مضاف حديثاً
  settings: Settings;
  users: AppUser[];
  currentUser: AppUser;
  role: Role;
  currency: CurrencySettings;
  alerts: AlertItem[];
  toast: ToastState | null;
  showToast: (message: string, tone?: ToastState['tone']) => void;
  setCurrentUserId: (id: ID) => void;
  // companies
  saveCompany: (input: Partial<Company> & { name: string; phone: string }, existingId?: ID) => Company;
  deleteCompany: (id: ID) => void;
  // works
  saveWork: (input: Omit<Work, 'id' | 'createdAt' | 'invoiceId'>, existingId?: ID) => Work;
  deleteWork: (id: ID) => void;
  unlinkWork: (id: ID) => void;
  // invoices
  createInvoice: (input: {
    companyId: ID;
    periodStart: string;
    periodEnd: string;
    workIds: ID[];
    discount: number;
    taxRate: number;
    notes: string;
    status: InvoiceStatus;
    issueDate?: string;
    dueDate?: string;
  }) => Invoice | null;
  setInvoiceStatus: (id: ID, status: InvoiceStatus) => void;
  updateInvoiceNotes: (id: ID, notes: string) => void;
  deleteInvoice: (id: ID) => void;
  // المالية والسندات مضاف حديثاً
  addCashFlow: (cashFlow: Omit<CashFlow, 'id'>) => void;
  addVoucherAndUpdateInvoice: (voucher: Omit<Voucher, 'id' | 'voucherNumber'>, invoiceId?: string) => void;
  // settings
  updateSettings: (patch: Partial<Settings>) => void;
  updateCurrency: (currency: CurrencySettings) => void;
  // المسؤولون
  addUser: (name: string, role: Role) => AppUser;
  updateUser: (id: ID, patch: { name?: string; role?: Role }) => boolean;
  deleteUser: (id: ID) => boolean;
  clearAllData: () => void;
  // helpers
  companyById: (id: ID) => Company | undefined;
  worksOfCompany: (id: ID) => Work[];
  invoicesOfCompany: (id: ID) => Invoice[];
  unbilledWorks: (companyId?: ID, periodKey?: string) => Work[];
  invoiceItems: (invoice: Invoice) => Work[];
  workTotal: (w: Work) => number;
}

const AppContext = createContext<AppContextValue | null>(null);

const FALLBACK_USER: AppUser = { id: 'u_manager', name: 'المدير', role: 'manager' };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  
  // الحالات المحدثة مع دعم مصفوفات الحسابات والسندات
  const [data, setData] = useState<AppData & { cashFlows?: CashFlow[]; vouchers?: Voucher[] }>(() => ({
    companies: [],
    works: [],
    invoices: [],
    settings: DEFAULT_SETTINGS,
    users: [],
    currentUserId: '',
    cashFlows: [],
    vouchers: [],
  }));

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedOnce = useRef(false);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await loadData();
      if (!alive) return;
      if (stored && stored.companies.length >= 0 && stored.users.length) {
        // حماية البيانات القديمة وإضافة المصفوفات الجديدة في حال لم تكن موجودة بالتخزين
        setData({
          ...stored,
          cashFlows: stored.cashFlows || [],
          vouchers: stored.vouchers || [],
          invoices: (stored.invoices || []).map((inv: any) => ({
            ...inv,
            paidAmount: inv.paidAmount !== undefined ? inv.paidAmount : (inv.status === 'paid' ? inv.total : 0),
            remainingAmount: inv.remainingAmount !== undefined ? inv.remainingAmount : (inv.status === 'paid' ? 0 : inv.total),
            paymentStatus: inv.paymentStatus !== undefined ? inv.paymentStatus : (inv.status === 'paid' ? 'paid' : 'unpaid'),
          })),
        });
      } else {
        const seeded = buildSeedData();
        const initialData = { ...seeded, cashFlows: [], vouchers: [] };
        setData(initialData);
        await saveData(initialData);
      }
      loadedOnce.current = true;
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!loadedOnce.current) return;
    saveData(data);
  }, [data]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((message: string, tone: ToastState['tone'] = 'success') => {
    const id = Date.now();
    setToast({ id, message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, 2600);
  }, []);

  const currentUser = useMemo(
    () => data.users.find((u) => u.id === data.currentUserId) ?? data.users[0] ?? FALLBACK_USER,
    [data.users, data.currentUserId]
  );

  const currency = data.settings.currency ?? DEFAULT_SETTINGS.currency;

  const companyById = useCallback(
    (id: ID) => data.companies.find((c) => c.id === id),
    [data.companies]
  );

  const worksOfCompany = useCallback(
    (id: ID) => data.works.filter((w) => w.companyId === id).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.works]
  );

  const invoicesOfCompany = useCallback(
    (id: ID) => data.invoices.filter((i) => i.companyId === id).sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)),
    [data.invoices]
  );

  const unbilledWorks = useCallback(
    (companyId?: ID, periodKey?: string) =>
      data.works
        .filter((w) => !w.invoiceId)
        .filter((w) => (companyId ? w.companyId === companyId : true))
        .filter((w) => (periodKey ? monthKeyOf(w.date) === periodKey : true))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.works]
  );

  const invoiceItems = useCallback(
    (invoice: Invoice) =>
      invoice.workIds
        .map((id) => data.works.find((w) => w.id === id))
        .filter(Boolean)
        .sort((a, b) => ((a as Work).date < (b as Work).date ? -1 : 1)) as Work[],
    [data.works]
  );

  const workTotal = useCallback((w: Work) => (Number(w.quantity) || 0) * (Number(w.unitPrice) || 0), []);

  const setCurrentUserId = useCallback((id: ID) => {
    setData((d) => ({ ...d, currentUserId: id }));
  }, []);

  const saveCompany = useCallback(
    (input: Partial<Company> & { name: string; phone: string }, existingId?: ID): Company => {
      const now = todayISO();
      if (existingId) {
        const existing = dataRef.current.companies.find((c) => c.id === existingId);
        const updated: Company = existing
          ? { ...existing, ...input, id: existing.id, createdAt: existing.createdAt }
          : {
              id: existingId,
              name: input.name,
              phone: input.phone ?? '',
              address: input.address ?? '',
              email: input.email ?? '',
              taxNumber: input.taxNumber ?? '',
              notes: input.notes ?? '',
              createdAt: now,
            };
        setData((d) => ({ ...d, companies: d.companies.map((c) => (c.id === existingId ? updated : c)) }));
        return updated;
      }
      const company: Company = {
        id: uid('c'),
        name: input.name,
        phone: input.phone ?? '',
        address: input.address ?? '',
        email: input.email ?? '',
        taxNumber: input.taxNumber ?? '',
        notes: input.notes ?? '',
        createdAt: now,
      };
      setData((d) => ({ ...d, companies: [company, ...d.companies] }));
      return company;
    },
    []
  );

  const deleteCompany = useCallback((id: ID) => {
    setData((d) => ({
      ...d,
      companies: d.companies.filter((c) => c.id !== id),
      works: d.works.filter((w) => w.companyId !== id),
      invoices: d.invoices.filter((i) => i.companyId !== id),
    }));
  }, []);

  const saveWork = useCallback(
    (input: Omit<Work, 'id' | 'createdAt' | 'invoiceId'>, existingId?: ID): Work => {
      const now = todayISO();
      if (existingId) {
        const existing = dataRef.current.works.find((w) => w.id === existingId);
        const updated: Work = existing
          ? { ...existing, ...input, id: existing.id, createdAt: existing.createdAt, invoiceId: existing.invoiceId }
          : { ...input, id: existingId, createdAt: now, invoiceId: null };
        setData((d) => ({ ...d, works: d.works.map((w) => (w.id === existingId ? updated : w)) }));
        return updated;
      }
      const work: Work = { ...input, id: uid('w'), createdAt: now, invoiceId: null };
      setData((d) => ({ ...d, works: [work, ...d.works] }));
      return work;
    },
    []
  );

  const deleteWork = useCallback((id: ID) => {
    setData((d) => ({
      ...d,
      works: d.works.filter((w) => w.id !== id),
      invoices: d.invoices.map((inv) =>
        inv.workIds.includes(id) ? { ...inv, workIds: inv.workIds.filter((x) => x !== id) } : inv
      ),
    }));
