import React, { useMemo, useState } from 'react';
import { FlatList, Text, View, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import { Card, EmptyState, FAB, Screen, ScreenHeader, SearchBar, rtlText } from '../components/ui';
import { CompanyCard } from '../components/cards';
import { formatMoney } from '../lib/format';
import { can } from '../lib/permissions';

export default function CompaniesScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const { companies, works, invoices, currency, role } = useApp();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return companies;
    return companies.filter((co) => `${co.name} ${co.phone} ${co.address} ${co.email}`.includes(q));
  }, [companies, query]);

  const totals = useMemo(() => {
    const worksTotal = works.reduce((s, w) => s + (Number(w.quantity) || 0) * (Number(w.unitPrice) || 0), 0);
    const invoicesTotal = invoices.reduce((s, i) => s + i.total, 0);
    return { worksTotal, invoicesTotal };
  }, [works, invoices]);

  return (
    <Screen>
      <ScreenHeader title="الشركات والعملاء" subtitle={`${companies.length} جهة مسجلة`} />
      <View style={{ flex: 1, paddingTop: SPACING.md }}>
        <View style={{ paddingHorizontal: SPACING.lg }}>
          <Card style={{ marginBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5 }]}>إجمالي الأعمال</Text>
                <Text style={[rtlText, { color: c.primaryText, fontSize: 15, fontWeight: '800', marginTop: 3 }]} numberOfLines={1}>
                  {formatMoney(totals.worksTotal, currency)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5 }]}>إجمالي الفواتير</Text>
                <Text style={[rtlText, { color: c.text, fontSize: 15, fontWeight: '800', marginTop: 3 }]} numberOfLines={1}>
                  {formatMoney(totals.invoicesTotal, currency)}
                </Text>
              </View>
            </View>
          </Card>
          <SearchBar value={query} onChangeText={setQuery} placeholder="ابحث بالاسم أو الهاتف أو العنوان..." />
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
          renderItem={({ item }) => <CompanyCard company={item} onPress={() => nav.navigate('CompanyDetail', { companyId: item.id })} />}
          ListEmptyComponent={
            <Card>
              <EmptyState
                icon="business-outline"
                title="لا توجد شركات"
                body={companies.length ? 'لا توجد نتائج مطابقة لبحثك' : 'أضف شركتك الأولى لبدء تسجيل الأعمال'}
                actionLabel={companies.length ? undefined : can(role, 'companies.create') ? 'شركة جديدة' : undefined}
                onAction={companies.length ? undefined : can(role, 'companies.create') ? () => nav.navigate('CompanyForm') : undefined}
              />
            </Card>
          }
        />
      </View>
      {can(role, 'companies.create') ? <FAB onPress={() => nav.navigate('CompanyForm')} /> : null}
    </Screen>
  );
}
