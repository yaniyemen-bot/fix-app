import { CurrencySettings } from './types';

export interface CurrencyPreset {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

/** عملات جاهزة للاختيار السريع - ويمكن دائمًا إدخال أي عملة يدويًا */
export const CURRENCY_PRESETS: CurrencyPreset[] = [
  { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', decimals: 2 },
  { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي', decimals: 2 },
  { code: 'USD', symbol: '$', name: 'دولار أمريكي', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'يورو', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'جنيه إسترليني', decimals: 2 },
  { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري', decimals: 2 },
  { code: 'IQD', symbol: 'د.ع', name: 'دينار عراقي', decimals: 0 },
  { code: 'JOD', symbol: 'د.أ', name: 'دينار أردني', decimals: 3 },
  { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي', decimals: 3 },
  { code: 'QAR', symbol: 'ر.ق', name: 'ريال قطري', decimals: 2 },
  { code: 'BHD', symbol: 'د.ب', name: 'دينار بحريني', decimals: 3 },
  { code: 'OMR', symbol: 'ر.ع', name: 'ريال عماني', decimals: 3 },
  { code: 'YER', symbol: 'ر.ي', name: 'ريال يمني', decimals: 0 },
  { code: 'SYP', symbol: 'ل.س', name: 'ليرة سورية', decimals: 0 },
  { code: 'LBP', symbol: 'ل.ل', name: 'ليرة لبنانية', decimals: 0 },
  { code: 'LYD', symbol: 'د.ل', name: 'دينار ليبي', decimals: 3 },
  { code: 'TND', symbol: 'د.ت', name: 'دينار تونسي', decimals: 3 },
  { code: 'DZD', symbol: 'د.ج', name: 'دينار جزائري', decimals: 2 },
  { code: 'MAD', symbol: 'د.م', name: 'درهم مغربي', decimals: 2 },
  { code: 'SDG', symbol: 'ج.س', name: 'جنيه سوداني', decimals: 2 },
  { code: 'TRY', symbol: '₺', name: 'ليرة تركية', decimals: 2 },
  { code: 'INR', symbol: '₹', name: 'روبية هندية', decimals: 2 },
];

export const DEFAULT_CURRENCY: CurrencySettings = {
  code: 'SAR',
  symbol: 'ر.س',
  name: 'ريال سعودي',
  decimals: 2,
  placement: 'after',
  thousands: ',',
  decimalSep: '.',
  preset: 'SAR',
};

export function currencyFromPreset(preset: CurrencyPreset): CurrencySettings {
  return {
    code: preset.code,
    symbol: preset.symbol,
    name: preset.name,
    decimals: preset.decimals,
    placement: 'after',
    thousands: ',',
    decimalSep: '.',
    preset: preset.code,
  };
}

export const THOUSAND_SEPARATORS: { value: string; label: string }[] = [
  { value: ',', label: 'فاصلة , ' },
  { value: '.', label: 'نقطة . ' },
  { value: '٬', label: 'فاصلة عربية ٬' },
  { value: ' ', label: 'مسافة' },
  { value: "'", label: "شرطة ' " },
];

export const DECIMAL_SEPARATORS: { value: string; label: string }[] = [
  { value: '.', label: 'نقطة .' },
  { value: ',', label: 'فاصلة ,' },
  { value: '٫', label: 'فاصلة عشرية عربية ٫' },
];
