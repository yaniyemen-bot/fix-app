import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, CurrencySettings, Settings } from './types';
import { DEFAULT_CURRENCY } from './currencies';

const KEY = 'biz_invoices_manager_v1';

export const DEFAULT_SETTINGS: Settings = {
  businessName: 'مؤسسة الأفق للمقاولات',
  ownerName: 'أبو عبدالله',
  phone: '0555123456',
  taxNumber: '3001234567890003',
  address: 'الرياض - حي النرجس',
  currency: DEFAULT_CURRENCY,
  monthlyLimit: 150000,
  defaultTaxRate: 15,
  paymentTermsDays: 14,
  apkUrl: '',
};

function mergeCurrency(raw: any): CurrencySettings {
  const base = DEFAULT_CURRENCY;
  if (!raw || typeof raw !== 'object') return base;
  return {
    code: typeof raw.code === 'string' ? raw.code : base.code,
    symbol: typeof raw.symbol === 'string' ? raw.symbol : base.symbol,
    name: typeof raw.name === 'string' ? raw.name : base.name,
    decimals: typeof raw.decimals === 'number' ? Math.max(0, Math.min(4, raw.decimals)) : base.decimals,
    placement: raw.placement === 'before' ? 'before' : 'after',
    thousands: typeof raw.thousands === 'string' && raw.thousands.length ? raw.thousands : base.thousands,
    decimalSep:
      typeof raw.decimalSep === 'string' && raw.decimalSep.length ? raw.decimalSep : base.decimalSep,
    preset: typeof raw.preset === 'string' ? raw.preset : null,
  };
}

export function normalizeSettings(raw: any): Settings {
  const base = DEFAULT_SETTINGS;
  if (!raw || typeof raw !== 'object') return base;
  return {
    businessName: typeof raw.businessName === 'string' ? raw.businessName : base.businessName,
    ownerName: typeof raw.ownerName === 'string' ? raw.ownerName : base.ownerName,
    phone: typeof raw.phone === 'string' ? raw.phone : base.phone,
    taxNumber: typeof raw.taxNumber === 'string' ? raw.taxNumber : base.taxNumber,
    address: typeof raw.address === 'string' ? raw.address : base.address,
    currency: mergeCurrency(raw.currency),
    monthlyLimit: typeof raw.monthlyLimit === 'number' ? raw.monthlyLimit : base.monthlyLimit,
    defaultTaxRate: typeof raw.defaultTaxRate === 'number' ? raw.defaultTaxRate : base.defaultTaxRate,
    paymentTermsDays:
      typeof raw.paymentTermsDays === 'number' ? raw.paymentTermsDays : base.paymentTermsDays,
    apkUrl: typeof raw.apkUrl === 'string' ? raw.apkUrl : base.apkUrl,
  };
}

export async function loadData(): Promise<AppData | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      companies: Array.isArray(parsed.companies) ? parsed.companies : [],
      works: Array.isArray(parsed.works) ? parsed.works : [],
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
      settings: normalizeSettings(parsed.settings),
      users: Array.isArray(parsed.users) && parsed.users.length ? parsed.users : [],
      currentUserId: typeof parsed.currentUserId === 'string' ? parsed.currentUserId : '',
    };
  } catch {
    return null;
  }
}

export async function saveData(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}

export async function clearData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
