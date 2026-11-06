import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, usePalette, Palette } from '../lib/theme';
import { useApp } from '../state/AppContext';

export const rtlText: TextStyle = { textAlign: 'right', writingDirection: 'rtl' };

export function Screen({
  children,
  scroll = false,
  style,
  contentStyle,
  refreshControl,
  keyboard = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: any;
  keyboard?: boolean;
}) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        { padding: SPACING.lg, paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 0 : 12) + 40 },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        { flex: 1, padding: SPACING.lg, paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 0 : 12) + 12 },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }, style]}>
      {keyboard && Platform.OS !== 'web' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  gradient,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  gradient?: [string, string];
}) {
  const c = usePalette();
  const bg = gradient ? gradient[0] : c.surface;
  const fg = gradient ? '#FFFFFF' : c.text;
  const sub = gradient ? 'rgba(255,255,255,0.78)' : c.textMuted;
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: SPACING.md,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: bg,
        borderBottomWidth: gradient ? 0 : 1,
        borderBottomColor: c.border,
      }}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 38,
            height: 38,
            borderRadius: RADIUS.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: gradient ? 'rgba(255,255,255,0.16)' : c.surfaceAlt,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="chevron-forward" size={20} color={fg} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[rtlText, { color: fg, fontSize: 18, fontWeight: '800' }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[rtlText, { color: sub, fontSize: 12, marginTop: 2 }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={{ flexDirection: 'row-reverse', gap: SPACING.sm, alignItems: 'center' }}>{right}</View> : null}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
}) {
  const c = usePalette();
  const inner = (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderRadius: RADIUS.lg,
          borderWidth: 1,
          borderColor: c.border,
          padding: padded ? SPACING.lg : 0,
          shadowColor: c.shadow,
          shadowOpacity: c.dark ? 0.35 : 0.05,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: c.dark ? 0 : 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      {inner}
    </Pressable>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';

export function Btn({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  style,
  full = true,
  compact,
}: {
  label?: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: BtnVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
  compact?: boolean;
}) {
  const c = usePalette();
  const map: Record<BtnVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: c.primary, fg: c.dark ? '#04211D' : '#FFFFFF' },
    secondary: { bg: c.primarySoft, fg: c.primaryText },
    outline: { bg: 'transparent', fg: c.text, border: c.border },
    ghost: { bg: 'transparent', fg: c.primaryText },
    danger: { bg: c.dangerSoft, fg: c.danger },
    success: { bg: c.successSoft, fg: c.success },
  };
  const v = map[variant];
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.sm,
          backgroundColor: v.bg,
          borderRadius: RADIUS.md,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          paddingVertical: compact ? 9 : 14,
          paddingHorizontal: compact ? 14 : 18,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : icon ? (
        <Ionicons name={icon} size={compact ? 16 : 19} color={v.fg} />
      ) : null}
      {label ? <Text style={[rtlText, { color: v.fg, fontSize: compact ? 13 : 15, fontWeight: '700' }]}>{label}</Text> : null}
    </Pressable>
  );
}

export function IconBtn({
  icon,
  onPress,
  color,
  bg,
  size = 18,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  bg?: string;
  size?: number;
}) {
  const c = usePalette();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: RADIUS.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg ?? c.surfaceAlt,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon} size={size} color={color ?? c.text} />
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  tone,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const c = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: RADIUS.pill,
        backgroundColor: selected ? (tone ?? c.primary) : c.surface,
        borderWidth: 1,
        borderColor: selected ? (tone ?? c.primary) : c.border,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={14} color={selected ? '#fff' : c.textMuted} /> : null}
      <Text
        style={[
          rtlText,
          { fontSize: 13, fontWeight: '700', color: selected ? '#FFFFFF' : c.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row-reverse', gap: SPACING.sm, paddingHorizontal: 2 }}
      style={{ flexGrow: 0, marginVertical: SPACING.sm }}
    >
      {children}
    </ScrollView>
  );
}

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'primary';

export function Badge({ label, tone = 'muted', icon }: { label: string; tone?: BadgeTone; icon?: keyof typeof Ionicons.glyphMap }) {
  const c = usePalette();
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    success: { bg: c.successSoft, fg: c.success },
    warning: { bg: c.warningSoft, fg: c.warning },
    danger: { bg: c.dangerSoft, fg: c.danger },
    info: { bg: c.infoSoft, fg: c.info },
    primary: { bg: c.primarySoft, fg: c.primaryText },
    muted: { bg: c.surfaceAlt, fg: c.textMuted },
  };
  const v = map[tone];
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: v.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: RADIUS.pill,
        alignSelf: 'flex-start',
      }}
    >
      {icon ? <Ionicons name={icon} size={11} color={v.fg} /> : null}
      <Text style={[rtlText, { color: v.fg, fontSize: 11, fontWeight: '800' }]}>{label}</Text>
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  error,
  hint,
  required,
  maxLength,
  editable = true,
  suffix,
  autoCapitalize,
  returnKeyType,
  onSubmitEditing,
  autoFocus,
}: {
  label?: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'phone-pad' | 'email-address' | 'number-pad';
  multiline?: boolean;
  error?: string;
  hint?: string;
  required?: boolean;
  maxLength?: number;
  editable?: boolean;
  suffix?: string;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  returnKeyType?: 'done' | 'next' | 'go' | 'search';
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
}) {
  const c = usePalette();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: SPACING.lg }}>
      {label ? (
        <Text style={[rtlText, { color: c.textMuted, fontSize: 13, fontWeight: '700', marginBottom: 6 }]}>
          {label}
          {required ? <Text style={{ color: c.danger }}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          backgroundColor: editable ? c.inputBg : c.surfaceAlt,
          borderRadius: RADIUS.md,
          borderWidth: 1,
          borderColor: error ? c.danger : focused ? c.primary : c.border,
          paddingHorizontal: SPACING.md,
          minHeight: multiline ? 92 : 48,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.textFaint}
          keyboardType={Platform.OS === 'web' && keyboardType === 'decimal-pad' ? 'numeric' : keyboardType}
          multiline={multiline}
          maxLength={maxLength}
          editable={editable}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          textAlign="right"
          style={[
            rtlText,
            {
              flex: 1,
              color: c.text,
              fontSize: 15,
              paddingVertical: multiline ? 12 : 0,
              textAlignVertical: multiline ? 'top' : 'center',
              minHeight: multiline ? 88 : 46,
              outlineStyle: Platform.OS === 'web' ? 'none' : undefined,
            } as TextStyle,
          ]}
        />
        {suffix ? <Text style={[rtlText, { color: c.textMuted, fontSize: 13, fontWeight: '700', marginStart: 8 }]}>{suffix}</Text> : null}
      </View>
      {error ? (
        <Text style={[rtlText, { color: c.danger, fontSize: 12, marginTop: 6, fontWeight: '600' }]}>{error}</Text>
      ) : hint ? (
        <Text style={[rtlText, { color: c.textFaint, fontSize: 12, marginTop: 6 }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function SelectField({
  label,
  value,
  placeholder,
  onPress,
  icon = 'chevron-down',
  required,
  error,
}: {
  label?: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  required?: boolean;
  error?: string;
}) {
  const c = usePalette();
  return (
    <View style={{ marginBottom: SPACING.lg }}>
      {label ? (
        <Text style={[rtlText, { color: c.textMuted, fontSize: 13, fontWeight: '700', marginBottom: 6 }]}>
          {label}
          {required ? <Text style={{ color: c.danger }}> *</Text> : null}
        </Text>
      ) : null}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: c.inputBg,
          borderRadius: RADIUS.md,
          borderWidth: 1,
          borderColor: error ? c.danger : c.border,
          paddingHorizontal: SPACING.md,
          minHeight: 48,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text
          style={[rtlText, { flex: 1, color: value ? c.text : c.textFaint, fontSize: 15, fontWeight: value ? '600' : '400' }]}
          numberOfLines={1}
        >
          {value || placeholder || 'اختر...'}
        </Text>
        <Ionicons name={icon} size={18} color={c.textMuted} />
      </Pressable>
      {error ? (
        <Text style={[rtlText, { color: c.danger, fontSize: 12, marginTop: 6, fontWeight: '600' }]}>{error}</Text>
      ) : null}
    </View>
  );
}

export interface PickerOption {
  value: string;
  label: string;
  hint?: string;
}

export function OptionPicker({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  searchable = true,
  emptyText = 'لا توجد خيارات',
  footer,
}: {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected?: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
  searchable?: boolean;
  emptyText?: string;
  footer?: React.ReactNode;
}) {
  const c = usePalette();
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.hint ?? ''}`.includes(q));
  }, [options, query]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }} />
      </TouchableWithoutFeedback>
      <View
        style={{
          backgroundColor: c.surface,
          borderTopLeftRadius: RADIUS.xl,
          borderTopRightRadius: RADIUS.xl,
          maxHeight: '78%',
          paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        }}
      >
        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
          <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: c.border }} />
        </View>
        <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm }}>
          <Text style={[rtlText, { color: c.text, fontSize: 17, fontWeight: '800' }]}>{title}</Text>
        </View>
        {searchable && options.length > 6 ? (
          <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm }}>
            <SearchBar value={query} onChangeText={setQuery} placeholder="بحث..." compact />
          </View>
        ) : null}
        <ScrollView style={{ paddingHorizontal: SPACING.lg }} keyboardShouldPersistTaps="handled">
          {filtered.length === 0 ? (
            <Text style={[rtlText, { color: c.textFaint, paddingVertical: 24, textAlign: 'center' }]}>{emptyText}</Text>
          ) : (
            filtered.map((o) => {
              const active = o.value === selected;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    onSelect(o.value);
                    onClose();
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    gap: SPACING.md,
                    paddingVertical: 13,
                    paddingHorizontal: SPACING.md,
                    borderRadius: RADIUS.md,
                    backgroundColor: active ? c.primarySoft : 'transparent',
                    opacity: pressed ? 0.7 : 1,
                    marginBottom: 2,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[rtlText, { color: active ? c.primaryText : c.text, fontSize: 15, fontWeight: '700' }]}>
                      {o.label}
                    </Text>
                    {o.hint ? <Text style={[rtlText, { color: c.textFaint, fontSize: 12, marginTop: 2 }]}>{o.hint}</Text> : null}
                  </View>
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={active ? c.primary : c.textFaint}
                  />
                </Pressable>
              );
            })
          )}
          {footer ? <View style={{ paddingTop: SPACING.md }}>{footer}</View> : null}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'بحث...',
  compact,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const c = usePalette();
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: c.surface,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: c.border,
        paddingHorizontal: SPACING.md,
        height: compact ? 42 : 48,
      }}
    >
      <Ionicons name="search" size={17} color={c.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textFaint}
        returnKeyType="search"
        textAlign="right"
        style={[
          rtlText,
          { flex: 1, color: c.text, fontSize: 14, outlineStyle: Platform.OS === 'web' ? 'none' : undefined } as TextStyle,
        ]}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={17} color={c.textFaint} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
  icon,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const c = usePalette();
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SPACING.xl,
        marginBottom: SPACING.md,
      }}
    >
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
        {icon ? <Ionicons name={icon} size={17} color={c.primary} /> : null}
        <Text style={[rtlText, { color: c.text, fontSize: 16, fontWeight: '800' }]}>{title}</Text>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 2 }}>
          <Text style={[rtlText, { color: c.primary, fontSize: 13, fontWeight: '700' }]}>{action}</Text>
          <Ionicons name="chevron-back" size={14} color={c.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function StatTile({
  title,
  value,
  icon,
  tone = 'primary',
  subtitle,
  onPress,
}: {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;
  onPress?: () => void;
}) {
  const c = usePalette();
  const tones: Record<string, { bg: string; fg: string }> = {
    primary: { bg: c.primarySoft, fg: c.primaryText },
    success: { bg: c.successSoft, fg: c.success },
    warning: { bg: c.warningSoft, fg: c.warning },
    danger: { bg: c.dangerSoft, fg: c.danger },
    info: { bg: c.infoSoft, fg: c.info },
  };
  const t = tones[tone];
  return (
    <Card onPress={onPress} style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
        <View
          style={{ width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={icon} size={18} color={t.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[rtlText, { color: c.textMuted, fontSize: 11.5, fontWeight: '600' }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[rtlText, { color: c.text, fontSize: 16, fontWeight: '800', marginTop: 2 }]} numberOfLines={1}>
            {value}
          </Text>
        </View>
      </View>
      {subtitle ? (
        <Text style={[rtlText, { color: c.textFaint, fontSize: 11, marginTop: 8 }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </Card>
  );
}

export function InfoRow({
  label,
  value,
  icon,
  onValuePress,
  valueColor,
}: {
  label: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onValuePress?: () => void;
  valueColor?: string;
}) {
  const c = usePalette();
  const content = (
    <View
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: c.borderSoft,
      }}
    >
      {icon ? <Ionicons name={icon} size={16} color={c.textFaint} /> : null}
      <Text style={[rtlText, { color: c.textMuted, fontSize: 13, width: 120, fontWeight: '600' }]}>{label}</Text>
      <Text style={[rtlText, { flex: 1, color: valueColor ?? c.text, fontSize: 14, fontWeight: '700' }]} numberOfLines={2}>
        {value || '—'}
      </Text>
      {onValuePress ? <Ionicons name="chevron-back" size={15} color={c.textFaint} /> : null}
    </View>
  );
  if (!onValuePress) return content;
  return <Pressable onPress={onValuePress}>{content}</Pressable>;
}

export function MenuRow({
  label,
  icon,
  onPress,
  tone,
  badge,
  hint,
  chevron = true,
  right,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  tone?: 'default' | 'danger' | 'primary';
  badge?: string | number;
  hint?: string;
  chevron?: boolean;
  right?: React.ReactNode;
}) {
  const c = usePalette();
  const fg = tone === 'danger' ? c.danger : tone === 'primary' ? c.primaryText : c.text;
  const iconBg = tone === 'danger' ? c.dangerSoft : tone === 'primary' ? c.primarySoft : c.surfaceAlt;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: 13,
        paddingHorizontal: SPACING.lg,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <View style={{ width: 34, height: 34, borderRadius: RADIUS.md, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={17} color={fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[rtlText, { color: fg, fontSize: 14.5, fontWeight: '700' }]}>{label}</Text>
        {hint ? <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5, marginTop: 2 }]} numberOfLines={2}>{hint}</Text> : null}
      </View>
      {badge !== undefined && badge !== null && `${badge}` !== '' && `${badge}` !== '0' ? (
        <View style={{ backgroundColor: c.danger, borderRadius: RADIUS.pill, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{badge}</Text>
        </View>
      ) : null}
      {right}
      {chevron ? <Ionicons name="chevron-back" size={16} color={c.textFaint} /> : null}
    </Pressable>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = usePalette();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 46, paddingHorizontal: SPACING.xl }}>
      <View
        style={{
          width: 74,
          height: 74,
          borderRadius: RADIUS.pill,
          backgroundColor: c.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.lg,
        }}
      >
        <Ionicons name={icon} size={32} color={c.textFaint} />
      </View>
      <Text style={[rtlText, { color: c.text, fontSize: 16, fontWeight: '800', textAlign: 'center' }]}>{title}</Text>
      {body ? (
        <Text style={[rtlText, { color: c.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 21 }]}>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: SPACING.lg, alignSelf: 'stretch' }}>
          <Btn label={actionLabel} onPress={onAction} icon="add" full={false} style={{ alignSelf: 'center' }} />
        </View>
      ) : null}
    </View>
  );
}

export function ProgressBar({ value, tone, height = 8 }: { value: number; tone?: string; height?: number }) {
  const c = usePalette();
  const pct = Math.max(0, Math.min(100, value));
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct, anim]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={{ height, borderRadius: height, backgroundColor: c.surfaceAlt, overflow: 'hidden', width: '100%' }}>
      <Animated.View style={{ height: '100%', width, backgroundColor: tone ?? c.primary, borderRadius: height }} />
    </View>
  );
}

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const c = usePalette();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl }}>
        <View style={{ backgroundColor: c.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, width: '100%', maxWidth: 400 }}>
          <Text style={[rtlText, { color: c.text, fontSize: 17, fontWeight: '800' }]}>{title}</Text>
          {body ? (
            <Text style={[rtlText, { color: c.textMuted, fontSize: 13.5, marginTop: 8, lineHeight: 22 }]}>{body}</Text>
          ) : null}
          <View style={{ flexDirection: 'row-reverse', gap: SPACING.md, marginTop: SPACING.xl }}>
            <View style={{ flex: 1 }}>
              <Btn label={confirmLabel} onPress={onConfirm} variant={tone === 'danger' ? 'danger' : 'primary'} />
            </View>
            <View style={{ flex: 1 }}>
              <Btn label={cancelLabel} onPress={onCancel} variant="outline" />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function FAB({ icon = 'add', onPress, label }: { icon?: keyof typeof Ionicons.glyphMap; onPress?: () => void; label?: string }) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 0 : 12);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        position: 'absolute',
        bottom: bottomInset + 84,
        left: SPACING.lg,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        backgroundColor: c.primary,
        borderRadius: RADIUS.pill,
        paddingHorizontal: label ? 20 : 0,
        height: 54,
        minWidth: 54,
        justifyContent: 'center',
        shadowColor: c.shadow,
        shadowOpacity: 0.28,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Ionicons name={icon} size={24} color={c.dark ? '#04211D' : '#FFFFFF'} />
      {label ? <Text style={[rtlText, { color: c.dark ? '#04211D' : '#FFFFFF', fontWeight: '800', fontSize: 14 }]}>{label}</Text> : null}
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = usePalette();
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        backgroundColor: c.surfaceAlt,
        borderRadius: RADIUS.md,
        padding: 4,
        gap: 4,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: RADIUS.sm,
              backgroundColor: active ? c.surface : 'transparent',
              alignItems: 'center',
              shadowColor: c.shadow,
              shadowOpacity: active && !c.dark ? 0.08 : 0,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: active && !c.dark ? 2 : 0,
            }}
          >
            <Text style={[rtlText, { color: active ? c.primaryText : c.textMuted, fontSize: 13, fontWeight: '800' }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToastHost() {
  const { toast } = useApp();
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 0 : 12);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const [shown, setShown] = useState<{ id: number; message: string; tone: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!toast) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 30, duration: 200, useNativeDriver: true }),
      ]).start(() => setShown(null));
      return;
    }
    setShown(toast);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();
  }, [toast, opacity, translateY]);

  if (!shown) return null;
  const tone =
    shown.tone === 'error' ? { bg: c.danger, fg: '#fff' } : shown.tone === 'info' ? { bg: c.info, fg: '#fff' } : { bg: c.success, fg: '#fff' };
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: bottomInset + 110,
        alignSelf: 'center',
        opacity,
        transform: [{ translateY }],
        backgroundColor: tone.bg,
        borderRadius: RADIUS.pill,
        paddingHorizontal: 18,
        paddingVertical: 11,
        maxWidth: '88%',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Ionicons
        name={shown.tone === 'error' ? 'alert-circle' : shown.tone === 'info' ? 'information-circle' : 'checkmark-circle'}
        size={17}
        color={tone.fg}
      />
      <Text style={[rtlText, { color: tone.fg, fontSize: 13.5, fontWeight: '700' }]} numberOfLines={2}>
        {shown.message}
      </Text>
    </Animated.View>
  );
}

/** شريط أزرار سفلي ثابت يحترم منطقة أزرار التنقل في أندرويد وشريط iPhone */
export function StickyFooter({ children }: { children: React.ReactNode }) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: insets.bottom + SPACING.md,
        backgroundColor: c.surface,
        borderTopWidth: 1,
        borderTopColor: c.border,
        flexDirection: 'row-reverse',
        gap: SPACING.md,
        shadowColor: c.shadow,
        shadowOpacity: c.dark ? 0.4 : 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -3 },
        elevation: 10,
      }}
    >
      {children}
    </View>
  );
}

export function LoadingView({ label = 'جاري تحميل بياناتك...' }: { label?: string }) {
  const c = usePalette();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <ActivityIndicator size="large" color={c.primary} />
      <Text style={[rtlText, { color: c.textMuted, fontSize: 13 }]}>{label}</Text>
    </View>
  );
}

export function Notice({
  text,
  tone = 'info',
  icon,
}: {
  text: string;
  tone?: 'info' | 'warning' | 'danger' | 'success' | 'primary';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const c = usePalette();
  const map = {
    info: { bg: c.infoSoft, fg: c.info },
    warning: { bg: c.warningSoft, fg: c.warning },
    danger: { bg: c.dangerSoft, fg: c.danger },
    success: { bg: c.successSoft, fg: c.success },
    primary: { bg: c.primarySoft, fg: c.primaryText },
  } as const;
  const t = map[tone];
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        gap: 10,
        backgroundColor: t.bg,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        alignItems: 'flex-start',
        marginBottom: SPACING.lg,
      }}
    >
      <Ionicons name={icon ?? 'information-circle'} size={17} color={t.fg} style={{ marginTop: 1 }} />
      <Text style={[rtlText, { flex: 1, color: t.fg, fontSize: 12.5, lineHeight: 20, fontWeight: '600' }]}>{text}</Text>
    </View>
  );
}

export function usePaletteRef(): Palette {
  return usePalette();
}
