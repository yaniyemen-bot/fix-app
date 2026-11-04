import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import { Btn, Card, Chip, ChipRow, Field, Notice, Screen, ScreenHeader, SectionHeader, Segmented, StickyFooter, rtlText } from '../components/ui';
import { CURRENCY_PRESETS, DECIMAL_SEPARATORS, THOUSAND_SEPARATORS, currencyFromPreset } from '../lib/currencies';
import { formatMoney } from '../lib/format';
import { CurrencySettings } from '../lib/types';
import { can } from '../lib/permissions';

type Mode = 'preset' | 'manual';

export default function CurrencyScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const { currency, updateCurrency, role, showToast } = useApp();
  const editable = can(role, 'settings.edit');

  const [mode, setMode] = useState<Mode>(currency.preset ? 'preset' : 'manual');
  const [draft, setDraft] = useState<CurrencySettings>(currency);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const patch = (p: Partial<CurrencySettings>, manual = true) => {
    setDraft((d) => ({ ...d, ...p, preset: manual ? null : p.preset ?? null }));
    if (manual) setMode('manual');
  };

  const pickPreset = (code: string) => {
    const preset = CURRENCY_PRESETS.find((p) => p.code === code);
    if (!preset) return;
    setDraft(currencyFromPreset(preset));
    setMode('preset');
    setErrors({});
  };

  const samples = useMemo(() => [1250.5, 1500000, 0.75], []);

  const save = () => {
    const e: Record<string, string> = {};
    const symbol = draft.symbol.trim();
    const code = draft.code.trim().toUpperCase();
    if (!symbol && !code) e.symbol = 'اكتب رمز العملة أو كود العملة يدويًا';
    if (code && !/^[A-Za-z\u0600-\u06FF]{2,8}$/.test(code)) e.code = 'كود العملة من 2 إلى 8 أحرف';
    setErrors(e);
    if (Object.keys(e).length) {
      showToast('تحقق من بيانات العملة', 'error');
      return;
    }
    updateCurrency({
      ...draft,
      symbol,
      code,
      name: draft.name.trim() || code || 'عملة مخصصة',
      thousands: draft.thousands || ',',
      decimalSep: draft.decimalSep || '.',
    });
    showToast(`تم حفظ العملة: ${symbol || code}`);
    nav.goBack();
  };

  return (
    <Screen>
      <ScreenHeader
        title="نوع العملة"
        subtitle="اختر عملة جاهزة أو أدخل نوع العملة يدويًا"
        onBack={() => nav.goBack()}
        right={
          <View style={{ backgroundColor: c.primarySoft, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={[rtlText, { color: c.primaryText, fontSize: 12, fontWeight: '800' }]}>{draft.symbol || draft.code}</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!editable ? (
          <Notice tone="warning" icon="lock-closed" text="دورك الحالي لا يسمح بتعديل الإعدادات - يمكنك المعاينة فقط." />
        ) : null}

        <View style={{ marginBottom: SPACING.lg }}>
          <Segmented<Mode>
            options={[
              { value: 'preset', label: 'عملات شائعة' },
              { value: 'manual', label: 'إدخال يدوي' },
            ]}
            value={mode}
            onChange={(v) => {
              setMode(v);
              if (v === 'manual') setDraft((d) => ({ ...d, preset: null }));
            }}
          />
        </View>

        {mode === 'preset' ? (
          <>
            <Card style={{ marginBottom: SPACING.lg }}>
              <Text style={[rtlText, { color: c.textMuted, fontSize: 12.5, lineHeight: 20 }]}>
                اختر عملة جاهزة ثم يمكنك تعديل رمزها أو خاناتها العشرية يدويًا من تبويب «إدخال يدوي».
              </Text>
            </Card>
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg }}>
              {CURRENCY_PRESETS.map((p) => {
                const active = draft.preset === p.code || draft.code === p.code;
                return (
                  <Pressable
                    key={p.code}
                    disabled={!editable}
                    onPress={() => pickPreset(p.code)}
                    style={({ pressed }) => ({
                      width: '31.5%',
                      borderRadius: RADIUS.md,
                      borderWidth: 1,
                      borderColor: active ? c.primary : c.border,
                      backgroundColor: active ? c.primarySoft : c.surface,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      alignItems: 'center',
                      gap: 4,
                      opacity: pressed ? 0.75 : editable ? 1 : 0.5,
                    })}
                  >
                    <Text style={[rtlText, { color: active ? c.primaryText : c.text, fontSize: 16, fontWeight: '800' }]}>{p.symbol}</Text>
                    <Text style={[rtlText, { color: active ? c.primaryText : c.textMuted, fontSize: 11.5, fontWeight: '700', textAlign: 'center' }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={[rtlText, { color: c.textFaint, fontSize: 10 }]}>{p.code}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                disabled={!editable}
                onPress={() => {
                  setDraft((d) => ({ ...d, preset: null }));
                  setMode('manual');
                }}
                style={({ pressed }) => ({
                  width: '31.5%',
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: c.primary,
                  backgroundColor: c.surface,
                  paddingVertical: 16,
                  alignItems: 'center',
                  gap: 4,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Ionicons name="add-circle-outline" size={20} color={c.primary} />
                <Text style={[rtlText, { color: c.primaryText, fontSize: 12, fontWeight: '800' }]}>عملة أخرى يدويًا</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Notice
              tone="primary"
              icon="create-outline"
              text="الإدخال اليدوي يتيح لك كتابة أي عملة: رمزها واسمها وكودها وعدد خاناتها العشرية. مثال: د.ج / DZD أو ₿ / BTC."
            />
            <Field
              label="رمز العملة (يظهر مع المبالغ)"
              value={draft.symbol}
              onChangeText={(t) => patch({ symbol: t })}
              placeholder="مثال: ر.س ، $ ، د.ع ، ₿"
              maxLength={10}
              editable={editable}
              error={errors.symbol}
              required
              hint="اكتب الرمز كما تريد أن يظهر في الفواتير والتقارير"
            />
            <Field
              label="كود العملة"
              value={draft.code}
              onChangeText={(t) => patch({ code: t.toUpperCase() })}
              placeholder="مثال: SAR"
              maxLength={8}
              autoCapitalize="characters"
              editable={editable}
              error={errors.code}
              hint="اختياري - يُستخدم في ملفات CSV والتصدير"
            />
            <Field
              label="اسم العملة"
              value={draft.name}
              onChangeText={(t) => patch({ name: t })}
              placeholder="مثال: ريال سعودي"
              maxLength={30}
              editable={editable}
            />
          </>
        )}

        <SectionHeader title="طريقة عرض المبلغ" icon="options-outline" />
        <Card style={{ marginBottom: SPACING.lg }}>
          <Text style={[rtlText, { color: c.textMuted, fontSize: 12.5, fontWeight: '700', marginBottom: 8 }]}>عدد الخانات العشرية</Text>
          <ChipRow>
            {[0, 1, 2, 3].map((d) => (
              <Chip key={d} label={`${d} خانة`} selected={draft.decimals === d} onPress={() => editable && patch({ decimals: d }, false)} />
            ))}
          </ChipRow>

          <Text style={[rtlText, { color: c.textMuted, fontSize: 12.5, fontWeight: '700', marginBottom: 8, marginTop: SPACING.sm }]}>موضع الرمز</Text>
          <View style={{ marginBottom: SPACING.md }}>
            <Segmented<'before' | 'after'>
              options={[
                { value: 'after', label: 'بعد المبلغ (1,500 ر.س)' },
                { value: 'before', label: 'قبل المبلغ ($ 1,500)' },
              ]}
              value={draft.placement}
              onChange={(v) => editable && patch({ placement: v }, false)}
            />
          </View>

          <Text style={[rtlText, { color: c.textMuted, fontSize: 12.5, fontWeight: '700', marginBottom: 8, marginTop: SPACING.sm }]}>فاصل الآلاف</Text>
          <ChipRow>
            {THOUSAND_SEPARATORS.map((s) => (
              <Chip key={s.label} label={s.label} selected={draft.thousands === s.value} onPress={() => editable && patch({ thousands: s.value }, false)} />
            ))}
          </ChipRow>

          <Text style={[rtlText, { color: c.textMuted, fontSize: 12.5, fontWeight: '700', marginBottom: 8, marginTop: SPACING.sm }]}>فاصل الخانات العشرية</Text>
          <ChipRow>
            {DECIMAL_SEPARATORS.map((s) => (
              <Chip key={s.label} label={s.label} selected={draft.decimalSep === s.value} onPress={() => editable && patch({ decimalSep: s.value }, false)} />
            ))}
          </ChipRow>
        </Card>

        <SectionHeader title="معاينة مباشرة" icon="eye-outline" />
        <Card style={{ backgroundColor: c.primarySoft, borderColor: c.primarySoft, marginBottom: SPACING.lg }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: SPACING.md }}>
            <Ionicons name="cash-outline" size={17} color={c.primaryText} />
            <Text style={[rtlText, { color: c.primaryText, fontSize: 13, fontWeight: '800' }]}>
              {draft.name || 'عملتك'} ({draft.code || 'بدون كود'})
            </Text>
          </View>
          {samples.map((s) => (
            <View
              key={s}
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 9,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <Text style={[rtlText, { color: c.primaryText, fontSize: 12, opacity: 0.85 }]}>{s}</Text>
              <Text style={[rtlText, { color: c.primaryText, fontSize: 16, fontWeight: '800' }]}>{formatMoney(s, draft)}</Text>
            </View>
          ))}
          <Text style={[rtlText, { color: c.primaryText, fontSize: 11.5, marginTop: SPACING.md, opacity: 0.85 }]}>
            هكذا ستظهر المبالغ في كل الشاشات والفواتير والتقارير وملفات التصدير.
          </Text>
        </Card>
      </ScrollView>

      {editable ? (
        <StickyFooter>
          <View style={{ flex: 2 }}>
            <Btn label="حفظ العملة" icon="checkmark" onPress={save} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn label="إلغاء" variant="outline" onPress={() => nav.goBack()} />
          </View>
        </StickyFooter>
      ) : null}
    </Screen>
  );
}
