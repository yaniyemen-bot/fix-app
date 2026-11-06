import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SPACING } from '../lib/theme';
import { useApp } from '../state/AppContext';
import { Btn, Field, Screen, ScreenHeader, StickyFooter } from '../components/ui';

export default function CompanyFormScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { companies, saveCompany, showToast } = useApp();
  const existing = route.params?.companyId ? companies.find((x) => x.id === route.params.companyId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [taxNumber, setTaxNumber] = useState(existing?.taxNumber ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'اسم الشركة مطلوب';
    if (!phone.trim()) e.phone = 'رقم الهاتف مطلوب';
    else if (phone.replace(/[^0-9]/g, '').length < 7) e.phone = 'رقم الهاتف قصير جدًا';
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) e.email = 'صيغة البريد الإلكتروني غير صحيحة';
    setErrors(e);
    if (Object.keys(e).length) {
      showToast('تحقق من الحقول المطلوبة', 'error');
      return;
    }
    const saved = saveCompany(
      {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.trim(),
        taxNumber: taxNumber.trim(),
        notes: notes.trim(),
      },
      existing?.id
    );
    showToast(existing ? 'تم حفظ التعديلات' : 'تمت إضافة الشركة');
    if (existing) nav.goBack();
    else nav.replace('CompanyDetail', { companyId: saved.id });
  };

  return (
    <Screen>
      <ScreenHeader
        title={existing ? 'تعديل الشركة' : 'شركة جديدة'}
        subtitle="بيانات العميل تستخدم في الفواتير والتقارير"
        onBack={() => nav.goBack()}
      />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Field label="اسم الشركة" value={name} onChangeText={setName} placeholder="مثال: شركة النور للمقاولات" required error={errors.name} />
        <Field label="رقم الهاتف" value={phone} onChangeText={setPhone} placeholder="05xxxxxxxx" keyboardType="phone-pad" required error={errors.phone} />
        <Field label="العنوان" value={address} onChangeText={setAddress} placeholder="المدينة - الحي - الشارع" />
        <Field label="البريد الإلكتروني" value={email} onChangeText={setEmail} placeholder="name@company.com" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
        <Field label="الرقم الضريبي" value={taxNumber} onChangeText={setTaxNumber} placeholder="3000000000000003" keyboardType="number-pad" />
        <Field label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="تفاصيل إضافية عن العميل..." multiline />
      </ScrollView>

      <StickyFooter>
        <View style={{ flex: 2 }}>
          <Btn label={existing ? 'حفظ التعديلات' : 'إضافة الشركة'} icon="checkmark" onPress={submit} />
        </View>
        <View style={{ flex: 1 }}>
          <Btn label="إلغاء" variant="outline" onPress={() => nav.goBack()} />
        </View>
      </StickyFooter>
    </Screen>
  );
}
