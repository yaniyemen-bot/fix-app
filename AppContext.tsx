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
  const [data, setData] = useState<AppData>(() => ({
    companies: [],
    works: [],
    invoices: [],
    settings: DEFAULT_SETTINGS,
    users: [],
    currentUserId: '',
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
        setData(stored);
      } else {
        const seeded = buildSeedData();
        setData(seeded);
        await saveData(seeded);
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
  }, []);

  const unlinkWork = useCallback((id: ID) => {
    setData((d) => {
      const work = d.works.find((w) => w.id === id);
      if (!work || !work.invoiceId) return d;
      const invoiceId = work.invoiceId;
      const invoice = d.invoices.find((i) => i.id === invoiceId);
      const remainingIds = invoice ? invoice.workIds.filter((x) => x !== id) : [];
      const remainingWorks = remainingIds
        .map((wid) => d.works.find((w) => w.id === wid))
        .filter(Boolean) as Work[];
      const subtotal = remainingWorks.reduce((s, w) => s + w.quantity * w.unitPrice, 0);
      return {
        ...d,
        works: d.works.map((w) => (w.id === id ? { ...w, invoiceId: null } : w)),
        invoices: invoice
          ? d.invoices.map((i) => {
              if (i.id !== invoiceId) return i;
              const discount = Math.min(i.discount, subtotal);
              const taxAmount = Math.round((subtotal - discount) * (i.taxRate / 100) * 100) / 100;
              return {
                ...i,
                workIds: remainingIds,
                subtotal,
                discount,
                taxAmount,
                total: Math.round((subtotal - discount + taxAmount) * 100) / 100,
              };
            })
          : d.invoices,
      };
    });
  }, []);

  const createInvoice = useCallback<AppContextValue['createInvoice']>((input) => {
    if (!input.workIds.length) return null;
    const d = dataRef.current;
    const items = input.workIds.map((id) => d.works.find((w) => w.id === id)).filter(Boolean) as Work[];
    if (!items.length) return null;
    const subtotal = items.reduce((s, w) => s + (Number(w.quantity) || 0) * (Number(w.unitPrice) || 0), 0);
    const discount = Math.max(0, Math.min(input.discount || 0, subtotal));
    const taxRate = Math.max(0, Number(input.taxRate) || 0);
    const taxAmount = Math.round((subtotal - discount) * (taxRate / 100) * 100) / 100;
    const total = Math.round((subtotal - discount + taxAmount) * 100) / 100;
    const issueDate = input.issueDate ?? todayISO();
    const dueDate = input.dueDate ?? addDays(issueDate, d.settings.paymentTermsDays || 14);
    const invoice: Invoice = {
      id: uid('inv'),
      number: nextInvoiceNumber(d.invoices),
      companyId: input.companyId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      issueDate,
      dueDate,
      workIds: input.workIds,
      subtotal,
      discount,
      taxRate,
      taxAmount,
      total,
      status: input.status,
      notes: input.notes,
      createdAt: todayISO(),
      paidAt: input.status === 'paid' ? todayISO() : null,
    };
    setData((prev) => ({
      ...prev,
      invoices: [invoice, ...prev.invoices],
      works: prev.works.map((w) => (input.workIds.includes(w.id) ? { ...w, invoiceId: invoice.id } : w)),
    }));
    dataRef.current = {
      ...dataRef.current,
      invoices: [invoice, ...dataRef.current.invoices],
      works: dataRef.current.works.map((w) => (input.workIds.includes(w.id) ? { ...w, invoiceId: invoice.id } : w)),
    };
    return invoice;
  }, []);

  const setInvoiceStatus = useCallback((id: ID, status: InvoiceStatus) => {
    setData((d) => ({
      ...d,
      invoices: d.invoices.map((i) =>
        i.id === id
          ? { ...i, status, paidAt: status === 'paid' ? i.paidAt ?? todayISO() : null }
          : i
      ),
    }));
  }, []);

  const updateInvoiceNotes = useCallback((id: ID, notes: string) => {
    setData((d) => ({
      ...d,
      invoices: d.invoices.map((i) => (i.id === id ? { ...i, notes } : i)),
    }));
  }, []);

  const deleteInvoice = useCallback((id: ID) => {
    setData((d) => ({
      ...d,
      invoices: d.invoices.filter((i) => i.id !== id),
      works: d.works.map((w) => (w.invoiceId === id ? { ...w, invoiceId: null } : w)),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const updateCurrency = useCallback((next: CurrencySettings) => {
    setData((d) => ({ ...d, settings: { ...d.settings, currency: next } }));
  }, []);

  const addUser = useCallback((name: string, role: Role): AppUser => {
    const user: AppUser = { id: uid('u'), name: name.trim(), role };
    setData((d) => ({ ...d, users: [...d.users, user] }));
    dataRef.current = { ...dataRef.current, users: [...dataRef.current.users, user] };
    return user;
  }, []);

  const updateUser = useCallback((id: ID, patch: { name?: string; role?: Role }): boolean => {
    const users = dataRef.current.users;
    const target = users.find((u) => u.id === id);
    if (!target) return false;
    const managers = users.filter((u) => u.role === 'manager').length;
    // حماية دور المدير: لا يمكن تجريد آخر مدير من صلاحياته الكاملة
    if (target.role === 'manager' && managers <= 1 && patch.role && patch.role !== 'manager') return false;
    const nextUsers = users.map((u) =>
      u.id === id
        ? {
            ...u,
            name: patch.name !== undefined && patch.name.trim() ? patch.name.trim() : u.name,
            role: patch.role ?? u.role,
          }
        : u
    );
    setData((d) => ({ ...d, users: nextUsers }));
    dataRef.current = { ...dataRef.current, users: nextUsers };
    return true;
  }, []);

  const deleteUser = useCallback((id: ID): boolean => {
    const current = dataRef.current.users;
    if (current.length <= 1) return false;
    const target = current.find((u) => u.id === id);
    const managers = current.filter((u) => u.role === 'manager').length;
    // لا يمكن حذف المدير الوحيد حتى تبقى إدارة التطبيق متاحة بالكامل
    if (target?.role === 'manager' && managers <= 1) return false;
    const remaining = current.filter((u) => u.id !== id);
    const nextId = dataRef.current.currentUserId === id ? remaining[0].id : dataRef.current.currentUserId;
    setData((d) => ({ ...d, users: remaining, currentUserId: d.currentUserId === id ? nextId : d.currentUserId }));
    dataRef.current = { ...dataRef.current, users: remaining, currentUserId: nextId };
    return true;
  }, []);

  const clearAllData = useCallback(() => {
    clearData();
    setData((d) => ({
      companies: [],
      works: [],
      invoices: [],
      settings: d.settings,
      users: d.users.length ? d.users : buildSeedData().users,
      currentUserId: d.currentUserId,
    }));
  }, []);

  const alerts = useMemo<AlertItem[]>(() => {
    const today = todayISO();
    const list: AlertItem[] = [];
    const monthKey = currentMonthKey();

    data.invoices
      .filter((i) => i.status === 'issued' && i.dueDate < today)
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
      .forEach((i) => {
        const company = data.companies.find((c) => c.id === i.companyId);
        list.push({
          id: `overdue_${i.id}`,
          kind: 'overdue',
          severity: 'danger',
          title: `فاتورة متأخرة ${i.number}`,
          body: `${company?.name ?? 'عميل'} • متأخرة ${Math.abs(daysBetween(i.dueDate, today))} يوم • ${formatMoney(
            i.total,
            currency
          )}`,
          invoiceId: i.id,
          companyId: i.companyId,
          amount: i.total,
        });
      });

    data.invoices
      .filter((i) => i.status === 'issued' && i.dueDate >= today)
      .forEach((i) => {
        const company = data.companies.find((c) => c.id === i.companyId);
        list.push({
          id: `unpaid_${i.id}`,
          kind: 'unpaid',
          severity: 'warning',
          title: `فاتورة بانتظار التحصيل ${i.number}`,
          body: `${company?.name ?? 'عميل'} • الاستحقاق ${i.dueDate} • ${formatMoney(i.total, currency)}`,
          invoiceId: i.id,
          companyId: i.companyId,
          amount: i.total,
        });
      });

    data.invoices
      .filter((i) => i.status === 'draft')
      .forEach((i) => {
        const company = data.companies.find((c) => c.id === i.companyId);
        list.push({
          id: `draft_${i.id}`,
          kind: 'draft',
          severity: 'info',
          title: `مسودة فاتورة ${i.number}`,
          body: `${company?.name ?? 'عميل'} • بانتظار الإصدار • ${formatMoney(i.total, currency)}`,
          invoiceId: i.id,
          companyId: i.companyId,
          amount: i.total,
        });
      });

    const monthWorks = data.works.filter((w) => monthKeyOf(w.date) === monthKey);
    const monthRevenue = monthWorks.reduce((s, w) => s + (Number(w.quantity) || 0) * (Number(w.unitPrice) || 0), 0);
    const limit = data.settings.monthlyLimit || 0;
    if (limit > 0 && monthRevenue > limit) {
      list.push({
        id: 'limit_month',
        kind: 'limit',
        severity: 'warning',
        title: 'تجاوز الحد المالي الشهري',
        body: `إيراد ${monthLabel(monthKey)} بلغ ${formatMoney(monthRevenue, currency)} من حد ${formatMoney(
          limit,
          currency
        )}`,
        amount: monthRevenue,
      });
    }

    const unbilledByCompany = new Map<ID, { count: number; total: number }>();
    data.works
      .filter((w) => !w.invoiceId)
      .forEach((w) => {
        const entry = unbilledByCompany.get(w.companyId) ?? { count: 0, total: 0 };
        entry.count += 1;
        entry.total += (Number(w.quantity) || 0) * (Number(w.unitPrice) || 0);
        unbilledByCompany.set(w.companyId, entry);
      });
    unbilledByCompany.forEach((value, companyId) => {
      if (value.total <= 0) return;
      const company = data.companies.find((c) => c.id === companyId);
      list.push({
        id: `unbilled_${companyId}`,
        kind: 'unbilled',
        severity: 'info',
        title: `أعمال غير مفوترة - ${company?.name ?? 'عميل'}`,
        body: `${value.count} عمل بقيمة ${formatMoney(value.total, currency)} لم تُدرج في فاتورة`,
        companyId,
        amount: value.total,
      });
    });

    const order = { danger: 0, warning: 1, info: 2 } as const;
    return list.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [data.invoices, data.works, data.companies, data.settings.monthlyLimit, currency]);

  const value: AppContextValue = {
    ready,
    companies: data.companies,
    works: data.works,
    invoices: data.invoices,
    settings: data.settings,
    users: data.users,
    currentUser,
    role: currentUser.role,
    currency,
    alerts,
    toast,
    showToast,
    setCurrentUserId,
    saveCompany,
    deleteCompany,
    saveWork,
    deleteWork,
    unlinkWork,
    createInvoice,
    setInvoiceStatus,
    updateInvoiceNotes,
    deleteInvoice,
    updateSettings,
    updateCurrency,
    addUser,
    updateUser,
    deleteUser,
    clearAllData,
    companyById,
    worksOfCompany,
    invoicesOfCompany,
    unbilledWorks,
    invoiceItems,
    workTotal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

/** مؤشرات مالية محسوبة جاهزة للاستخدام في الشاشات */
export function useMetrics() {
  const { works, invoices, currency, settings, workTotal } = useApp();
  return useMemo(() => {
    const monthKey = currentMonthKey();
    const keys6 = lastMonthKeys(6);
    const monthWorks = works.filter((w) => monthKeyOf(w.date) === monthKey);
    const monthRevenue = monthWorks.reduce((s, w) => s + workTotal(w), 0);
    const today = todayISO();
    const todayWorks = works.filter((w) => w.date === today);
    const outstanding = invoices.filter((i) => i.status === 'issued');
    const outstandingTotal = outstanding.reduce((s, i) => s + i.total, 0);
    const overdue = outstanding.filter((i) => i.dueDate < today);
    const overdueTotal = overdue.reduce((s, i) => s + i.total, 0);
    const collected = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
    const unbilled = works.filter((w) => !w.invoiceId);
    const unbilledTotal = unbilled.reduce((s, w) => s + workTotal(w), 0);
    const series = keys6.map((k) => ({
      key: k,
      label: monthLabel(k),
      value: works.filter((w) => monthKeyOf(w.date) === k).reduce((s, w) => s + workTotal(w), 0),
    }));
    const topClients = keys6
      .slice(-3)
      .flatMap((k) => works.filter((w) => monthKeyOf(w.date) === k))
      .reduce<{ id: ID; total: number; count: number }[]>((acc, w) => {
        const found = acc.find((a) => a.id === w.companyId);
        if (found) {
          found.total += workTotal(w);
          found.count += 1;
        } else {
          acc.push({ id: w.companyId, total: workTotal(w), count: 1 });
        }
        return acc;
      }, [])
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      monthKey,
      monthLabel: monthLabel(monthKey),
      monthRevenue,
      monthWorksCount: monthWorks.length,
      todayWorks,
      todayRevenue: todayWorks.reduce((s, w) => s + workTotal(w), 0),
      outstanding,
      outstandingTotal,
      overdue,
      overdueTotal,
      collected,
      totalInvoiced,
      collectionRate: totalInvoiced ? Math.round((collected / totalInvoiced) * 100) : 0,
      averageInvoice: invoices.length ? totalInvoiced / invoices.length : 0,
      unbilled,
      unbilledTotal,
      series,
      topClients,
      limit: settings.monthlyLimit,
      limitUsedPct: settings.monthlyLimit ? Math.min(100, Math.round((monthRevenue / settings.monthlyLimit) * 100)) : 0,
      currency,
      allRevenue: works.reduce((s, w) => s + workTotal(w), 0),
    };
  }, [works, invoices, currency, settings.monthlyLimit, workTotal]);
}

export { addMonthsToKey, currentMonthKey, monthLabel };
