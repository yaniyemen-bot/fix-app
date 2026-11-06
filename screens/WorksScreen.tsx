import React, { useMemo, useState } from 'react';
import { FlatList, Text, View, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import { Card, Chip, ChipRow, EmptyState, FAB, Screen, ScreenHeader, SearchBar, rtlText } from '../components/ui';
import { WorkCard } from '../components/cards';
import { formatMoney, monthKeyOf, currentMonthKey } from '../lib/format';
import { can } from '../lib/permissions';

type FilterKey = 'all' | 'unbilled' | 'billed' | 'month';

export default function WorksScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const { works, companies, currency, role, workTotal, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [companyId, setCompanyId] = useState<string>('all');
  const monthKey = currentMonthKey();

  const filtered = useMemo(() => {
    const q = query.trim();
    return works
      .filter((w) => (companyId === 'all' ? true : w.companyId === companyId))
      .filter((w) => {
        if (filter === 'unbilled') return !w.invoiceId;
        if (filter === 'billed') return !!w.invoiceId;
        if (filter === 'month') return monthKeyOf(w.date) === monthKey;
        return true;
      })
      .filter((w) => {
        if (!q) return true;
        const company = companies.find((x) => x.id === w.companyId);
        return `${w.type} ${company?.name ?? ''} ${w.unit} ${w.notes}`.includes(q);
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [works, query, filter, companyId, companies, monthKey]);

  const totals = useMemo(() => {
    const value = filtered.reduce((s, w) => s + workTotal(w), 0);
    const billed = filtered.filter((w) => w.invoiceId).length;
    return { value, billed };
  }, [filtered, workTotal]);

  return (
    <Screen>
      <ScreenHeader title="الأعمال اليومية" subtitle="سجّل أعمالك اليومية وتابع قيمتها لحظة بلحظة" />
      <View style={{ flex: 1, paddingTop: SPACING.md }}>
        <View style={{ paddingHorizontal: SPACING.lg }}>
          <Card style={{ marginBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              <View>
                <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5 }]}>إجمالي {filtered.length} عمل</Text>
                <Text style={[rtlText, { color: c.primaryText, fontSize: 17, fontWeight: '800', marginTop: 3 }]}>
                  {formatMoney(totals.value, currency)}
                </Text>
              </View>
              <View>
                <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5 }]}>مفوتر</Text>
                <Text style={[rtlText, { color: c.text, fontSize: 17, fontWeight: '800', marginTop: 3 }]}>
                  {totals.billed} / {filtered.length}
                </Text>
              </View>
            </View>
          </Card>
          <SearchBar value={query} onChangeText={setQuery} placeholder="ابحث بنوع العمل أو اسم الشركة..." />
          <ChipRow>
            <Chip label="الكل" selected={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip label="غير مفوتر" selected={filter === 'unbilled'} onPress={() => setFilter('unbilled')} />
            <Chip label="مفوتر" selected={filter === 'billed'} onPress={() => setFilter('billed')} />
            <Chip label="هذا الشهر" selected={filter === 'month'} onPress={() => setFilter('month')} />
          </ChipRow>
          <ChipRow>
            <Chip label="كل الشركات" selected={companyId === 'all'} onPress={() => setCompanyId('all')} icon="apps" />
            {companies.map((co) => (
              <Chip key={co.id} label={co.name} selected={companyId === co.id} onPress={() => setCompanyId(co.id)} icon="business" />
            ))}
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
          renderItem={({ item }) => <WorkCard work={item} onPress={() => nav.navigate('WorkDetail', { workId: item.id })} />}
          ListEmptyComponent={
            <Card>
              <EmptyState
                icon="hammer-outline"
                title="لا توجد أعمال"
                body={works.length ? 'لا توجد نتائج مطابقة لبحثك أو الفلاتر المحددة' : 'أضف عملك الأول بالضغط على زر + بالأسفل'}
                actionLabel={works.length ? undefined : can(role, 'works.create') ? 'إضافة عمل جديد' : undefined}
                onAction={
                  works.length
                    ? undefined
                    : can(role, 'works.create')
                    ? () => nav.navigate('WorkForm')
                    : undefined
                }
              />
            </Card>
          }
        />
      </View>
      {can(role, 'works.create') ? <FAB onPress={() => nav.navigate('WorkForm')} /> : null}
    </Screen>
  );
}
