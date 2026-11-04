import React from 'react';
import { FlatList, Text, View, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import { Badge, Card, EmptyState, Screen, ScreenHeader, rtlText } from '../components/ui';
import { formatMoney } from '../lib/format';
import { AlertItem } from '../lib/types';

const KIND_LABEL: Record<AlertItem['kind'], string> = {
  overdue: 'متأخرة',
  unpaid: 'بانتظار التحصيل',
  limit: 'الحد المالي',
  unbilled: 'غير مفوتر',
  draft: 'مسودة',
};

export default function AlertsScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const { alerts, currency } = useApp();

  const grouped = {
    danger: alerts.filter((a) => a.severity === 'danger').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
  };

  return (
    <Screen>
      <ScreenHeader title="الإشعارات والتنبيهات" subtitle="متابعة الفواتير المتأخرة والحد المالي والأعمال غير المفوترة" onBack={() => nav.goBack()} />
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md }}>
          <Card>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              <Counter label="عاجلة" value={grouped.danger} color={c.danger} />
              <Counter label="تحذيرات" value={grouped.warning} color={c.warning} />
              <Counter label="معلومات" value={grouped.info} color={c.info} />
            </View>
          </Card>
        </View>

        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={40}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }}
          renderItem={({ item }) => {
            const tone =
              item.severity === 'danger'
                ? { bg: c.dangerSoft, fg: c.danger, icon: 'warning' as const }
                : item.severity === 'warning'
                ? { bg: c.warningSoft, fg: c.warning, icon: 'time' as const }
                : { bg: c.infoSoft, fg: c.info, icon: 'information-circle' as const };
            return (
              <Card
                style={{ marginBottom: SPACING.md }}
                onPress={() => {
                  if (item.invoiceId) nav.navigate('InvoiceDetail', { invoiceId: item.invoiceId });
                  else if (item.companyId) nav.navigate('CompanyDetail', { companyId: item.companyId });
                  else if (item.kind === 'limit') nav.navigate('Settings');
                }}
              >
                <View style={{ flexDirection: 'row-reverse', gap: SPACING.md, alignItems: 'flex-start' }}>
                  <View style={{ width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: tone.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={tone.icon} size={19} color={tone.fg} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                      <Text style={[rtlText, { flex: 1, color: c.text, fontSize: 14, fontWeight: '800' }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Badge label={KIND_LABEL[item.kind]} tone={item.severity === 'danger' ? 'danger' : item.severity === 'warning' ? 'warning' : 'info'} />
                    </View>
                    <Text style={[rtlText, { color: c.textMuted, fontSize: 12.5, marginTop: 5, lineHeight: 19 }]}>{item.body}</Text>
                    {item.amount ? (
                      <Text style={[rtlText, { color: tone.fg, fontSize: 13, fontWeight: '800', marginTop: 6 }]}>
                        {formatMoney(item.amount, currency)}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-back" size={17} color={c.textFaint} />
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <Card>
              <EmptyState
                icon="checkmark-done-outline"
                title="لا توجد تنبيهات"
                body="لا توجد فواتير متأخرة أو تجاوز للحد المالي حاليًا - أداء ممتاز!"
              />
            </Card>
          }
        />
      </View>
    </Screen>
  );
}

function Counter({ label, value, color }: { label: string; value: number; color: string }) {
  const c = usePalette();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[rtlText, { color, fontSize: 22, fontWeight: '800' }]}>{value}</Text>
      <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}
