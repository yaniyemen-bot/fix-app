import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import { Badge, Btn, Card, ConfirmDialog, EmptyState, InfoRow, Notice, Screen, ScreenHeader, rtlText } from '../components/ui';
import { formatMoney, formatQuantity, formatDayWithWeekday } from '../lib/format';
import { can } from '../lib/permissions';

export default function WorkDetailScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { works, invoices, currency, role, deleteWork, unlinkWork, showToast, companyById } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const work = works.find((w) => w.id === route.params?.workId);
  if (!work) {
    return (
      <Screen>
        <ScreenHeader title="العمل" onBack={() => nav.goBack()} />
        <EmptyState icon="alert-circle-outline" title="العمل غير موجود" body="ربما تم حذفه من جهاز آخر أو من البيانات التجريبية" />
      </Screen>
    );
  }

  const company = companyById(work.companyId);
  const invoice = invoices.find((i) => i.id === work.invoiceId);
  const total = (Number(work.quantity) || 0) * (Number(work.unitPrice) || 0);

  return (
    <Screen>
      <ScreenHeader title="تفاصيل العمل" subtitle={work.type} onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: SPACING.lg }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <Text style={[rtlText, { color: c.text, fontSize: 18, fontWeight: '800' }]}>{work.type}</Text>
              <Text style={[rtlText, { color: c.textMuted, fontSize: 12.5, marginTop: 4 }]}>{formatDayWithWeekday(work.date)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[rtlText, { color: c.primaryText, fontSize: 19, fontWeight: '800' }]}>{formatMoney(total, currency)}</Text>
              <View style={{ marginTop: 6 }}>
                <Badge label={work.invoiceId ? 'مفوتر' : 'غير مفوتر'} tone={work.invoiceId ? 'success' : 'warning'} />
              </View>
            </View>
          </View>

          <InfoRow label="الشركة" value={company?.name} icon="business" onValuePress={company ? () => nav.navigate('CompanyDetail', { companyId: company.id }) : undefined} />
          <InfoRow label="التاريخ" value={work.date} icon="calendar-outline" />
          <InfoRow label="الكمية" value={`${formatQuantity(work.quantity)} ${work.unit}`} icon="cube-outline" />
          <InfoRow label="سعر الوحدة" value={formatMoney(work.unitPrice, currency)} icon="pricetag-outline" />
          <InfoRow label="الإجمالي" value={formatMoney(total, currency)} icon="calculator-outline" valueColor={c.primaryText} />
          <InfoRow label="ملاحظات" value={work.notes || '—'} icon="document-text-outline" />
        </Card>

        {invoice ? (
          <Card style={{ marginBottom: SPACING.lg }} onPress={() => nav.navigate('InvoiceDetail', { invoiceId: invoice.id })}>
            <Notice
              tone="primary"
              icon="link"
              text={`مرتبط بالفاتورة ${invoice.number} • ${formatMoney(invoice.total, currency)} — اضغط لعرض الفاتورة`}
            />
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row-reverse', gap: SPACING.md }}>
          <View style={{ flex: 1 }}>
            <Btn
              label="تعديل"
              icon="create-outline"
              variant="secondary"
              onPress={() => nav.navigate('WorkForm', { workId: work.id })}
              disabled={!can(role, 'works.edit')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Btn
              label="حذف"
              icon="trash-outline"
              variant="danger"
              onPress={() => setConfirmDelete(true)}
              disabled={!can(role, 'works.delete')}
            />
          </View>
        </View>

        {invoice && can(role, 'invoices.edit') ? (
          <View style={{ marginTop: SPACING.md }}>
            <Btn
              label="فك الارتباط بالفاتورة"
              icon="close-circle-outline"
              variant="outline"
              onPress={() => {
                unlinkWork(work.id);
                showToast('تم فك الارتباط وأعيد حساب الفاتورة', 'info');
              }}
            />
          </View>
        ) : null}

        {!can(role, 'works.delete') ? (
          <View style={{ marginTop: SPACING.lg }}>
            <Notice tone="info" icon="lock-closed" text="دورك الحالي لا يسمح بحذف الأعمال - يمكنك التعديل فقط." />
          </View>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="حذف العمل"
        body={`سيتم حذف «${work.type}» بقيمة ${formatMoney(total, currency)} نهائيًا. هل أنت متأكد؟`}
        confirmLabel="حذف"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteWork(work.id);
          setConfirmDelete(false);
          showToast('تم حذف العمل', 'info');
          nav.goBack();
        }}
      />
    </Screen>
  );
}
