import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, TouchableWithoutFeedback, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { AR_DAYS, AR_MONTHS, pad, parseISO, toISODate, todayISO } from '../lib/format';
import { Btn, rtlText } from './ui';

const WEEK_HEADERS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export function DatePickerModal({
  visible,
  value,
  onSelect,
  onClose,
  title = 'اختر التاريخ',
  minDate,
  maxDate,
}: {
  visible: boolean;
  value: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
  title?: string;
  minDate?: string;
  maxDate?: string;
}) {
  const c = usePalette();
  const initial = value && value.length >= 10 ? parseISO(value) : new Date();
  const [cursor, setCursor] = useState({ y: initial.getFullYear(), m: initial.getMonth() });
  const today = todayISO();

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const out: (string | null)[] = [];
    for (let i = 0; i < startDay; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(`${cursor.y}-${pad(cursor.m + 1)}-${pad(d)}`);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [cursor]);

  const move = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl }} />
      </TouchableWithoutFeedback>
      <View
        style={{
          position: 'absolute',
          top: '50%',
          alignSelf: 'center',
          marginTop: -230,
          width: '100%',
          maxWidth: 380,
          backgroundColor: c.surface,
          borderRadius: RADIUS.xl,
          padding: SPACING.lg,
        }}
      >
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md }}>
          <Pressable onPress={() => move(1)} hitSlop={8} style={{ padding: 6 }}>
            <Ionicons name="chevron-forward" size={20} color={c.text} />
          </Pressable>
          <Text style={[rtlText, { color: c.text, fontSize: 16, fontWeight: '800' }]}>
            {AR_MONTHS[cursor.m]} {cursor.y}
          </Text>
          <Pressable onPress={() => move(-1)} hitSlop={8} style={{ padding: 6 }}>
            <Ionicons name="chevron-back" size={20} color={c.text} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row-reverse', marginBottom: 6 }}>
          {WEEK_HEADERS.map((d) => (
            <Text key={d} style={[rtlText, { flex: 1, textAlign: 'center', color: c.textFaint, fontSize: 11, fontWeight: '700' }]}>
              {d}
            </Text>
          ))}
        </View>

        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap' }}>
          {cells.map((iso, i) => {
            if (!iso) return <View key={`empty-${i}`} style={{ width: `${100 / 7}%`, height: 40 }} />;
            const selected = iso === value;
            const isToday = iso === today;
            const disabled = (minDate && iso < minDate) || (maxDate && iso > maxDate);
            const dayNum = Number(iso.slice(8, 10));
            return (
              <Pressable
                key={iso}
                disabled={!!disabled}
                onPress={() => {
                  onSelect(iso);
                  onClose();
                }}
                style={{
                  width: `${100 / 7}%`,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? c.primary : isToday ? c.primarySoft : 'transparent',
                    borderWidth: !selected && isToday ? 1 : 0,
                    borderColor: c.primary,
                    opacity: disabled ? 0.3 : 1,
                  }}
                >
                  <Text
                    style={[
                      rtlText,
                      {
                        color: selected ? (c.dark ? '#04211D' : '#fff') : isToday ? c.primaryText : c.text,
                        fontSize: 13,
                        fontWeight: selected || isToday ? '800' : '600',
                      },
                    ]}
                  >
                    {dayNum}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row-reverse', gap: SPACING.sm, marginTop: SPACING.md }}>
          <View style={{ flex: 1 }}>
            <Btn
              label="اليوم"
              variant="secondary"
              compact
              onPress={() => {
                onSelect(today);
                onClose();
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Btn label="إلغاء" variant="outline" compact onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function MonthPickerModal({
  visible,
  value,
  onSelect,
  onClose,
  title = 'اختر الشهر',
}: {
  visible: boolean;
  value: string; // YYYY-MM
  onSelect: (monthKey: string) => void;
  onClose: () => void;
  title?: string;
}) {
  const c = usePalette();
  const now = new Date();
  const [year, setYear] = useState(Number(value.slice(0, 4)) || now.getFullYear());
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl }} />
      </TouchableWithoutFeedback>
      <View
        style={{
          position: 'absolute',
          top: '50%',
          alignSelf: 'center',
          marginTop: -190,
          width: '100%',
          maxWidth: 360,
          backgroundColor: c.surface,
          borderRadius: RADIUS.xl,
          padding: SPACING.lg,
        }}
      >
        <Text style={[rtlText, { color: c.text, fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: SPACING.md }]}>
          {title}
        </Text>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md }}>
          <Pressable onPress={() => setYear((y) => y + 1)} hitSlop={8} style={{ padding: 6 }}>
            <Ionicons name="chevron-forward" size={20} color={c.text} />
          </Pressable>
          <Text style={[rtlText, { color: c.textMuted, fontSize: 15, fontWeight: '800' }]}>{year}</Text>
          <Pressable onPress={() => setYear((y) => y - 1)} hitSlop={8} style={{ padding: 6 }}>
            <Ionicons name="chevron-back" size={20} color={c.text} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
          {AR_MONTHS.map((m, idx) => {
            const key = `${year}-${pad(idx + 1)}`;
            const active = key === value;
            const future = key > `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
            return (
              <Pressable
                key={m}
                onPress={() => {
                  onSelect(key);
                  onClose();
                }}
                style={{
                  width: '31%',
                  paddingVertical: 12,
                  borderRadius: RADIUS.md,
                  backgroundColor: active ? c.primary : c.surfaceAlt,
                  alignItems: 'center',
                  opacity: future ? 0.4 : 1,
                }}
              >
                <Text style={[rtlText, { color: active ? (c.dark ? '#04211D' : '#fff') : c.text, fontSize: 13, fontWeight: '700' }]}>
                  {m}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ marginTop: SPACING.lg }}>
          <Btn label="إلغاء" variant="outline" compact onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

export { toISODate };
