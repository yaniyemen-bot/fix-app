import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import { Btn, Card, Chip, ChipRow, Field, Notice, OptionPicker, Screen, ScreenHeader, SelectField, StickyFooter, rtlText } from '../components/ui';
import { DatePickerModal } from '../components/Calendar';
import { formatMoney, formatQuantity, todayISO } from '../lib/format';
import { UNITS, WORK_TYPES } from '../lib/seed';
import { can } from '../lib/permissions';

export default function WorkFormScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { works, companies, currency, role, saveWork, showToast, companyById } = useApp();

  const params = route.params ?? {};
  const existing = params.workId ? works.find((w) => w.id === params.workId) : undefined;

  const [date, setDate] = useState<string>(existing?.date ?? params.date ?? todayISO());
  const [companyId, setCompanyId] = useState<string>(existing?.companyId ?? params.companyId ?? '');
  const [type, setType] = useState(existing?.type ?? '');
  const [quantity, setQuantity] = useState(existing ? `${existing.quantity}` : '1');
  const [unit, setUnit] = useState(existing?.unit ?? UNITS[0]);
  const [unitPrice, setUnitPrice] = useState(existing ? `${existing.unitPrice}` : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [dateOpen, setDateOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);

  const qty = Number(quantity.replace(/[^0-9.]/g, '')) || 0;
  const price = Number(unitPrice.replace(/[^0-9.]/g, '')) || 0;
  const total = qty * price;
  const company = companyById(companyId);

  const companyOptions = useMemo(
    () => companies.map((co) => ({ value: co.id, label: co.name, hint: co.phone })),
    [companies]
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!companyId) e.company = 'اختر الشركة أو العميل';
    if (!type.trim()) e.type = 'اكتب نوع العمل';
    if (qty <= 0) e.quantity = 'أدخل كمية أكبر من صفر';
    if (price < 0) e.unitPrice = 'أدخل سعرًا صحيحًا';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!can(role, 'works.create') && !existing) {
      showToast('دورك الحالي لا يسمح بإضافة أعمال', 'error');
      return;
    }
    if (!validate()) {
      showToast('تحقق من الحقول المطلوبة', 'error');
      return;
    }
    saveWork(
      {
        companyId,
        date,
        type: type.trim(),
        quantity: qty,
        unit,
        unitPrice: price,
        notes: notes.trim(),
      },
      existing?.id
    );
    showToast(existing ? 'تم حفظ التعديلات' : 'تمت إضافة العمل');
    nav.goBack();
  };

  return (
    <Screen>
      <ScreenHeader
        title={existing ? 'تعديل العمل' : 'إضافة عمل جديد'}
        subtitle={existing ? `مسجل بتاريخ ${existing.date}` : 'سجّل تفاصيل العمل اليومي بدقة لسهولة الفوترة'}
        onBack={() => nav.goBack()}
      />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {companies.length === 0 ? (
          <Notice
            tone="warning"
            icon="alert-circle"
            text="لا توجد شركات - أضف شركة أولًا من تبويب الشركات لتتمكن من تسجيل الأعمال."
          />
        ) : null}

        <SelectField
          label="التاريخ"
          value={date}
          onPress={() => setDateOpen(true)}
          icon="calendar"
          required
        />

        <SelectField
          label="الشركة / العميل"
          value={company?.name}
          placeholder={companies.length ? 'اختر الشركة' : 'لا توجد شركات - أضف شركة أولًا'}
          onPress={() => (companies.length ? setCompanyOpen(true) : nav.navigate('CompanyForm'))}
          icon="business"
          required
          error={errors.company}
        />

        <Field
          label="نوع العمل"
          value={type}
          onChangeText={setType}
          placeholder="مثال: توريد مواد، صيانة، نقل..."
          error={errors.type}
          required
        />
        <ChipRow>
          {WORK_TYPES.map((t) => (
            <Chip key={t} label={t} selected={type === t} onPress={() => setType(t)} />
          ))}
        </ChipRow>

        <View style={{ flexDirection: 'row-reverse', gap: SPACING.md }}>
          <View style={{ flex: 1 }}>
            <Field
              label="الكمية"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="0"
              error={errors.quantity}
              required
            />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField label="الوحدة" value={unit} onPress={() => setUnitOpen(true)} icon="cube-outline" />
          </View>
        </View>

        <Field
          label="سعر الوحدة"
          value={unitPrice}
          onChangeText={setUnitPrice}
          keyboardType="numeric"
          placeholder="0.00"
          suffix={currency.symbol || currency.code}
          error={errors.unitPrice}
          required
        />

        <Card style={{ backgroundColor: c.primarySoft, borderColor: c.primarySoft, marginBottom: SPACING.lg }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
              <Ionicons name="calculator-outline" size={18} color={c.primaryText} />
              <Text style={[rtlText, { color: c.primaryText, fontSize: 13.5, fontWeight: '700' }]}>الإجمالي</Text>
            </View>
            <Text style={[rtlText, { color: c.primaryText, fontSize: 18, fontWeight: '800' }]}>{formatMoney(total, currency)}</Text>
          </View>
          <Text style={[rtlText, { color: c.primaryText, fontSize: 11.5, marginTop: 6, opacity: 0.8 }]}>
            {formatQuantity(qty)} {unit} × {formatMoney(price, currency)}
          </Text>
        </Card>

        <Field
          label="ملاحظات (اختياري)"
          value={notes}
          onChangeText={setNotes}
          placeholder="أي تفاصيل إضافية..."
          multiline
        />

        {existing?.invoiceId ? (
          <Notice
            tone="info"
            icon="link"
            text="هذا العمل مرتبط بفاتورة صادرة. تعديل الكمية أو السعر سيستدعي إعادة حساب الفاتورة عند فك الارتباط."
          />
        ) : null}
      </ScrollView>

      <StickyFooter>
        <View style={{ flex: 2 }}>
          <Btn label={existing ? 'حفظ التعديلات' : 'حفظ العمل'} icon="checkmark" onPress={submit} />
        </View>
        <View style={{ flex: 1 }}>
          <Btn label="إلغاء" variant="outline" onPress={() => nav.goBack()} />
        </View>
      </StickyFooter>

      <DatePickerModal visible={dateOpen} value={date} onSelect={setDate} onClose={() => setDateOpen(false)} maxDate={undefined} />
      <OptionPicker
        visible={companyOpen}
        title="اختر الشركة"
        options={companyOptions}
        selected={companyId}
        onSelect={setCompanyId}
        onClose={() => setCompanyOpen(false)}
        emptyText="لا توجد شركات - أضف شركة أولًا"
      />
      <OptionPicker
        visible={unitOpen}
        title="اختر الوحدة"
        options={UNITS.map((u) => ({ value: u, label: u }))}
        selected={unit}
        onSelect={setUnit}
        onClose={() => setUnitOpen(false)}
        searchable={false}
      />
    </Screen>
  );
}
