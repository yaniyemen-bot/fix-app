import { Role } from './types';

export type PermissionKey =
  | 'works.view'
  | 'works.create'
  | 'works.edit'
  | 'works.delete'
  | 'invoices.view'
  | 'invoices.create'
  | 'invoices.edit'
  | 'invoices.delete'
  | 'companies.view'
  | 'companies.create'
  | 'companies.edit'
  | 'companies.delete'
  | 'reports.view'
  | 'settings.edit'
  | 'users.manage'
  | 'export.data';

export const ROLE_LABELS: Record<Role, string> = {
  manager: 'مدير',
  accountant: 'محاسب',
  employee: 'موظف',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  manager: 'إدارة كاملة للتطبيق: المسؤولون، الإعدادات، العملة، الحذف، التقارير، التصدير، والبيانات',
  accountant: 'الأعمال والفواتير والشركات والتقارير بدون الإعدادات',
  employee: 'تسجيل الأعمال اليومية والاطلاع على شركاته فقط',
};

/** المدير يملك كل الصلاحيات دائمًا */
export function isManager(role: Role): boolean {
  return role === 'manager';
}

const MATRIX: Record<Role, Record<PermissionKey, boolean>> = {
  manager: {
    'works.view': true,
    'works.create': true,
    'works.edit': true,
    'works.delete': true,
    'invoices.view': true,
    'invoices.create': true,
    'invoices.edit': true,
    'invoices.delete': true,
    'companies.view': true,
    'companies.create': true,
    'companies.edit': true,
    'companies.delete': true,
    'reports.view': true,
    'settings.edit': true,
    'users.manage': true,
    'export.data': true,
  },
  accountant: {
    'works.view': true,
    'works.create': true,
    'works.edit': true,
    'works.delete': false,
    'invoices.view': true,
    'invoices.create': true,
    'invoices.edit': true,
    'invoices.delete': false,
    'companies.view': true,
    'companies.create': true,
    'companies.edit': true,
    'companies.delete': false,
    'reports.view': true,
    'settings.edit': false,
    'users.manage': false,
    'export.data': true,
  },
  employee: {
    'works.view': true,
    'works.create': true,
    'works.edit': true,
    'works.delete': false,
    'invoices.view': true,
    'invoices.create': false,
    'invoices.edit': false,
    'invoices.delete': false,
    'companies.view': true,
    'companies.create': false,
    'companies.edit': false,
    'companies.delete': false,
    'reports.view': false,
    'settings.edit': false,
    'users.manage': false,
    'export.data': false,
  },
};

export function can(role: Role, key: PermissionKey): boolean {
  return MATRIX[role]?.[key] ?? false;
}

export function rolePermissions(role: Role): { key: PermissionKey; label: string; allowed: boolean }[] {
  const labels: Record<PermissionKey, string> = {
    'works.view': 'عرض الأعمال اليومية',
    'works.create': 'إضافة أعمال',
    'works.edit': 'تعديل الأعمال',
    'works.delete': 'حذف الأعمال',
    'invoices.view': 'عرض الفواتير',
    'invoices.create': 'إنشاء الفواتير',
    'invoices.edit': 'تعديل حالة الفواتير',
    'invoices.delete': 'حذف الفواتير',
    'companies.view': 'عرض الشركات والعملاء',
    'companies.create': 'إضافة شركات',
    'companies.edit': 'تعديل الشركات',
    'companies.delete': 'حذف الشركات',
    'reports.view': 'التقارير والتحليل المالي',
    'settings.edit': 'تعديل الإعدادات والعملة',
    'users.manage': 'إدارة المستخدمين',
    'export.data': 'تصدير البيانات والنسخ الاحتياطي',
  };
  return (Object.keys(labels) as PermissionKey[]).map((key) => ({
    key,
    label: labels[key],
    allowed: can(role, key),
  }));
}
