import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, usePalette } from '../lib/theme';
import { rtlText } from './ui';

export interface ChartDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

export function BarChart({
  data,
  formatValue,
  height = 150,
}: {
  data: ChartDatum[];
  formatValue: (v: number) => string;
  height?: number;
}) {
  const c = usePalette();
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-end', height, gap: 8 }}>
        {data.map((d, i) => (
          <AnimatedBar key={`${d.label}-${i}`} value={d.value} max={max} height={height} color={d.highlight ? c.primary : c.primarySoft} textColor={d.highlight ? (c.dark ? '#04211D' : '#fff') : c.primaryText} formatValue={formatValue} index={i} />
        ))}
      </View>
      <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: 8 }}>
        {data.map((d, i) => (
          <Text
            key={`lbl-${d.label}-${i}`}
            style={[rtlText, { flex: 1, textAlign: 'center', color: c.textFaint, fontSize: 10.5, fontWeight: '700' }]}
            numberOfLines={1}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function AnimatedBar({
  value,
  max,
  height,
  color,
  textColor,
  formatValue,
  index,
}: {
  value: number;
  max: number;
  height: number;
  color: string;
  textColor: string;
  formatValue: (v: number) => string;
  index: number;
}) {
  const c = usePalette();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 650,
      delay: index * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, index]);
  const ratio = value / max;
  const barHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, Math.max(6, (height - 34) * (ratio || 0.02))],
  });
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height }}>
      <Text style={[rtlText, { color: c.textMuted, fontSize: 9.5, marginBottom: 4, fontWeight: '700' }]} numberOfLines={1}>
        {value > 0 ? formatValue(value) : ''}
      </Text>
      <Animated.View
        style={{
          width: '100%',
          height: barHeight,
          backgroundColor: value > 0 ? color : c.surfaceAlt,
          borderRadius: RADIUS.sm,
        }}
      />
      <View style={{ height: 0, backgroundColor: textColor }} />
    </View>
  );
}

export function StackedBar({
  segments,
  total,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
}) {
  const c = usePalette();
  const safeTotal = total || segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <View>
      <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: c.surfaceAlt }}>
        {segments.map((s) =>
          s.value > 0 ? (
            <View key={s.label} style={{ width: `${(s.value / safeTotal) * 100}%`, backgroundColor: s.color }} />
          ) : null
        )}
      </View>
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
        {segments.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }} />
            <Text style={[rtlText, { color: c.textMuted, fontSize: 12, fontWeight: '600' }]}>
              {s.label} ({s.value})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function RankedList({
  items,
  formatValue,
}: {
  items: { label: string; value: number; hint?: string }[];
  formatValue: (v: number) => string;
}) {
  const c = usePalette();
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) {
    return (
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 12 }}>
        <Ionicons name="stats-chart-outline" size={16} color={c.textFaint} />
        <Text style={[rtlText, { color: c.textFaint, fontSize: 13 }]}>لا توجد بيانات</Text>
      </View>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      {items.map((item, idx) => (
        <View key={`${item.label}-${idx}`}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                backgroundColor: idx === 0 ? c.primarySoft : c.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={[rtlText, { color: idx === 0 ? c.primaryText : c.textFaint, fontSize: 10.5, fontWeight: '800' }]}>
                {idx + 1}
              </Text>
            </View>
            <Text style={[rtlText, { flex: 1, color: c.text, fontSize: 13, fontWeight: '700' }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[rtlText, { color: c.textMuted, fontSize: 12, fontWeight: '800' }]}>{formatValue(item.value)}</Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${(item.value / max) * 100}%`, backgroundColor: idx === 0 ? c.primary : c.primarySoft, borderRadius: 3 }} />
          </View>
          {item.hint ? (
            <Text style={[rtlText, { color: c.textFaint, fontSize: 11, marginTop: 4 }]}>{item.hint}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
