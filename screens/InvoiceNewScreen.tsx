import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import { Btn, Card, Chip, ChipRow, Field, Notice, OptionPicker, Screen, ScreenHeader, SelectField, StickyFooter, rtlText } from '../components/ui';
import { TotalsBlock } from '../components/cards';
import { DatePickerModal, MonthPickerModal } from '../components/Calendar';
import {
  addDays,
  addMonthsToKey,
  currentMonthKey,
  formatDateShort,
  formatMoney,
  formatQuantity,
  monthLabel,
  monthRange,
  todayISO,
} from '../lib/format';
import { can } from '../lib/permissions';

export default function InvoiceNewScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { companies, works, settings, currency, role, createInvoice, showToast, companyById, workTotal, invoicesOfCompany } = useApp();

  const params = route.params ?? {};
  const [companyId, setCompanyId] = useState<string>(params.companyId ?? '');
  const [monthKey, setMonthKey] = useState<string>(params.monthKey ?? addMonthsToKey(currentMonthKey(), -1));
  const [selected, setSelected] = useState<string[]>([]);
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState(`${settings.defaultTaxRate}`);
  const [notes, setNotes] = useState('');
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(todayISO(), settings.paymentTermsDays || 14));

  const [companyOpen, setCompanyOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);

  const range = useMemo(() => monthRange(monthKey), [monthKey]);

  const candidates = useMemo(
    () =>
      works
        .filter((w) => !w.invoiceId)
        .filter((w) => (companyId ? w.companyId === companyId : true))
        .filter((w) => w.date >= range.start && w.date <= range.end)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [works, companyId, range]
  );

  useEffect(() => {
    setSelected((prev) => prev.filter((id) => candidates.some((w) => w.id === id)));
  }, [candidates]);

  useEffect(() => {
    if (!companyId && candidates.length === 0) return;
    if (selected.length === 0 && candidates.length > 0) {
      setSelected(candidates.map((w) => w.id));
    }
  }, [candidates, selected.length, companyId]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const subtotal = candidates.filter((w) => selected.includes(w.id)).reduce((s, w) => s + workTotal(w), 0);
  const disc = Math.max(0, Math.min(Number(discount.replace(/[^0-9.]/g, '')) || 0, subtotal));
  const rate = Math.max(0, Number(taxRate.replace(/[^0-9.]/g, '')) || 0);
  const taxAmount = Math.round((subtotal - disc) * (rate / 100) * 100) / 100;
  const total = Math.round((subtotal - disc + taxAmount) * 100) / 100;
  const company = companyById(companyId);

  const save = (status: 'draft' | 'issued') => {
    if (!can(role, 'invoices.create')) {
      showToast('دورك الحالي لا يسمح بإنشاء الفواتير', 'error');
      return;
    }
    if (!companyId) {
      showToast('اختر الشركة أولًا', 'error');
      return;
    }
    if (!selected.length) {
      showToast('اختر بندًا واحدًا على الأقل', 'error');
      return;
    }
    const invoice = createInvoice({
      companyId,
      periodStart: range.start,
      periodEnd: range.end,
      workIds: selected,
      discount: disc,
      taxRate: rate,
      notes: notes.trim(),
      status,
      issueDate,
      dueDate,
    });
    if (!invoice) {
      showToast('تعذر إنشاء الفاتورة', 'error');
      return;
    }
    showToast(status === 'draft' ? 'تم حفظ الفاتورة كمسودة' : `تم إصدار الفاتورة ${invoice.number}`);
    nav.replace('InvoiceDetail', { invoiceId: invoice.id });
  };

  return (
    <Screen>
      <ScreenHeader title="فاتورة جديدة" subtitle="اختر الشركة والفترة ثم حدد الأعمال غير المفوترة" onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 150 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SelectField
          label="الشركة / العميل"
          value={company?.name}
          placeholder={companies.length ? 'اختر الشركة' : 'لا توجد شركات - أضف شركة أولًا'}
          onPress={() => (companies.length ? setCompanyOpen(true) : nav.navigate('CompanyForm'))}
          icon="business"
          required
        />

        <SelectField label="فترة الفاتورة" value={monthLabel(monthKey)} onPress={() => setMonthOpen(true)} icon="calendar" required />

        <View style={{ flexDirection: 'row-reverse', gap: SPACING.md }}>
          <View style={{ flex: 1 }}>
            <SelectField label="تاريخ الإصدار" value={formatDateShort(issueDate)} onPress={() => setIssueOpen(true)} icon="calendar-outline" />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField label="تاريخ الاستحقاق" value={formatDateShort(dueDate)} onPress={() => setDueOpen(true)} icon="time-outline" />
          </View>
        </View>

        <Card style={{ marginBottom: SPACING.lg }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md }}>
            <Text style={[rtlText, { color: c.text, fontSize: 14.5, fontWeight: '800' }]}>بنود الفاتورة ({selected.length})</Text>
            {candidates.length > 0 ? (
              <Pressable
                onPress={() =>
                  setSelected((prev) => (prev.length === candidates.length ? [] : candidates.map((w) => w.id)))
                }
                hitSlop={8}
              >
                <Text style={[rtlText, { color: c.primary, fontSize: 12.5, fontWeight: '700' }]}>
                  {selected.length === candidates.length ? 'إلغاء التحديد' : 'تحديد الكل'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {candidates.length === 0 ? (
            <View style={{ paddingVertical: SPACING.lg }}>
              <Notice
                tone="warning"
                icon="information-circle"
                text={
                  companyId
                    ? `لا توجد أعمال غير مفوترة لهذه الشركة في ${monthLabel(monthKey)}`
                    : 'اختر الشركة لعرض الأعمال غير المفوترة في الفترة المحددة'
                }
              />
              <Btn
                label="إضافة عمل جديد"
                icon="add"
                variant="secondary"
                onPress={() => nav.navigate('WorkForm', { companyId: companyId || undefined })}
                disabled={!can(role, 'works.create')}
              />
            </View>
          ) : (
            candidates.map((w) => {
              const active = selected.includes(w.id);
              return (
                <Pressable
                  key={w.id}
                  onPress={() => toggle(w.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    gap: SPACING.md,
                    paddingVertical: 11,
                    paddingHorizontal: SPACING.sm,
                    borderRadius: RADIUS.md,
                    backgroundColor: active ? c.primarySoft : 'transparent',
                    opacity: pressed ? 0.75 : 1,
                    marginBottom: 4,
                  })}
                >
                  <Ionicons
                    name={active ? 'checkbox' : 'square-outline'}
                    size={21}
                    color={active ? c.primary : c.textFaint}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[rtlText, { color: c.text, fontSize: 13.5, fontWeight: '700' }]} numberOfLines={1}>
                      {w.type}
                    </Text>
                    <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5, marginTop: 2 }]}>
                      {formatDateShort(w.date)} • {formatQuantity(w.quantity)} {w.unit}
                    </Text>
                  </View>
                  <Text style={[rtlText, { color: c.primaryText, fontSize: 13, fontWeight: '800' }]}>
                    {formatMoney(workTotal(w), currency)}
                  </Text>
                </Pressable>
              );
            })
          )}
        </Card>

        <View style={{ flexDirection: 'row-reverse', gap: SPACING.md }}>
          <View style={{ flex: 1 }}>
            <Field
              label="الخصم"
              value={discount}
              onChangeText={setDiscount}
              keyboardType="numeric"
              suffix={currency.symbol || currency.code}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="الضريبة %" value={taxRate} onChangeText={setTaxRate} keyboardType="numeric" suffix="%" />
          </View>
        </View>

        <ChipRow>
          {[0, 5, 10, 15].map((r) => (
            <Chip key={r} label={`ضريبة ${r}%`} selected={rate === r} onPress={() => setTaxRate(`${r}`)} />
          ))}
        </ChipRow>

        <Field label="ملاحظات الفاتورة (اختياري)" value={notes} onChangeText={setNotes} placeholder="شروط الدفع، تفاصيل إضافية..." multiline />

        <TotalsBlock subtotal={subtotal} discount={disc} taxRate={rate} taxAmount={taxAmount} total={total} />
      </ScrollView>

      <StickyFooter>
        <View style={{ flex: 1.4 }}>
          <Btn label="إصدار الفاتورة" icon="send" onPress={() => save('issued')} disabled={!selected.length} />
        </View>
        <View style={{ flex: 1 }}>
          <Btn label="حفظ كمسودة" icon="save-outline" variant="outline" onPress={() => save('draft')} disabled={!selected.length} />
        </View>
      </StickyFooter>

      <OptionPicker
        visible={companyOpen}
        title="اختر الشركة"
        options={companies.map((co) => ({
          value: co.id,
          label: co.name,
          hint: `${invoicesOfCompany(co.id).length} فاتورة سابقة`,
        }))}
        selected={companyId}
        onSelect={(v) => {
          setCompanyId(v);
          setSelected([]);
        }}
        onClose={() => setCompanyOpen(false)}
      />
      <MonthPickerModal visible={monthOpen} value={monthKey} onSelect={setMonthKey} onClose={() => setMonthOpen(false)} />
      <DatePickerModal visible={issueOpen} value={issueDate} onSelect={setIssueDate} onClose={() => setIssueOpen(false)} />
      <DatePickerModal visible={dueOpen} value={dueDate} onSelect={setDueDate} onClose={() => setDueOpen(false)} />
    </Screen>
  );
}
