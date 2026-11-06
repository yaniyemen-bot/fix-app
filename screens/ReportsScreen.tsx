import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { useApp, useMetrics } from '../state/AppContext';
import { Btn, Card, Chip, ChipRow, EmptyState, Screen, ScreenHeader, SectionHeader, StatTile, rtlText } from '../components/ui';
import { BarChart, RankedList, StackedBar } from '../components/Charts';
import { exportCsv, exportMetaRows, safeFileName } from '../lib/exporters';
import { currentMonthKey, formatMoney, formatNumber, lastMonthKeys, monthKeyOf, monthLabel, monthLabelShort } from '../lib/format';
import { can } from '../lib/permissions';

type PeriodKey = '1' | '3' | '6' | 'all';

export default function ReportsScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const { works, invoices, companies, currency, role, showToast, workTotal, settings, currentUser } = useApp();
  const m = useMetrics();
  const [period, setPeriod] = useState<PeriodKey>('6');
  const [busy, setBusy] = useState(false);

  const months = useMemo(() => {
    if (period === 'all') {
      const keys = new Set(works.map((w) => monthKeyOf(w.date)));
      return [...keys].sort();
    }
    return lastMonthKeys(Number(period));
  }, [period, works]);

  const stats = useMemo(() => {
    const inPeriod = works.filter((w) => months.includes(monthKeyOf(w.date)));
    const revenue = inPeriod.reduce((s, w) => s + workTotal(w), 0);
    const periodInvoices = invoices.filter((i) => months.includes(monthKeyOf(i.issueDate)));
    const invoiced = periodInvoices.reduce((s, i) => s + i.total, 0);
    const collected = periodInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const byCompany = new Map<string, { total: number; count: number }>();
    inPeriod.forEach((w) => {
      const e = byCompany.get(w.companyId) ?? { total: 0, count: 0 };
      e.total += workTotal(w);
      e.count += 1;
      byCompany.set(w.companyId, e);
    });
    const top = [...byCompany.entries()]
      .map(([id, v]) => ({
        label: companies.find((x) => x.id === id)?.name ?? 'عميل',
        value: v.total,
        hint: `${v.count} عمل في الفترة`,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const monthly = months.map((k) => {
      const mw = works.filter((w) => monthKeyOf(w.date) === k);
      const mi = invoices.filter((i) => monthKeyOf(i.issueDate) === k);
      return {
        key: k,
        label: monthLabel(k),
        revenue: mw.reduce((s, w) => s + workTotal(w), 0),
        count: mw.length,
        collected: mi.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0),
        invoiced: mi.reduce((s, i) => s + i.total, 0),
      };
    });

    return {
      revenue,
      count: inPeriod.length,
      invoiced,
      collected,
      collectionRate: invoiced ? Math.round((collected / invoiced) * 100) : 0,
      avgInvoice: periodInvoices.length ? invoiced / periodInvoices.length : 0,
      top,
      monthly,
      statusCounts: {
        paid: invoices.filter((i) => i.status === 'paid').length,
        issued: invoices.filter((i) => i.status === 'issued').length,
        draft: invoices.filter((i) => i.status === 'draft').length,
      },
    };
  }, [works, invoices, companies, months, workTotal]);

  const doExport = async () => {
    if (!can(role, 'export.data')) {
      showToast('دورك الحالي لا يسمح بالتصدير', 'error');
      return;
    }
    setBusy(true);
    const rows: (string | number)[][] = [
      ...exportMetaRows(settings, currentUser.name, currency),
      ['الشهر', 'عدد الأعمال', 'إيراد الأعمال', 'عدد الفواتير', 'قيمة الفواتير', 'المحصّل', 'العملة', 'المسؤول'],
      ...stats.monthly.map((r) => [
        r.label,
        r.count,
        r.revenue,
        invoices.filter((i) => monthKeyOf(i.issueDate) === r.key).length,
        r.invoiced,
        r.collected,
        currency.code,
        currentUser.name,
      ]),
      [],
      ['الإجمالي', stats.count, stats.revenue, invoices.length, stats.invoiced, stats.collected, currency.code, currentUser.name],
    ];
    const res = await exportCsv(`${safeFileName(settings.businessName)}-report.csv`, rows);
    setBusy(false);
    showToast(res === 'failed' ? 'تعذر تصدير التقرير' : 'تم تصدير التقرير الشهري', res === 'failed' ? 'error' : 'success');
  };

  return (
    <Screen>
      <ScreenHeader title="التقارير والتحليل المالي" subtitle="رؤية شاملة لأداء أعمالك وإيراداتك" onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <ChipRow>
          {([
            { k: '1', l: 'هذا الشهر' },
            { k: '3', l: 'آخر 3 أشهر' },
            { k: '6', l: 'آخر 6 أشهر' },
            { k: 'all', l: 'كل الفترات' },
          ] as { k: PeriodKey; l: string }[]).map((o) => (
            <Chip key={o.k} label={o.l} selected={period === o.k} onPress={() => setPeriod(o.k)} />
          ))}
        </ChipRow>

        <View style={{ flexDirection: 'row-reverse', gap: SPACING.md, marginTop: SPACING.sm }}>
          <StatTile title="إجمالي الإيرادات" value={formatMoney(stats.revenue, currency)} icon="cash" tone="primary" subtitle={`${stats.count} عمل`} />
          <StatTile title="نسبة التحصيل" value={`${stats.collectionRate}%`} icon="pie-chart" tone="success" subtitle={`محصّل ${formatMoney(stats.collected, currency)}`} />
        </View>
        <View style={{ flexDirection: 'row-reverse', gap: SPACING.md, marginTop: SPACING.md }}>
          <StatTile title="متوسط الفاتورة" value={formatMoney(stats.avgInvoice, currency)} icon="receipt" tone="info" subtitle={`${invoices.length} فاتورة`} />
          <StatTile title="غير مفوتر" value={formatMoney(m.unbilledTotal, currency)} icon="alert-circle" tone={m.unbilledTotal ? 'warning' : 'success'} subtitle={`${m.unbilled.length} عمل`} />
        </View>

        <SectionHeader title="تطور الإيرادات" icon="bar-chart-outline" />
        <Card>
          <BarChart
            data={stats.monthly.slice(-8).map((r, idx, arr) => ({ label: monthLabelShort(r.key), value: r.revenue, highlight: idx === arr.length - 1 }))}
            formatValue={(v) => (v >= 1000 ? `${formatNumber(Math.round(v / 1000))}k` : formatNumber(Math.round(v)))}
            height={160}
          />
        </Card>

        <SectionHeader title="أعلى العملاء إيرادًا (الكل)" icon="trophy-outline" />
        <Card>
          <RankedList items={stats.top} formatValue={(v) => formatMoney(v, currency)} />
        </Card>

        <SectionHeader title="توزيع الفواتير حسب الحالة" icon="pie-chart-outline" />
        <Card>
          <StackedBar
            total={stats.statusCounts.paid + stats.statusCounts.issued + stats.statusCounts.draft}
            segments={[
              { label: 'مدفوعة', value: stats.statusCounts.paid, color: c.success },
              { label: 'مستحقة', value: stats.statusCounts.issued, color: c.warning },
              { label: 'مسودة', value: stats.statusCounts.draft, color: c.textFaint },
            ]}
          />
        </Card>

        <SectionHeader title="التقرير الشهري" icon="calendar-outline" />
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row-reverse', backgroundColor: c.surfaceAlt, paddingVertical: 10, paddingHorizontal: SPACING.md }}>
            <Text style={[rtlText, { flex: 1.3, color: c.textMuted, fontSize: 11.5, fontWeight: '800' }]}>الشهر</Text>
            <Text style={[rtlText, { flex: 1, color: c.textMuted, fontSize: 11.5, fontWeight: '800', textAlign: 'center' }]}>إيراد الشهر</Text>
            <Text style={[rtlText, { flex: 0.8, color: c.textMuted, fontSize: 11.5, fontWeight: '800', textAlign: 'center' }]}>عدد الأعمال</Text>
            <Text style={[rtlText, { flex: 1, color: c.textMuted, fontSize: 11.5, fontWeight: '800', textAlign: 'left' }]}>محصّل فواتير</Text>
          </View>
          {stats.monthly.length === 0 ? (
            <View style={{ padding: SPACING.lg }}>
              <Text style={[rtlText, { color: c.textFaint, fontSize: 13, textAlign: 'center' }]}>لا توجد أعمال في هذه الفترة</Text>
            </View>
          ) : (
            stats.monthly
              .slice()
              .reverse()
              .map((r) => (
                <View
                  key={r.key}
                  style={{
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: SPACING.md,
                    borderTopWidth: 1,
                    borderTopColor: c.borderSoft,
                  }}
                >
                  <Text style={[rtlText, { flex: 1.3, color: c.text, fontSize: 12.5, fontWeight: '700' }]} numberOfLines={1}>
                    {r.label}
                  </Text>
                  <Text style={[rtlText, { flex: 1, color: c.primaryText, fontSize: 12.5, fontWeight: '800', textAlign: 'center' }]} numberOfLines={1}>
                    {formatMoney(r.revenue, currency)}
                  </Text>
                  <Text style={[rtlText, { flex: 0.8, color: c.textMuted, fontSize: 12.5, textAlign: 'center' }]}>{r.count}</Text>
                  <Text style={[rtlText, { flex: 1, color: c.success, fontSize: 12.5, fontWeight: '800', textAlign: 'left' }]} numberOfLines={1}>
                    {formatMoney(r.collected, currency)}
                  </Text>
                </View>
              ))
          )}
        </Card>

        <SectionHeader title="ملخص الأداء" icon="pulse-outline" />
        <Card>
          <SummaryRow icon="business-outline" label="إجمالي الشركات" value={`${companies.length}`} />
          <SummaryRow icon="hammer-outline" label="إجمالي الأعمال المسجلة" value={`${works.length}`} />
          <SummaryRow icon="document-text-outline" label="إجمالي الفواتير" value={`${invoices.length}`} />
          <SummaryRow icon="cash-outline" label="إجمالي الفواتير المحصلة" value={formatMoney(m.collected, currency)} />
          <SummaryRow icon="alert-circle-outline" label="أعمال غير مفوترة" value={`${m.unbilled.length} • ${formatMoney(m.unbilledTotal, currency)}`} last />
        </Card>

        <View style={{ marginTop: SPACING.xl, gap: SPACING.md }}>
          <Btn label="تصدير CSV" icon="download-outline" onPress={doExport} loading={busy} />
          <Btn label="عرض التنبيهات" icon="notifications-outline" variant="outline" onPress={() => nav.navigate('Alerts')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  const c = usePalette();
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: 11,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.borderSoft,
      }}
    >
      <Ionicons name={icon} size={16} color={c.textFaint} />
      <Text style={[rtlText, { flex: 1, color: c.textMuted, fontSize: 13, fontWeight: '600' }]}>{label}</Text>
      <Text style={[rtlText, { color: c.text, fontSize: 13.5, fontWeight: '800' }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
