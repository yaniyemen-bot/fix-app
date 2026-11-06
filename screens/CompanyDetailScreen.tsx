import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import { Badge, Btn, Card, ConfirmDialog, EmptyState, InfoRow, Screen, ScreenHeader, Segmented, SectionHeader, StatTile, rtlText } from '../components/ui';
import { InvoiceCard, WorkCard } from '../components/cards';
import { formatDate, formatMoney } from '../lib/format';
import { can } from '../lib/permissions';

type TabKey = 'works' | 'invoices';

export default function CompanyDetailScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { companies, currency, role, deleteCompany, showToast, worksOfCompany, invoicesOfCompany, workTotal } = useApp();
  const [tab, setTab] = useState<TabKey>('works');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const company = companies.find((x) => x.id === route.params?.companyId);
  const works = useMemo(() => (company ? worksOfCompany(company.id) : []), [company, worksOfCompany]);
  const invoices = useMemo(() => (company ? invoicesOfCompany(company.id) : []), [company, invoicesOfCompany]);

  if (!company) {
    return (
      <Screen>
        <ScreenHeader title="الشركة" onBack={() => nav.goBack()} />
        <EmptyState icon="alert-circle-outline" title="الشركة غير موجودة" />
      </Screen>
    );
  }

  const worksTotal = works.reduce((s, w) => s + workTotal(w), 0);
  const due = invoices.filter((i) => i.status === 'issued').reduce((s, i) => s + i.total, 0);
  const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const unbilled = works.filter((w) => !w.invoiceId);

  return (
    <Screen>
      <ScreenHeader title={company.name} subtitle={company.phone || 'بدون رقم هاتف'} onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: SPACING.lg }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[rtlText, { color: c.primaryText, fontSize: 22, fontWeight: '800' }]}>{company.name.trim().charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[rtlText, { color: c.text, fontSize: 17, fontWeight: '800' }]} numberOfLines={1}>
                {company.name}
              </Text>
              <Text style={[rtlText, { color: c.textMuted, fontSize: 12, marginTop: 3 }]}>عميل منذ {formatDate(company.createdAt)}</Text>
            </View>
            {due > 0 ? <Badge label="عليه مستحقات" tone="warning" /> : <Badge label="لا مستحقات" tone="success" />}
          </View>
          <InfoRow label="الهاتف" value={company.phone} icon="call-outline" />
          <InfoRow label="العنوان" value={company.address} icon="location-outline" />
          <InfoRow label="البريد الإلكتروني" value={company.email} icon="mail-outline" />
          <InfoRow label="الرقم الضريبي" value={company.taxNumber ? `سجل ضريبي: ${company.taxNumber}` : ''} icon="key-outline" />
          <InfoRow label="ملاحظات" value={company.notes} icon="document-text-outline" />
        </Card>

        <View style={{ flexDirection: 'row-reverse', gap: SPACING.md, marginBottom: SPACING.md }}>
          <StatTile title="إجمالي الأعمال" value={formatMoney(worksTotal, currency)} icon="hammer" tone="primary" subtitle={`${works.length} عمل`} />
          <StatTile title="مستحقات" value={formatMoney(due, currency)} icon="wallet" tone={due ? 'warning' : 'success'} subtitle={`محصّل ${formatMoney(paid, currency)}`} />
        </View>

        <View style={{ flexDirection: 'row-reverse', gap: SPACING.md, marginBottom: SPACING.lg }}>
          <View style={{ flex: 1 }}>
            <Btn label="إضافة عمل" icon="add" variant="secondary" compact onPress={() => nav.navigate('WorkForm', { companyId: company.id })} disabled={!can(role, 'works.create')} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn label="فاتورة" icon="document-text" variant="secondary" compact onPress={() => nav.navigate('InvoiceNew', { companyId: company.id })} disabled={!can(role, 'invoices.create')} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn label="تعديل" icon="create-outline" variant="outline" compact onPress={() => nav.navigate('CompanyForm', { companyId: company.id })} disabled={!can(role, 'companies.edit')} />
          </View>
        </View>

        <Segmented<TabKey>
          options={[
            { value: 'works', label: `الأعمال (${works.length})` },
            { value: 'invoices', label: `الفواتير (${invoices.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />

        <View style={{ marginTop: SPACING.lg }}>
          {tab === 'works' ? (
            works.length ? (
              works.map((w) => <WorkCard key={w.id} work={w} onPress={() => nav.navigate('WorkDetail', { workId: w.id })} />)
            ) : (
              <Card>
                <EmptyState icon="hammer-outline" title="لا توجد أعمال" body="لم يتم تسجيل أعمال لهذه الشركة بعد" />
              </Card>
            )
          ) : invoices.length ? (
            invoices.map((i) => <InvoiceCard key={i.id} invoice={i} onPress={() => nav.navigate('InvoiceDetail', { invoiceId: i.id })} />)
          ) : (
            <Card>
              <EmptyState icon="document-text-outline" title="لا توجد فواتير" body="لم يتم إصدار فواتير لهذه الشركة بعد" />
            </Card>
          )}
        </View>

        {unbilled.length ? (
          <Card style={{ marginTop: SPACING.md, backgroundColor: c.warningSoft, borderColor: c.warningSoft }}>
            <Text style={[rtlText, { color: c.warning, fontSize: 13, fontWeight: '800' }]}>
              {unbilled.length} عمل غير مفوتر بقيمة {formatMoney(unbilled.reduce((s, w) => s + workTotal(w), 0), currency)}
            </Text>
          </Card>
        ) : null}

        <View style={{ marginTop: SPACING.xl }}>
          <Btn
            label="حذف الشركة"
            icon="trash-outline"
            variant="danger"
            onPress={() => {
              if (!can(role, 'companies.delete')) {
                showToast('دورك الحالي لا يسمح بحذف الشركات', 'error');
                return;
              }
              setConfirmDelete(true);
            }}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="حذف الشركة"
        body={`سيتم حذف ${company.name} مع ${works.length} عمل و ${invoices.length} فاتورة مرتبطة بها. لا يمكن التراجع.`}
        confirmLabel="حذف نهائي"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteCompany(company.id);
          setConfirmDelete(false);
          showToast('تم حذف الشركة وبياناتها', 'info');
          nav.goBack();
        }}
      />
    </Screen>
  );
}
