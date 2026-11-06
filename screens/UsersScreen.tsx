import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import {
  Badge,
  Btn,
  Card,
  Chip,
  ChipRow,
  ConfirmDialog,
  Field,
  Notice,
  Screen,
  ScreenHeader,
  SectionHeader,
  rtlText,
} from '../components/ui';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, can, rolePermissions } from '../lib/permissions';
import { AppUser, Role } from '../lib/types';

const ROLE_ICONS: Record<Role, keyof typeof Ionicons.glyphMap> = {
  manager: 'shield-checkmark',
  accountant: 'calculator',
  employee: 'person',
};

const ROLES: Role[] = ['manager', 'accountant', 'employee'];

export default function UsersScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const { users, currentUser, setCurrentUserId, addUser, updateUser, deleteUser, showToast, role } = useApp();
  const [expanded, setExpanded] = useState<Role | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [roleDraft, setRoleDraft] = useState<Role>('employee');
  const [nameError, setNameError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<AppUser | null>(null);

  const canManage = can(role, 'users.manage');

  const openAdd = () => {
    setEditing(null);
    setNameDraft('');
    setRoleDraft('employee');
    setNameError('');
    setEditorOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditing(u);
    setNameDraft(u.name);
    setRoleDraft(u.role);
    setNameError('');
    setEditorOpen(true);
  };

  const submitEditor = () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length < 2) {
      setNameError('اكتب اسم المسؤول (حرفان على الأقل)');
      return;
    }
    const duplicate = users.some(
      (u) => u.name.trim() === trimmed && (!editing || u.id !== editing.id)
    );
    if (duplicate) {
      setNameError('يوجد مسؤول آخر بنفس الاسم - اختر اسمًا مختلفًا');
      return;
    }
    if (editing) {
      const ok = updateUser(editing.id, { name: trimmed, role: roleDraft });
      if (!ok) {
        setNameError('لا يمكن تجريد المدير الوحيد من دوره - عيّن مسؤولًا آخر كمدير أولًا');
        showToast('دور المدير محمي: لا يمكن تجريد آخر مدير من صلاحياته', 'error');
        return;
      }
      showToast(`تم حفظ بيانات المسؤول «${trimmed}»`);
    } else {
      const created = addUser(trimmed, roleDraft);
      setCurrentUserId(created.id);
      showToast(`تم تعيين «${trimmed}» مسؤولًا (${ROLE_LABELS[roleDraft]}) والتبديل إليه`);
    }
    setEditorOpen(false);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const ok = deleteUser(pendingDelete.id);
    showToast(
      ok
        ? `تم حذف المسؤول «${pendingDelete.name}»`
        : pendingDelete.role === 'manager'
        ? 'لا يمكن حذف المدير الوحيد - عيّن مديرًا آخر أولًا'
        : 'لا يمكن حذف المسؤول الوحيد المتبقي',
      ok ? 'info' : 'error'
    );
    setPendingDelete(null);
  };

  return (
    <Screen>
      <ScreenHeader
        title="المسؤولون والصلاحيات"
        subtitle="تعيين المسؤولين وتسميتهم والتبديل بينهم"
        onBack={() => nav.goBack()}
        right={
          canManage ? (
            <Pressable
              onPress={openAdd}
              hitSlop={8}
              style={({ pressed }) => ({
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 5,
                backgroundColor: c.primarySoft,
                borderRadius: RADIUS.pill,
                paddingHorizontal: 12,
                paddingVertical: 7,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="person-add" size={15} color={c.primaryText} />
              <Text style={[rtlText, { color: c.primaryText, fontSize: 12, fontWeight: '800' }]}>تعيين مسؤول</Text>
            </Pressable>
          ) : null
        }
      />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        {!canManage ? (
          <Notice tone="warning" icon="lock-closed" text="دورك الحالي لا يسمح بتعيين أو تعديل المسؤولين - يمكنك التبديل بين المستخدمين فقط." />
        ) : (
          <Notice
            tone="success"
            icon="shield-checkmark"
            text="أنت مدير للتطبيق: لك التحكم الكامل في المسؤولين والإعدادات والعملة والحذف والتقارير والتصدير وملف APK. الاسم المعين هنا يظهر تلقائيًا في الفواتير وملفات التصدير."
          />
        )}

        <SectionHeader title="قائمة المسؤولين" icon="people-outline" action={canManage ? 'إضافة' : undefined} onAction={canManage ? openAdd : undefined} />
        {users.map((u) => {
          const active = u.id === currentUser.id;
          return (
            <Card key={u.id} style={{ marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.md }}>
                <Pressable
                  onPress={() => (canManage ? openEdit(u) : undefined)}
                  style={({ pressed }) => ({
                    width: 46,
                    height: 46,
                    borderRadius: RADIUS.lg,
                    backgroundColor: active ? c.primarySoft : c.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons name={ROLE_ICONS[u.role]} size={21} color={active ? c.primaryText : c.textMuted} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                    <Text style={[rtlText, { flex: 1, color: c.text, fontSize: 15, fontWeight: '800' }]} numberOfLines={1}>
                      {u.name}
                    </Text>
                    <Badge label={ROLE_LABELS[u.role]} tone={u.role === 'manager' ? 'primary' : u.role === 'accountant' ? 'info' : 'muted'} />
                    {u.role === 'manager' ? <Badge label="صلاحيات كاملة" tone="success" icon="shield-checkmark" /> : null}
                    {active ? <Badge label="الحالي" tone="warning" icon="checkmark" /> : null}
                  </View>
                  <Text style={[rtlText, { color: c.textMuted, fontSize: 12, marginTop: 5, lineHeight: 18 }]} numberOfLines={2}>
                    {ROLE_DESCRIPTIONS[u.role]}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row-reverse', gap: SPACING.sm, marginTop: SPACING.md }}>
                <View style={{ flex: 1.2 }}>
                  <Btn
                    label={active ? 'المسؤول الحالي' : 'تبديل'}
                    icon={active ? 'checkmark-circle' : 'swap-horizontal'}
                    variant={active ? 'secondary' : 'primary'}
                    compact
                    disabled={active}
                    onPress={() => {
                      setCurrentUserId(u.id);
                      showToast(`تم التبديل إلى ${u.name} (${ROLE_LABELS[u.role]})`, 'info');
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Btn label="الصلاحيات" icon="list-outline" variant="outline" compact onPress={() => setExpanded((p) => (p === u.role ? null : u.role))} />
                </View>
                {canManage ? (
                  <View style={{ flex: 1 }}>
                    <Btn label="تعديل" icon="create-outline" variant="outline" compact onPress={() => openEdit(u)} />
                  </View>
                ) : null}
                {canManage && users.length > 1 ? (
                  <Pressable
                    onPress={() => setPendingDelete(u)}
                    hitSlop={6}
                    style={({ pressed }) => ({
                      width: 40,
                      height: 38,
                      borderRadius: RADIUS.md,
                      backgroundColor: c.dangerSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Ionicons name="trash-outline" size={17} color={c.danger} />
                  </Pressable>
                ) : null}
              </View>

              {expanded === u.role ? (
                <View style={{ marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: c.borderSoft }}>
                  {rolePermissions(u.role).map((p) => (
                    <View key={p.key} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 5 }}>
                      <Ionicons name={p.allowed ? 'checkmark-circle' : 'close-circle'} size={15} color={p.allowed ? c.success : c.textFaint} />
                      <Text
                        style={[
                          rtlText,
                          { flex: 1, color: p.allowed ? c.text : c.textFaint, fontSize: 12.5, fontWeight: p.allowed ? '600' : '400' },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })}

        <Card style={{ marginTop: SPACING.lg }}>
          <Text style={[rtlText, { color: c.text, fontSize: 14, fontWeight: '800', marginBottom: 8 }]}>المسؤول الحالي</Text>
          <Text style={[rtlText, { color: c.textMuted, fontSize: 12.5, lineHeight: 20 }]}>
            {currentUser.name} — {ROLE_LABELS[role]}. {ROLE_DESCRIPTIONS[role]}.
          </Text>
          <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5, lineHeight: 19, marginTop: 8 }]}>
            يظهر اسم المسؤول الحالي في رأس الفاتورة المطبوعة وفي ملفات التصدير (CSV) وفي نص المشاركة.
          </Text>
          <View style={{ marginTop: SPACING.md }}>
            <Btn label="العودة للإعدادات" icon="settings-outline" variant="outline" compact onPress={() => nav.navigate('Settings')} />
          </View>
        </Card>
      </ScrollView>

      <Modal visible={editorOpen} transparent animationType="slide" onRequestClose={() => setEditorOpen(false)}>
        <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setEditorOpen(false)} />
          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: RADIUS.xl,
              borderTopRightRadius: RADIUS.xl,
              padding: SPACING.lg,
              paddingBottom: SPACING.xl,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
              <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: c.border }} />
            </View>
            <Text style={[rtlText, { color: c.text, fontSize: 17, fontWeight: '800', marginBottom: SPACING.lg }]}>
              {editing ? 'تعديل المسؤول' : 'تعيين مسؤول جديد'}
            </Text>
            <Field
              label="اسم المسؤول"
              value={nameDraft}
              onChangeText={(t) => {
                setNameDraft(t);
                setNameError('');
              }}
              placeholder="مثال: عبدالله - مسؤول الحسابات"
              maxLength={40}
              error={nameError}
              required
            />
            <Text style={[rtlText, { color: c.textMuted, fontSize: 13, fontWeight: '700', marginBottom: 8 }]}>الدور / الصلاحية</Text>
            <ChipRow>
              {ROLES.map((r) => (
                <Chip key={r} label={ROLE_LABELS[r]} selected={roleDraft === r} onPress={() => setRoleDraft(r)} icon={ROLE_ICONS[r]} />
              ))}
            </ChipRow>
            <View style={{ backgroundColor: c.surfaceAlt, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg }}>
              <Text style={[rtlText, { color: c.textMuted, fontSize: 12, lineHeight: 19 }]}>{ROLE_DESCRIPTIONS[roleDraft]}</Text>
            </View>
            <View style={{ flexDirection: 'row-reverse', gap: SPACING.md }}>
              <View style={{ flex: 2 }}>
                <Btn label={editing ? 'حفظ التعديلات' : 'تعيين المسؤول'} icon="checkmark" onPress={submitEditor} />
              </View>
              <View style={{ flex: 1 }}>
                <Btn label="إلغاء" variant="outline" onPress={() => setEditorOpen(false)} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={!!pendingDelete}
        title="حذف المسؤول"
        body={pendingDelete ? `سيتم حذف «${pendingDelete.name}» من قائمة المسؤولين. لن تتأثر الأعمال والفواتير المسجلة.` : ''}
        confirmLabel="حذف"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </Screen>
  );
}
