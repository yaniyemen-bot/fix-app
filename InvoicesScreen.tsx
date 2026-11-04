import React, { useMemo, useState } from 'react';
import { FlatList, Text, View, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import { Card, Chip, ChipRow, EmptyState, FAB, Screen, ScreenHeader, SearchBar, rtlText } from '../components/ui';
import { InvoiceCard } from '../components/cards';
import { formatMoney } from '../lib/format';
import { can } from '../lib/permissions';

type FilterKey = 'all' | 'issued' | 'paid' | 'draft' | 'overdue';

export default function InvoicesScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const { invoices, companies, currency, role } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const q = query.trim();
    return invoices
      .filter((i) => {
        if (filter === 'issued') return i.status === 'issued';
        if (filter === 'paid') return i.status === 'paid';
        if (filter === 'draft') return i.status === 'draft';
        if (filter === 'overdue') return i.status === 'issued' && i.dueDate < today;
        return true;
      })
      .filter((i) => {
        if (!q) return true;
        const company = companies.find((x) => x.id === i.companyId);
        return `${i.number} ${company?.name ?? ''} ${i.notes}`.includes(q);
      })
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
  }, [invoices, query, filter, companies, today]);

  const summary = useMemo(() => {
    const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const due = invoices.filter((i) => i.status === 'issued').reduce((s, i) => s + i.total, 0);
    const draft = invoices.filter((i) => i.status === 'draft').length;
    return { paid, due, draft };
  }, [invoices]);

  return (
    <Screen>
      <ScreenHeader title="الفواتير الشهرية" subtitle={`${invoices.length} فاتورة • أرشفة وبحث وتصدير`} />
      <View style={{ flex: 1, paddingTop: SPACING.md }}>
        <View style={{ paddingHorizontal: SPACING.lg }}>
          <Card style={{ marginBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              <SummaryCell label="محصّل" value={formatMoney(summary.paid, currency)} color={c.success} />
              <SummaryCell label="مستحق" value={formatMoney(summary.due, currency)} color={c.warning} />
              <SummaryCell label="مسودات" value={`${summary.draft}`} color={c.textMuted} />
            </View>
          </Card>
          <SearchBar value={query} onChangeText={setQuery} placeholder="ابحث برقم الفاتورة أو اسم الشركة..." />
          <ChipRow>
            <Chip label="الكل" selected={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip label="مستحقة" selected={filter === 'issued'} onPress={() => setFilter('issued')} />
            <Chip label="مدفوعة" selected={filter === 'paid'} onPress={() => setFilter('paid')} />
            <Chip label="مسودات" selected={filter === 'draft'} onPress={() => setFilter('draft')} />
            <Chip label="متأخرة" selected={filter === 'overdue'} onPress={() => setFilter('overdue')} />
          </ChipRow>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={40}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 160 }}
          renderItem={({ item }) => <InvoiceCard invoice={item} onPress={() => nav.navigate('InvoiceDetail', { invoiceId: item.id })} />}
          ListEmptyComponent={
            <Card>
              <EmptyState
                icon="document-text-outline"
                title="لا توجد فواتير"
                body="أنشئ فاتورتك الأولى من الأعمال غير المفوترة"
                actionLabel={can(role, 'invoices.create') ? 'فاتورة جديدة' : undefined}
                onAction={can(role, 'invoices.create') ? () => nav.navigate('InvoiceNew') : undefined}
              />
            </Card>
          }
        />
      </View>
      {can(role, 'invoices.create') ? <FAB icon="add" label="فاتورة" onPress={() => nav.navigate('InvoiceNew')} /> : null}
    </Screen>
  );
}

function SummaryCell({ label, value, color }: { label: string; value: string; color: string }) {
  const c = usePalette();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5 }]}>{label}</Text>
      </View>
      <Text style={[rtlText, { color: c.text, fontSize: 14, fontWeight: '800' }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
