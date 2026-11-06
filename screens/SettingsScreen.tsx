import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import { Btn, Card, ConfirmDialog, Field, MenuRow, Notice, Screen, ScreenHeader, SectionHeader, StickyFooter, rtlText } from '../components/ui';
import { exportCsv, exportMetaRows, safeFileName } from '../lib/exporters';
import { formatMoney } from '../lib/format';
import { ROLE_LABELS, can } from '../lib/permissions';

export default function SettingsScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const {
    settings,
    currency,
    role,
    currentUser,
    companies,
    works,
    invoices,
    updateSettings,
    clearAllData,
    showToast,
  } = useApp();

  const editable = can(role, 'settings.edit');
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phone, setPhone] = useState(settings.phone);
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber);
  const [address, setAddress] = useState(settings.address);
  const [monthlyLimit, setMonthlyLimit] = useState(`${settings.monthlyLimit}`);
  const [defaultTaxRate, setDefaultTaxRate] = useState(`${settings.defaultTaxRate}`);
  const [paymentTermsDays, setPaymentTermsDays] = useState(`${settings.paymentTermsDays}`);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.1.0';

  const save = () => {
    if (!editable) {
      showToast('دورك الحالي لا يسمح بتعديل الإعدادات', 'error');
      return;
    }
    if (!businessName.trim()) {
      showToast('اسم المنشأة مطلوب', 'error');
      return;
    }
    updateSettings({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      taxNumber: taxNumber.trim(),
      address: address.trim(),
      monthlyLimit: Math.max(0, Number(monthlyLimit.replace(/[^0-9.]/g, '')) || 0),
      defaultTaxRate: Math.max(0, Math.min(100, Number(defaultTaxRate.replace(/[^0-9.]/g, '')) || 0)),
      paymentTermsDays: Math.max(0, Number(paymentTermsDays.replace(/[^0-9.]/g, '')) || 0),
    });
    showToast('تم حفظ الإعدادات');
  };

  const backup = async () => {
    if (!can(role, 'export.data')) {
      showToast('دورك الحالي لا يسمح بالتصدير', 'error');
      return;
    }
    setBusy(true);
    const rows: (string | number)[][] = [
      ...exportMetaRows(settings, currentUser.name, currency),
      ['النوع', 'الاسم/البيان', 'التاريخ', 'الكمية', 'الوحدة', 'السعر', 'الإجمالي', 'العملة', 'الحالة', 'المسؤول'],
      ...companies.map((co) => ['شركة', co.name, co.createdAt, '', '', '', '', currency.code, co.phone, currentUser.name]),
      ...works.map((w) => [
        'عمل',
        `${w.type} - ${companies.find((x) => x.id === w.companyId)?.name ?? ''}`,
        w.date,
        w.quantity,
        w.unit,
        w.unitPrice,
        (Number(w.quantity) || 0) * (Number(w.unitPrice) || 0),
        currency.code,
        w.invoiceId ? 'مفوتر' : 'غير مفوتر',
        currentUser.name,
      ]),
      ...invoices.map((i) => [
        'فاتورة',
        `${i.number} - ${companies.find((x) => x.id === i.companyId)?.name ?? ''}`,
        i.issueDate,
        i.workIds.length,
        'بند',
        i.taxRate,
        i.total,
        currency.code,
        i.status === 'paid' ? 'مدفوعة' : i.status === 'issued' ? 'مستحقة' : 'مسودة',
        currentUser.name,
      ]),
    ];
    const res = await exportCsv(`${safeFileName(settings.businessName)}-backup.csv`, rows);
    setBusy(false);
    showToast(res === 'failed' ? 'تعذر إنشاء النسخة الاحتياطية' : 'تم تنزيل نسخة من جميع الأعمال (CSV)', res === 'failed' ? 'error' : 'success');
  };

  return (
    <Screen>
      <ScreenHeader title="الإعدادات" subtitle={`${ROLE_LABELS[role]} • ${currentUser.name}`} onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!editable ? (
          <Notice tone="warning" icon="lock-closed" text="دورك الحالي لا يسمح بتعديل الإعدادات - الحقول للعرض فقط." />
        ) : null}

        <SectionHeader title="بيانات المنشأة" icon="business-outline" />
        <Card style={{ marginBottom: SPACING.lg }}>
          <Field label="اسم المنشأة" value={businessName} onChangeText={setBusinessName} placeholder="اسم مؤسستك" editable={editable} required />
          <Field label="اسم المسؤول" value={ownerName} onChangeText={setOwnerName} placeholder="الاسم الذي يظهر في الترحيب" editable={editable} />
          <Field label="رقم الهاتف" value={phone} onChangeText={setPhone} placeholder="05xxxxxxxx" keyboardType="phone-pad" editable={editable} />
          <Field label="الرقم الضريبي" value={taxNumber} onChangeText={setTaxNumber} placeholder="3000000000000003" keyboardType="number-pad" editable={editable} />
          <Field label="العنوان" value={address} onChangeText={setAddress} placeholder="المدينة - الحي - الشارع" editable={editable} />
        </Card>

        <SectionHeader title="العملة" icon="cash-outline" />
        <Card padded={false} style={{ overflow: 'hidden', marginBottom: SPACING.lg }}>
          <MenuRow
            label="نوع العملة"
            icon="cash-outline"
            onPress={() => nav.navigate('Currency')}
            hint={`${currency.name} • ${currency.code} • ${currency.decimals} خانات عشرية`}
            right={
              <View style={{ backgroundColor: c.primarySoft, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={[rtlText, { color: c.primaryText, fontSize: 12, fontWeight: '800' }]}>{currency.symbol}</Text>
              </View>
            }
          />
          <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
              <Ionicons name="eye-outline" size={14} color={c.textFaint} />
              <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5 }]}>معاينة:</Text>
              <Text style={[rtlText, { color: c.text, fontSize: 13, fontWeight: '800' }]}>{formatMoney(12500.5, currency)}</Text>
            </View>
            <Text style={[rtlText, { color: c.primary, fontSize: 11.5, marginTop: 6, fontWeight: '700' }]}>
              يمكنك إدخال أي عملة يدويًا (الرمز والكود والخانات العشرية)
            </Text>
          </View>
        </Card>

        <SectionHeader title="الإعدادات المالية" icon="trending-up-outline" />
        <Card style={{ marginBottom: SPACING.lg }}>
          <Field
            label="الحد المالي الشهري (للتنبيه عند التجاوز)"
            value={monthlyLimit}
            onChangeText={setMonthlyLimit}
            keyboardType="numeric"
            placeholder="0"
            suffix={currency.symbol || currency.code}
            editable={editable}
            hint="0 = بدون حد"
          />
          <Field
            label="نسبة الضريبة الافتراضية %"
            value={defaultTaxRate}
            onChangeText={setDefaultTaxRate}
            keyboardType="numeric"
            suffix="%"
            editable={editable}
          />
          <Field
            label="مدة السداد الافتراضية (أيام)"
            value={paymentTermsDays}
            onChangeText={setPaymentTermsDays}
            keyboardType="numeric"
            suffix="يوم"
            editable={editable}
            hint="تُستخدم لحساب تاريخ استحقاق الفواتير الجديدة"
          />
        </Card>

        <SectionHeader title="التطبيق والتنزيل" icon="phone-portrait-outline" />
        <Card padded={false} style={{ overflow: 'hidden', marginBottom: SPACING.lg }}>
          <MenuRow
            label="تنزيل التطبيق بصيغة APK"
            icon="logo-android"
            tone="primary"
            onPress={() => nav.navigate('Apk')}
            hint="نسخة أندرويد قابلة للتثبيت + خطوات البناء عبر EAS"
          />
          <MenuRow label="المسؤولون والصلاحيات" icon="people-outline" onPress={() => nav.navigate('Users')} hint="تعيين المسؤولين وتسميتهم والتبديل بينهم" />
          <MenuRow label="التقارير" icon="stats-chart-outline" onPress={() => nav.navigate('Reports')} hint="تحليل الإيرادات والتحصيل" />
        </Card>

        <SectionHeader title="النسخ الاحتياطي" icon="cloud-download-outline" />
        <Card style={{ marginBottom: SPACING.lg }}>
          <Btn label="تنزيل نسخة من جميع الأعمال (CSV)" icon="download-outline" onPress={backup} loading={busy} variant="secondary" />
          <View style={{ marginTop: SPACING.md }}>
            <Btn
              label="مسح جميع البيانات"
              icon="trash-outline"
              variant="danger"
              onPress={() => {
                if (!editable) {
                  showToast('دورك الحالي لا يسمح بمسح البيانات', 'error');
                  return;
                }
                setConfirmClear(true);
              }}
            />
          </View>
          <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5, marginTop: SPACING.md, lineHeight: 18 }]}>
            البيانات محفوظة محليًا على جهازك فقط ({companies.length} شركة، {works.length} عمل، {invoices.length} فاتورة).
          </Text>
        </Card>

        <Card>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.md }}>
            <View style={{ width: 42, height: 42, borderRadius: RADIUS.lg, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="information-circle-outline" size={20} color={c.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[rtlText, { color: c.text, fontSize: 13.5, fontWeight: '800' }]}>نظام إدارة الأعمال والفواتير</Text>
              <Text style={[rtlText, { color: c.textMuted, fontSize: 11.5, marginTop: 4, lineHeight: 18 }]}>
                الإصدار {version} • يعمل محليًا بدون إنترنت • دعم كامل للغة العربية
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {editable ? (
        <StickyFooter>
          <View style={{ flex: 1 }}>
            <Btn label="حفظ الإعدادات" icon="checkmark" onPress={save} />
          </View>
        </StickyFooter>
      ) : null}

      <ConfirmDialog
        visible={confirmClear}
        title="مسح جميع البيانات"
        body="سيتم حذف كل الشركات والأعمال والفواتير من هذا الجهاز نهائيًا مع الإبقاء على الإعدادات. لا يمكن التراجع."
        confirmLabel="مسح الكل"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAllData();
          setConfirmClear(false);
          showToast('تم مسح جميع البيانات', 'info');
        }}
      />
    </Screen>
  );
}
