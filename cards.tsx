import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { formatDate, formatDateShort, formatMoney, formatQuantity, STATUS_LABELS } from '../lib/format';
import { Company, Invoice, InvoiceStatus, Work } from '../lib/types';
import { Badge, BadgeTone, Card, rtlText } from './ui';
import { useApp } from '../state/AppContext';

export function statusTone(status: InvoiceStatus): BadgeTone {
  return status === 'paid' ? 'success' : status === 'issued' ? 'warning' : 'muted';
}

function WorkCardBase({ work, onPress, compact }: { work: Work; onPress?: () => void; compact?: boolean }) {
  const { companyById, currency, workTotal } = useApp();
  const c = usePalette();
  const company = companyById(work.companyId);
  const total = workTotal(work);
  return (
    <Card onPress={onPress} style={{ marginBottom: SPACING.md }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: SPACING.md }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: RADIUS.md,
            backgroundColor: work.invoiceId ? c.successSoft : c.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={work.invoiceId ? 'checkmark-done' : 'hammer'} size={19} color={work.invoiceId ? c.success : c.primaryText} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
            <Text style={[rtlText, { flex: 1, color: c.text, fontSize: 15, fontWeight: '800' }]} numberOfLines={1}>
              {work.type}
            </Text>
            <Text style={[rtlText, { color: c.primaryText, fontSize: 14.5, fontWeight: '800' }]}>{formatMoney(total, currency)}</Text>
          </View>
          <Text style={[rtlText, { color: c.textMuted, fontSize: 12.5, marginTop: 3 }]} numberOfLines={1}>
            {company?.name ?? 'بدون شركة'}
          </Text>
          {!compact ? (
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <MetaChip icon="calendar-outline" text={formatDateShort(work.date)} />
              <MetaChip icon="cube-outline" text={`${formatQuantity(work.quantity)} ${work.unit}`} />
              <MetaChip icon="pricetag-outline" text={`${formatMoney(work.unitPrice, currency)} / ${work.unit}`} />
              {work.invoiceId ? <Badge label="مفوتر" tone="success" icon="checkmark-circle" /> : <Badge label="غير مفوتر" tone="muted" />}
            </View>
          ) : (
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <MetaChip icon="calendar-outline" text={formatDateShort(work.date)} />
              {work.invoiceId ? <Badge label="مفوتر" tone="success" /> : null}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

export function MetaChip({ icon, text, color }: { icon: keyof typeof Ionicons.glyphMap; text: string; color?: string }) {
  const c = usePalette();
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={12} color={color ?? c.textFaint} />
      <Text style={[rtlText, { color: color ?? c.textFaint, fontSize: 11.5, fontWeight: '600' }]}>{text}</Text>
    </View>
  );
}

function InvoiceCardBase({ invoice, onPress }: { invoice: Invoice; onPress?: () => void }) {
  const { companyById, currency } = useApp();
  const c = usePalette();
  const company = companyById(invoice.companyId);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = invoice.status === 'issued' && invoice.dueDate < today;
  return (
    <Card onPress={onPress} style={{ marginBottom: SPACING.md }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: RADIUS.md,
            backgroundColor: overdue ? c.dangerSoft : invoice.status === 'paid' ? c.successSoft : c.warningSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={invoice.status === 'paid' ? 'checkmark-circle' : overdue ? 'alert-circle' : 'time'}
            size={20}
            color={overdue ? c.danger : invoice.status === 'paid' ? c.success : c.warning}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
            <Text style={[rtlText, { flex: 1, color: c.text, fontSize: 14.5, fontWeight: '800' }]} numberOfLines={1}>
              {company?.name ?? 'عميل'}
            </Text>
            <Badge label={overdue ? 'متأخرة' : STATUS_LABELS[invoice.status]} tone={overdue ? 'danger' : statusTone(invoice.status)} />
          </View>
          <Text style={[rtlText, { color: c.textFaint, fontSize: 12, marginTop: 3 }]} numberOfLines={1}>
            {invoice.number} • {invoice.workIds.length} بند • الاستحقاق {formatDateShort(invoice.dueDate)}
          </Text>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={[rtlText, { color: c.text, fontSize: 15.5, fontWeight: '800' }]}>{formatMoney(invoice.total, currency)}</Text>
            <MetaChip icon="calendar-outline" text={`${formatDateShort(invoice.periodStart)} → ${formatDateShort(invoice.periodEnd)}`} />
          </View>
        </View>
      </View>
    </Card>
  );
}

function CompanyCardBase({ company, onPress }: { company: Company; onPress?: () => void }) {
  const { worksOfCompany, invoicesOfCompany, currency } = useApp();
  const c = usePalette();
  const works = worksOfCompany(company.id);
  const invoices = invoicesOfCompany(company.id);
  const total = works.reduce((s, w) => s + (Number(w.quantity) || 0) * (Number(w.unitPrice) || 0), 0);
  const due = invoices.filter((i) => i.status === 'issued').reduce((s, i) => s + i.total, 0);
  return (
    <Card onPress={onPress} style={{ marginBottom: SPACING.md }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.md }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: RADIUS.lg,
            backgroundColor: c.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={[rtlText, { color: c.primaryText, fontSize: 18, fontWeight: '800' }]}>{company.name.trim().charAt(0) || '؟'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[rtlText, { color: c.text, fontSize: 15, fontWeight: '800' }]} numberOfLines={1}>
            {company.name}
          </Text>
          <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <MetaChip icon="call-outline" text={company.phone || '—'} />
            <MetaChip icon="briefcase-outline" text={`${works.length} عمل`} />
            <MetaChip icon="document-text-outline" text={`${invoices.length} فاتورة`} />
          </View>
          <View style={{ flexDirection: 'row-reverse', gap: 14, marginTop: 9 }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 5 }}>
              <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5 }]}>الإجمالي</Text>
              <Text style={[rtlText, { color: c.primaryText, fontSize: 12.5, fontWeight: '800' }]}>{formatMoney(total, currency)}</Text>
            </View>
            {due > 0 ? (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 5 }}>
                <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5 }]}>مستحقات</Text>
                <Text style={[rtlText, { color: c.warning, fontSize: 12.5, fontWeight: '800' }]}>{formatMoney(due, currency)}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-back" size={18} color={c.textFaint} />
      </View>
    </Card>
  );
}

export function TotalsBlock({
  subtotal,
  discount,
  taxRate,
  taxAmount,
  total,
}: {
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}) {
  const { currency } = useApp();
  const c = usePalette();
  const Row = ({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) => (
    <View
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: strong ? 12 : 8,
        borderTopWidth: strong ? 1 : 0,
        borderTopColor: c.borderSoft,
      }}
    >
      <Text style={[rtlText, { color: strong ? c.text : c.textMuted, fontSize: strong ? 14.5 : 13, fontWeight: strong ? '800' : '600' }]}>
        {label}
      </Text>
      <Text style={[rtlText, { color: tone ?? (strong ? c.primaryText : c.text), fontSize: strong ? 16 : 13.5, fontWeight: '800' }]}>
        {value}
      </Text>
    </View>
  );
  return (
    <View style={{ backgroundColor: c.surfaceAlt, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 4 }}>
      <Row label="الإجمالي الفرعي" value={formatMoney(subtotal, currency)} />
      <Row label="الخصم" value={`- ${formatMoney(discount, currency)}`} tone={discount > 0 ? c.danger : undefined} />
      <Row label={`الضريبة (${taxRate}%)`} value={formatMoney(taxAmount, currency)} />
      <Row label="الإجمالي المستحق" value={formatMoney(total, currency)} strong />
    </View>
  );
}

export const WorkCard = React.memo(WorkCardBase);
export const InvoiceCard = React.memo(InvoiceCardBase);
export const CompanyCard = React.memo(CompanyCardBase);

export function PressableRow({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  return <Pressable onPress={onPress}>{children}</Pressable>;
}

export { formatDate };
