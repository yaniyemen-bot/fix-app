import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { useApp, useMetrics } from '../state/AppContext';
import { Badge, Card, ProgressBar, SectionHeader, StatTile, EmptyState, Btn, rtlText } from '../components/ui';
import { BarChart, RankedList } from '../components/Charts';
import { InvoiceCard, WorkCard } from '../components/cards';
import { formatMoney, formatNumber, monthKeyOf, monthLabelShort } from '../lib/format';
import { ROLE_LABELS, can } from '../lib/permissions';
import AppHeader from './AppHeader';
export default function HomeScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const { settings, currentUser, currency, alerts, works, companies, showToast, role } = useApp();
  const m = useMetrics();
  const [refreshing, setRefreshing] = useState(false);

  const latestWorks = useMemo(
    () => [...works].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4),
    [works]
  );

  const pendingInvoices = useMemo(
    () => [...m.outstanding].sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)).slice(0, 3),
    [m.outstanding]
  );

  const topThisMonth = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    works
      .filter((w) => monthKeyOf(w.date) === m.monthKey)
      .forEach((w) => {
        const e = map.get(w.companyId) ?? { total: 0, count: 0 };
        e.total += (Number(w.quantity) || 0) * (Number(w.unitPrice) || 0);
        e.count += 1;
        map.set(w.companyId, e);
      });
    return [...map.entries()]
      .map(([id, v]) => ({
        label: companies.find((x) => x.id === id)?.name ?? 'عميل',
        value: v.total,
        hint: `${v.count} عمل هذا الشهر`,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [works, companies, m.monthKey]);

  const chartData = m.series.map((s, i) => ({
    label: monthLabelShort(s.key),
    value: s.value,
    highlight: i === m.series.length - 1,
  }));

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('تم تحديث البيانات المحلية', 'info');
    }, 650);
  };

  const compactMoney = (v: number) => (v >= 1000 ? `${formatNumber(Math.round(v / 1000))}k` : formatNumber(Math.round(v)));
return (
  <>
    <AppHeader />
    <ScrollView
      style={{ flex: 1, backgroundColor: ... }}
      // ... باقي الكود بالكامل دون تغيير
      // ...
    </ScrollView>
  </>
);
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
    >
      <LinearGradient colors={settings.businessName ? c.headerGradient : c.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.xxl, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl }}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.md }}>
          <View style={{ width: 46, height: 46, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="business" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[rtlText, { color: 'rgba(255,255,255,0.8)', fontSize: 12.5, fontWeight: '600' }]}>
              مرحبًا {currentUser.name} 👋
            </Text>
            <Text style={[rtlText, { color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 2 }]} numberOfLines={1}>
              {settings.businessName || 'منشأتي'}
            </Text>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={[rtlText, { color: '#fff', fontSize: 11, fontWeight: '800' }]}>{ROLE_LABELS[role]}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row-reverse', gap: SPACING.sm, marginTop: SPACING.xl }}>
          <QuickAction icon="add-circle" label="عمل يومي" onPress={() => nav.navigate('WorkForm')} />
          {can(role, 'invoices.create') ? (
            <QuickAction icon="document-text" label="فاتورة جديدة" onPress={() => nav.navigate('InvoiceNew')} />
          ) : null}
          <QuickAction icon="stats-chart" label="التقارير" onPress={() => (can(role, 'reports.view') ? nav.navigate('Reports') : showToast('دورك الحالي لا يسمح بعرض التقارير', 'error'))} />
          <QuickAction icon="notifications" label="التنبيهات" badge={alerts.filter((a) => a.severity !== 'info').length} onPress={() => nav.navigate('Alerts')} />
        </View>
      </LinearGradient>

      <View style={{ padding: SPACING.lg, marginTop: -SPACING.lg }}>
        <View style={{ flexDirection: 'row-reverse', gap: SPACING.md }}>
          <StatTile
            title={`إيراد ${m.monthLabel}`}
            value={formatMoney(m.monthRevenue, currency)}
            icon="trending-up"
            tone="primary"
            subtitle={`${m.monthWorksCount} عمل مسجل`}
            onPress={() => nav.navigate('WorksTab')}
          />
          <StatTile
            title="عمل اليوم"
            value={`${m.todayWorks.length}`}
            icon="today"
            tone="info"
            subtitle={formatMoney(m.todayRevenue, currency)}
            onPress={() => nav.navigate('WorksTab')}
          />
        </View>
        <View style={{ flexDirection: 'row-reverse', gap: SPACING.md, marginTop: SPACING.md }}>
          <StatTile
            title="مستحقات غير مدفوعة"
            value={formatMoney(m.outstandingTotal, currency)}
            icon="wallet"
            tone="warning"
            subtitle={`${m.outstanding.length} فاتورة`}
            onPress={() => nav.navigate('InvoicesTab')}
          />
          <StatTile
            title="فواتير متأخرة"
            value={`${m.overdue.length}`}
            icon="alert-circle"
            tone={m.overdue.length ? 'danger' : 'success'}
            subtitle={formatMoney(m.overdueTotal, currency)}
            onPress={() => nav.navigate('Alerts')}
          />
        </View>

        {settings.monthlyLimit > 0 ? (
          <Card style={{ marginTop: SPACING.lg }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                <Ionicons name="speedometer-outline" size={17} color={m.limitUsedPct >= 100 ? c.danger : c.primary} />
                <Text style={[rtlText, { color: c.text, fontSize: 14, fontWeight: '800' }]}>الحد المالي الشهري</Text>
              </View>
              <Badge
                label={`${m.limitUsedPct}%`}
                tone={m.limitUsedPct >= 100 ? 'danger' : m.limitUsedPct >= 80 ? 'warning' : 'primary'}
              />
            </View>
            <ProgressBar value={m.limitUsedPct} tone={m.limitUsedPct >= 100 ? c.danger : m.limitUsedPct >= 80 ? c.warning : c.primary} />
            <Text style={[rtlText, { color: c.textMuted, fontSize: 12, marginTop: 10 }]}>
              {formatMoney(m.monthRevenue, currency)} من {formatMoney(settings.monthlyLimit, currency)}
              {m.limitUsedPct >= 100 ? ' • تم تجاوز الحد المحدد' : ''}
            </Text>
          </Card>
        ) : null}

        {alerts.length > 0 ? (
          <>
            <SectionHeader title="تنبيهات تحتاج انتباهك" action="عرض الكل" onAction={() => nav.navigate('Alerts')} icon="notifications-outline" />
            <Card>
              {alerts.slice(0, 3).map((a, idx) => (
                <View
                  key={a.id}
                  style={{
                    flexDirection: 'row-reverse',
                    gap: SPACING.md,
                    paddingVertical: idx === 0 ? 0 : 12,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: c.borderSoft,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: RADIUS.md,
                      backgroundColor: a.severity === 'danger' ? c.dangerSoft : a.severity === 'warning' ? c.warningSoft : c.infoSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={a.severity === 'danger' ? 'warning' : a.severity === 'warning' ? 'time' : 'information-circle'}
                      size={16}
                      color={a.severity === 'danger' ? c.danger : a.severity === 'warning' ? c.warning : c.info}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[rtlText, { color: c.text, fontSize: 13.5, fontWeight: '700' }]} numberOfLines={1}>
                      {a.title}
                    </Text>
                    <Text style={[rtlText, { color: c.textMuted, fontSize: 11.5, marginTop: 2 }]} numberOfLines={1}>
                      {a.body}
                    </Text>
                  </View>
                  {a.invoiceId ? (
                    <Ionicons
                      name="chevron-back"
                      size={16}
                      color={c.textFaint}
                      onPress={() => nav.navigate('InvoiceDetail', { invoiceId: a.invoiceId })}
                    />
                  ) : null}
                </View>
              ))}
            </Card>
          </>
        ) : null}

        <SectionHeader title="إيراد آخر 6 أشهر" action="التقارير" onAction={() => nav.navigate('Reports')} icon="bar-chart-outline" />
        <Card>
          <BarChart data={chartData} formatValue={compactMoney} height={150} />
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: c.borderSoft }}>
            <View>
              <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5 }]}>إجمالي 6 أشهر</Text>
              <Text style={[rtlText, { color: c.text, fontSize: 15, fontWeight: '800', marginTop: 2 }]}>
                {formatMoney(m.series.reduce((s, x) => s + x.value, 0), currency)}
              </Text>
            </View>
            <View>
              <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5 }]}>نسبة التحصيل</Text>
              <Text style={[rtlText, { color: c.success, fontSize: 15, fontWeight: '800', marginTop: 2 }]}>{m.collectionRate}%</Text>
            </View>
          </View>
        </Card>

        <SectionHeader title="أنشط العملاء هذا الشهر" icon="people-outline" />
        <Card>
          {topThisMonth.length ? (
            <RankedList items={topThisMonth} formatValue={(v) => formatMoney(v, currency)} />
          ) : (
            <Text style={[rtlText, { color: c.textFaint, fontSize: 13, paddingVertical: 8 }]}>لا توجد أعمال هذا الشهر بعد</Text>
          )}
        </Card>

        <SectionHeader title="أحدث الأعمال" action="عرض الكل" onAction={() => nav.navigate('WorksTab')} icon="hammer-outline" />
        {latestWorks.length ? (
          latestWorks.map((w) => (
            <WorkCard key={w.id} work={w} compact onPress={() => nav.navigate('WorkDetail', { workId: w.id })} />
          ))
        ) : (
          <Card>
            <EmptyState
              icon="hammer-outline"
              title="لا توجد أعمال بعد"
              body="أضف أول عمل يومي لبدء تتبع إيراداتك"
              actionLabel={can(role, 'works.create') ? 'إضافة عمل' : undefined}
              onAction={can(role, 'works.create') ? () => nav.navigate('WorkForm') : undefined}
            />
          </Card>
        )}

        {pendingInvoices.length ? (
          <>
            <SectionHeader title="فواتير بانتظار التحصيل" action="عرض الكل" onAction={() => nav.navigate('InvoicesTab')} icon="document-text-outline" />
            {pendingInvoices.map((inv) => (
              <InvoiceCard key={inv.id} invoice={inv} onPress={() => nav.navigate('InvoiceDetail', { invoiceId: inv.id })} />
            ))}
          </>
        ) : null}

        <View style={{ marginTop: SPACING.xl }}>
          <Btn label="إدارة العملة وتنزيل APK" icon="settings-outline" variant="outline" onPress={() => nav.navigate('Settings')} />
        </View>
      </View>
    </ScrollView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderRadius: RADIUS.lg,
        paddingVertical: 12,
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ position: 'relative' }}>
        <Ionicons name={icon} size={20} color="#fff" />
        {badge ? (
          <View
            style={{
              position: 'absolute',
              top: -6,
              right: -10,
              backgroundColor: '#F87171',
              borderRadius: RADIUS.pill,
              minWidth: 16,
              height: 16,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 3,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '800' }}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[rtlText, { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
