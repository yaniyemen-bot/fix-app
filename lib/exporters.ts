import { Linking, Platform, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import { escapeHtml, formatDateShort, formatMoney, formatQuantity, toCsv } from './format';
import { Company, CurrencySettings, Invoice, Settings, Work } from './types';

export const isWeb = Platform.OS === 'web';

/** تنزيل ملف نصي عبر المتصفح (ويب) */
export function downloadTextOnWeb(filename: string, content: string, mime = 'text/csv;charset=utf-8;'): boolean {
  if (!isWeb) return false;
  try {
    const blob = new Blob([`\ufeff${content}`], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1500);
    return true;
  } catch {
    return false;
  }
}

/** كتابة ملف نصي على الجهاز (Android / iOS) وإرجاع مساره */
export async function writeTextFileNative(filename: string, content: string): Promise<string | null> {
  if (isWeb) return null;
  try {
    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true, intermediates: true });
    file.write(content);
    return file.uri;
  } catch {
    return null;
  }
}

export async function shareFileNative(uri: string, mimeType: string, dialogTitle: string): Promise<boolean> {
  if (isWeb) return false;
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return false;
    await Sharing.shareAsync(uri, { mimeType, dialogTitle, UTI: mimeType });
    return true;
  } catch {
    return false;
  }
}

export type ExportResult = 'downloaded' | 'shared' | 'failed';

/** اسم ملف آمن من اسم المنشأة أو المسؤول */
export function safeFileName(name: string): string {
  const cleaned = (name || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40);
  return cleaned || 'export';
}

/** صفوف الترويسة الموحدة في كل ملفات التصدير: تحمل التسمية الجديدة من القائمة الإدارية */
export function exportMetaRows(
  settings: Settings,
  responsibleName: string,
  currency: CurrencySettings
): (string | number)[][] {
  return [
    ['المنشأة', settings.businessName],
    ['المسؤول', responsibleName],
    ['العملة', `${currency.name || currency.code} (${currency.code} ${currency.symbol})`],
    ['تاريخ التصدير', new Date().toISOString().slice(0, 10)],
    [],
  ];
}

/** تصدير CSV - تنزيل مباشر على الويب، أو مشاركة ملف على الجوال */
export async function exportCsv(filename: string, rows: (string | number | null | undefined)[][]): Promise<ExportResult> {
  const csv = toCsv(rows);
  if (isWeb) return downloadTextOnWeb(filename, csv) ? 'downloaded' : 'failed';
  const uri = await writeTextFileNative(filename, csv);
  if (!uri) return 'failed';
  const ok = await shareFileNative(uri, 'text/csv', `تصدير ${filename}`);
  return ok ? 'shared' : 'failed';
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

export async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (isWeb) {
    const ok = await copyToClipboard(text);
    return ok ? 'copied' : 'failed';
  }
  try {
    await Share.share({ message: text });
    return 'shared';
  } catch {
    return 'failed';
  }
}

export async function printHtml(html: string): Promise<boolean> {
  if (isWeb) {
    try {
      const win = window.open('', '_blank');
      if (!win) return false;
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        try {
          win.print();
        } catch {
          /* ignore */
        }
      }, 500);
      return true;
    } catch {
      return false;
    }
  }
  try {
    await Print.printAsync({ html });
    return true;
  } catch {
    return false;
  }
}

export async function savePdfNative(html: string, filename: string): Promise<string | null> {
  if (isWeb) return null;
  try {
    const res = await Print.printToFileAsync({ html });
    if (!res?.uri) return null;
    try {
      const src = new File(res.uri);
      const dest = new File(Paths.cache, filename);
      await src.move(dest, { overwrite: true });
      return dest.uri;
    } catch {
      return res.uri;
    }
  } catch {
    return null;
  }
}

export async function openExternal(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export interface ApkDownloadProgress {
  bytesWritten: number;
  totalBytes: number;
}

/** تنزيل ملف APK على جهاز أندرويد مع متابعة التقدم */
export async function downloadApkNative(
  url: string,
  filename: string,
  onProgress?: (p: ApkDownloadProgress) => void
): Promise<string | null> {
  if (isWeb) return null;
  try {
    const dest = new File(Paths.cache, filename);
    const file = await File.downloadFileAsync(url, dest, {
      idempotent: true,
      onProgress: (data) => onProgress?.({ bytesWritten: data.bytesWritten, totalBytes: data.totalBytes }),
    });
    return file.uri;
  } catch {
    return null;
  }
}

/** تنزيل APK عبر المتصفح (ويب) */
export function downloadApkOnWeb(url: string, filename: string): boolean {
  if (!isWeb) return false;
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 1500);
    return true;
  } catch {
    return false;
  }
}

export function buildInvoiceHtml(
  invoice: Invoice,
  company: Company | undefined,
  works: Work[],
  settings: Settings,
  currency: CurrencySettings,
  responsibleName?: string
): string {
  const items = invoice.workIds
    .map((id, index) => {
      const w = works.find((x) => x.id === id);
      if (!w) return '';
      return `<tr>
        <td class="c">${index + 1}</td>
        <td>${escapeHtml(w.type)}</td>
        <td class="c">${formatDateShort(w.date)}</td>
        <td class="c">${formatQuantity(w.quantity)} ${escapeHtml(w.unit)}</td>
        <td class="c">${escapeHtml(formatMoney(w.unitPrice, currency))}</td>
        <td class="c"><b>${escapeHtml(formatMoney(w.quantity * w.unitPrice, currency))}</b></td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>فاتورة ${escapeHtml(invoice.number)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #fff; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f766e; padding-bottom: 14px; }
  h1 { font-size: 22px; margin: 0 0 6px; color: #0f766e; }
  .biz { font-size: 15px; font-weight: 700; }
  .muted { color: #64748b; font-size: 12px; line-height: 1.7; }
  .num { font-size: 13px; background: #f1f5f9; padding: 8px 12px; border-radius: 8px; }
  .body { margin-top: 18px; }
  .meta { display: flex; gap: 26px; flex-wrap: wrap; margin-bottom: 16px; font-size: 13px; }
  .meta b { display: block; color: #64748b; font-weight: 600; font-size: 11px; margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #0f766e; color: #fff; padding: 9px 6px; text-align: right; font-size: 11px; }
  td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; }
  td.c, th.c { text-align: center; }
  .totals { margin-top: 14px; margin-inline-start: auto; width: 320px; font-size: 13px; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
  .grand { background: #0f766e; color: #fff; border-radius: 8px; padding: 10px 12px !important; font-weight: 700; border: none !important; margin-top: 8px; }
  .notes { margin-top: 20px; font-size: 12px; color: #475569; background: #f8fafc; padding: 12px; border-radius: 8px; }
  .foot { margin-top: 26px; text-align: center; font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="head">
    <div>
      <h1>فاتورة ضريبية</h1>
      <div class="biz">${escapeHtml(settings.businessName)}</div>
      <div class="muted">${escapeHtml(settings.address)}<br/>هاتف: ${escapeHtml(settings.phone)}<br/>الرقم الضريبي: ${escapeHtml(settings.taxNumber)}</div>
    </div>
    <div class="num">رقم الفاتورة: <b>${escapeHtml(invoice.number)}</b><br/>الحالة: ${
      invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'issued' ? 'مستحقة' : 'مسودة'
    }</div>
  </div>
  <div class="body">
    <div class="meta">
      <div><b>العميل</b>${escapeHtml(company?.name || '—')}<br/><span class="muted">${escapeHtml(company?.phone || '')}</span></div>
      <div><b>الفترة</b>${formatDateShort(invoice.periodStart)} → ${formatDateShort(invoice.periodEnd)}</div>
      <div><b>تاريخ الإصدار</b>${formatDateShort(invoice.issueDate)}</div>
      <div><b>تاريخ الاستحقاق</b>${formatDateShort(invoice.dueDate)}</div>
      ${responsibleName ? `<div><b>المسؤول</b>${escapeHtml(responsibleName)}</div>` : ''}
    </div>
    <table>
      <thead><tr><th class="c">#</th><th>البيان</th><th class="c">التاريخ</th><th class="c">الكمية</th><th class="c">سعر الوحدة</th><th class="c">الإجمالي</th></tr></thead>
      <tbody>${items}</tbody>
    </table>
    <div class="totals">
      <div><span>الإجمالي الفرعي</span><span>${escapeHtml(formatMoney(invoice.subtotal, currency))}</span></div>
      <div><span>الخصم</span><span>- ${escapeHtml(formatMoney(invoice.discount, currency))}</span></div>
      <div><span>الضريبة (${invoice.taxRate}%)</span><span>${escapeHtml(formatMoney(invoice.taxAmount, currency))}</span></div>
      <div class="grand"><span>الإجمالي المستحق</span><span>${escapeHtml(formatMoney(invoice.total, currency))}</span></div>
    </div>
    ${invoice.notes ? `<div class="notes"><b>ملاحظات:</b> ${escapeHtml(invoice.notes)}</div>` : ''}
    <div class="foot">شكرًا لتعاملكم معنا • ${escapeHtml(settings.businessName)}${
      responsibleName ? ` • المسؤول: ${escapeHtml(responsibleName)}` : ''
    }</div>
  </div>
</body>
</html>`;
}

export function buildInvoiceShareText(
  invoice: Invoice,
  company: Company | undefined,
  settings: Settings,
  currency: CurrencySettings,
  responsibleName?: string
): string {
  return [
    `*${settings.businessName}*`,
    responsibleName ? `المسؤول: ${responsibleName}` : '',
    `فاتورة ضريبية: ${invoice.number}`,
    `العميل: ${company?.name || '—'}`,
    `الفترة: ${formatDateShort(invoice.periodStart)} → ${formatDateShort(invoice.periodEnd)}`,
    `تاريخ الاستحقاق: ${formatDateShort(invoice.dueDate)}`,
    `عدد البنود: ${invoice.workIds.length}`,
    `الإجمالي الفرعي: ${formatMoney(invoice.subtotal, currency)}`,
    `الخصم: ${formatMoney(invoice.discount, currency)}`,
    `الضريبة (${invoice.taxRate}%): ${formatMoney(invoice.taxAmount, currency)}`,
    `*الإجمالي المستحق: ${formatMoney(invoice.total, currency)}*`,
    invoice.notes ? `ملاحظات: ${invoice.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
