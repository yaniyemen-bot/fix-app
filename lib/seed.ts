import { AppData, AppUser, Company, Invoice, InvoiceStatus, Work } from './types';
import { DEFAULT_SETTINGS } from './storage';
import { addDays, addMonthsToKey, currentMonthKey, monthRange, pad, toISODate, uid } from './format';

/** مولّد أرقام ثابت لضمان بيانات تجريبية متناسقة */
function makeRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const UNITS = ['يوم', 'ساعة', 'متر', 'متر مربع', 'طن', 'قطعة', 'خدمة', 'رحلة', 'شهر', 'كمية'];

export const WORK_TYPES = [
  'توريد مواد',
  'أعمال حفر',
  'صب خرسانة',
  'صيانة دورية',
  'نقل معدات',
  'تركيب كهروميكانيك',
  'أعمال دهان',
  'تشطيبات',
];

const COMPANIES_SEED: Omit<Company, 'id' | 'createdAt'>[] = [
  {
    name: 'شركة النور للمقاولات',
    phone: '0551234567',
    address: 'الرياض - حي العليا - شارع التحلية',
    email: 'info@alnoor-contracting.com',
    taxNumber: '3004567890120003',
    notes: 'عميل رئيسي - الدفع بشيكات آجلة 30 يوم',
  },
  {
    name: 'مؤسسة البناء الحديث',
    phone: '0567891234',
    address: 'جدة - حي الروضة - طريق الملك عبدالعزيز',
    email: 'accounts@modern-build.sa',
    taxNumber: '3009876543210003',
    notes: 'يطلب فاتورة ضريبية مع كل دفعة',
  },
  {
    name: 'شركة الإعمار الخليجية',
    phone: '0509876543',
    address: 'الدمام - حي الشاطئ',
    email: 'gulf.emar@example.com',
    taxNumber: '3012345098760003',
    notes: '',
  },
  {
    name: 'مجمع الواحة التجاري',
    phone: '0544433221',
    address: 'مكة المكرمة - حي العزيزية',
    email: 'oasis.mall@example.com',
    taxNumber: '3005556667770003',
    notes: 'أعمال صيانة شهرية بعقد سنوي',
  },
  {
    name: 'شركة المسار للهندسة',
    phone: '0533322114',
    address: 'المدينة المنورة - حي قباء',
    email: '',
    taxNumber: '',
    notes: 'أعمال استشارية وتنفيذ جزئي',
  },
];

export function buildSeedData(): AppData {
  const rand = makeRandom(20261025);
  const today = new Date();
  const todayISO = toISODate(today);
  const thisMonth = currentMonthKey();

  const users: AppUser[] = [
    { id: 'u_manager', name: 'أبو عبدالله', role: 'manager' },
    { id: 'u_accountant', name: 'سلطان المحاسب', role: 'accountant' },
    { id: 'u_employee', name: 'فهد الميداني', role: 'employee' },
  ];

  const companies: Company[] = COMPANIES_SEED.map((c, i) => ({
    ...c,
    id: `c_${i + 1}`,
    createdAt: addDays(todayISO, -180 + i * 9),
  }));

  const works: Work[] = [];
  const invoices: Invoice[] = [];

  // أعمال لآخر 6 أشهر
  for (let back = 5; back >= 0; back--) {
    const key = addMonthsToKey(thisMonth, -back);
    const range = monthRange(key);
    companies.forEach((company, cIndex) => {
      const worksThisMonth = 2 + Math.floor(rand() * 3);
      for (let w = 0; w < worksThisMonth; w++) {
        const dayOffset = Math.floor(rand() * 27);
        const date = addDays(range.start, dayOffset);
        if (date > todayISO) continue;
        const quantity = 1 + Math.floor(rand() * 12);
        const unitPrice = [350, 500, 750, 900, 1200, 1500, 2200, 3000][Math.floor(rand() * 8)];
        works.push({
          id: `w_${key}_${cIndex}_${w}`,
          companyId: company.id,
          date,
          type: WORK_TYPES[Math.floor(rand() * WORK_TYPES.length)],
          quantity,
          unit: UNITS[Math.floor(rand() * UNITS.length)],
          unitPrice,
          notes: rand() > 0.75 ? 'تم التنفيذ بإشراف الموقع' : '',
          invoiceId: null,
          createdAt: date,
        });
      }
    });
  }

  // فواتير للأشهر السابقة (من -4 إلى -1)
  let counter = 1;
  for (let back = 4; back >= 1; back--) {
    const key = addMonthsToKey(thisMonth, -back);
    const range = monthRange(key);
    companies.slice(0, back === 1 ? 4 : 3).forEach((company, cIndex) => {
      const items = works.filter(
        (w) => w.companyId === company.id && w.date >= range.start && w.date <= range.end
      );
      if (!items.length) return;
      const subtotal = items.reduce((s, w) => s + w.quantity * w.unitPrice, 0);
      const discount = cIndex === 2 ? Math.round(subtotal * 0.05) : 0;
      const taxRate = DEFAULT_SETTINGS.defaultTaxRate;
      const taxAmount = Math.round((subtotal - discount) * (taxRate / 100) * 100) / 100;
      const total = Math.round((subtotal - discount + taxAmount) * 100) / 100;
      let status: InvoiceStatus = 'paid';
      if (back === 1) status = cIndex % 2 === 0 ? 'issued' : 'paid';
      if (back === 2 && cIndex === 2) status = 'issued';
      const issueDate = range.end;
      const dueDate = addDays(issueDate, 14);
      const id = `inv_${counter}`;
      const number = `INV-${key.replace('-', '')}-${pad(counter)}`;
      invoices.push({
        id,
        number,
        companyId: company.id,
        periodStart: range.start,
        periodEnd: range.end,
        issueDate,
        dueDate,
        workIds: items.map((i) => i.id),
        subtotal,
        discount,
        taxRate,
        taxAmount,
        total,
        status,
        notes: status === 'paid' ? 'تم السداد بتحويل بنكي' : 'بانتظار اعتماد العميل',
        createdAt: issueDate,
        paidAt: status === 'paid' ? addDays(issueDate, 5 + Math.floor(rand() * 8)) : null,
      });
      items.forEach((it) => {
        const target = works.find((w) => w.id === it.id);
        if (target) target.invoiceId = id;
      });
      counter++;
    });
  }

  // فاتورة متأخرة واحدة لإظهار التنبيهات
  if (invoices.length) {
    const late = invoices.find((i) => i.status === 'issued');
    if (late) {
      late.dueDate = addDays(todayISO, -12);
      late.issueDate = addDays(late.dueDate, -14);
    }
  }

  works.sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    companies,
    works,
    invoices,
    settings: { ...DEFAULT_SETTINGS },
    users,
    currentUserId: users[0].id,
  };
}

export function nextInvoiceNumber(invoices: Invoice[]): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}`;
  const sameMonth = invoices.filter((i) => i.number.includes(stamp)).length;
  return `INV-${stamp}-${pad(sameMonth + 1)}`;
}

export function newWorkId(): string {
  return uid('w');
}
