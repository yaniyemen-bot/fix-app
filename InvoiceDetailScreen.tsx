import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import {
  Badge,
  Btn,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  InfoRow,
  MenuRow,
  OptionPicker,
  Screen,
  ScreenHeader,
  SectionHeader,
  rtlText,
} from '../components/ui';
import { TotalsBlock, statusTone } from '../components/cards';
import {
  buildInvoiceHtml,
  buildInvoiceShareText,
  exportCsv,
  exportMetaRows,
  isWeb,
  printHtml,
  safeFileName,
  savePdfNative,
  shareFileNative,
  shareText,
} from '../lib/exporters';
import { formatDate, formatDateShort, formatMoney, formatQuantity, STATUS_LABELS, daysBetween, todayISO } from '../lib/format';
import { InvoiceStatus } from '../lib/types';
import { can } from '../lib/permissions';

export default function InvoiceDetailScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const {
    invoices,
    works,
    settings,
    currency,
    role,
    currentUser,
    companyById,
    invoiceItems,
    setInvoiceStatus,
    updateInvoiceNotes,
    deleteInvoice,
    showToast,
    workTotal,
  } = useApp();

  const invoice = invoices.find((i) => i.id === route.params?.invoiceId);
  const [statusOpen, setStatusOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  if (!invoice) {
    return (
      <Screen>
        <ScreenHeader title="الفاتورة" onBack={() => nav.goBack()} />
        <EmptyState icon="alert-circle-outline" title="الفاتورة غير موجودة" body="ربما تم حذفها أو إعادة تعيين البيانات" />
      </Screen>
    );
  }

  const company = companyById(invoice.companyId);
  const items = invoiceItems(invoice);
  const today = todayISO();
  const overdueDays = invoice.status === 'issued' && invoice.dueDate < today ? Math.abs(daysBetween(invoice.dueDate, today)) : 0;

  const html = () => buildInvoiceHtml(invoice, company, works, settings, currency, currentUser.name);

  const doPrint = async () => {
    setBusy('print');
    const ok = await printHtml(html());
    setBusy(null);
    showToast(ok ? (isWeb ? 'تم فتح نافذة الطباعة / PDF' : 'تم فتح نافذة الطباعة') : 'تعذر فتح الطباعة', ok ? 'success' : 'error');
  };

  const doPdf = async () => {
    if (isWeb) {
      await doPrint();
      return;
    }
    setBusy('pdf');
    const uri = await savePdfNative(html(), `${safeFileName(settings.businessName)}-${invoice.number}.pdf`);
    if (uri) {
      const ok = await shareFileNative(uri, 'application/pdf', `مشاركة ${invoice.number}.pdf`);
      setBusy(null);
      showToast(ok ? 'تم إنشاء ملف PDF ومشاركته' : 'تم إنشاء الملف في الذاكرة المؤقتة', ok ? 'success' : 'info');
    } else {
      setBusy(null);
      showToast('تعذر إنشاء ملف PDF', 'error');
    }
  };

  const doShare = async () => {
    setBusy('share');
    const res = await shareText(buildInvoiceShareText(invoice, company, settings, currency, currentUser.name));
    setBusy(null);
    showToast(
      res === 'shared' ? 'تمت المشاركة' : res === 'copied' ? 'تم نسخ تفاصيل الفاتورة (المتصفح لا يدعم المشاركة المباشرة)' : 'تعذرت المشاركة',
      res === 'failed' ? 'error' : 'info'
    );
  };

  const doCsv = async () => {
    setBusy('csv');
    const rows: (string | number)[][] = [
      ...exportMetaRows(settings, currentUser.name, currency),
      ['رقم الفاتورة', invoice.number],
      ['العميل', company?.name ?? ''],
      ['الحالة', STATUS_LABELS[invoice.status]],
      ['الفترة', `${invoice.periodStart} → ${invoice.periodEnd}`],
      ['تاريخ الإصدار', invoice.issueDate],
      ['تاريخ الاستحقاق', invoice.dueDate],
      [],
      ['#', 'البيان', 'التاريخ', 'الكمية', 'الوحدة', 'سعر الوحدة', 'الإجمالي'],
      ...items.map((w, idx) => [idx + 1, w.type, w.date, w.quantity, w.unit, w.unitPrice, workTotal(w)]),
      [],
      ['الإجمالي الفرعي', invoice.subtotal],
      ['الخصم', invoice.discount],
      [`الضريبة ${invoice.taxRate}%`, invoice.taxAmount],
      ['الإجمالي المستحق', invoice.total],
      ['العملة', `${currency.code} ${currency.symbol}`],
      ['المسؤول', currentUser.name],
    ];
    const res = await exportCsv(`${safeFileName(settings.businessName)}-${invoice.number}.csv`, rows);
    setBusy(null);
    showToast(
      res === 'downloaded' ? 'تم تنزيل ملف CSV' : res === 'shared' ? 'تم تجهيز ملف CSV للمشاركة' : 'تعذر التصدير',
      res === 'failed' ? 'error' : 'success'
    );
  };

  const changeStatus = (status: InvoiceStatus) => {
    setInvoiceStatus(invoice.id, status);
    showToast(status === 'paid' ? 'تم تحديد الفاتورة كمدفوعة' : `تم تغيير الحالة إلى ${STATUS_LABELS[status]}`, 'info');
  };

  return (
    <Screen>
      <ScreenHeader
        title="فاتورة ضريبية"
        subtitle={`${invoice.number} • ${company?.name ?? 'عميل'}`}
        onBack={() => nav.goBack()}
        right={<Badge label={overdueDays ? `متأخرة ${overdueDays} يوم` : STATUS_LABELS[invoice.status]} tone={overdueDays ? 'danger' : statusTone(invoice.status)} />}
      />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: SPACING.lg, backgroundColor: c.primarySoft, borderColor: c.primarySoft }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={[rtlText, { color: c.primaryText, fontSize: 12.5, fontWeight: '700' }]}>الإجمالي المستحق</Text>
              <Text style={[rtlText, { color: c.primaryText, fontSize: 26, fontWeight: '800', marginTop: 4 }]}>
                {formatMoney(invoice.total, currency)}
              </Text>
              <Text style={[rtlText, { color: c.primaryText, fontSize: 11.5, marginTop: 6, opacity: 0.85 }]}>
                {items.length} بند • {monthPeriod(invoice.periodStart, invoice.periodEnd)}
              </Text>
            </View>
            <View style={{ width: 56, height: 56, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="receipt" size={26} color={c.primaryText} />
            </View>
          </View>
        </Card>

        <Card style={{ marginBottom: SPACING.lg }}>
          <InfoRow label="العميل" value={company?.name} icon="business" onValuePress={company ? () => nav.navigate('CompanyDetail', { companyId: company.id }) : undefined} />
          <InfoRow label="الهاتف" value={company?.phone} icon="call-outline" />
          <InfoRow label="الفترة" value={`${formatDate(invoice.periodStart)} → ${formatDate(invoice.periodEnd)}`} icon="calendar-outline" />
          <InfoRow label="تاريخ الإصدار" value={formatDate(invoice.issueDate)} icon="document-attach-outline" />
          <InfoRow
            label="تاريخ الاستحقاق"
            value={formatDate(invoice.dueDate)}
            icon="time-outline"
            valueColor={overdueDays ? c.danger : invoice.status === 'paid' ? c.success : c.text}
          />
          {invoice.paidAt ? <InfoRow label="تاريخ السداد" value={formatDate(invoice.paidAt)} icon="checkmark-done-outline" valueColor={c.success} /> : null}
          <InfoRow label="الرقم الضريبي للعميل" value={company?.taxNumber || '—'} icon="key-outline" />
        </Card>

        <SectionHeader title={`بنود الفاتورة (${items.length})`} icon="list-outline" />
        <Card padded={false} style={{ marginBottom: SPACING.lg, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row-reverse', backgroundColor: c.surfaceAlt, paddingVertical: 9, paddingHorizontal: SPACING.md }}>
            <Text style={[rtlText, { width: 30, color: c.textMuted, fontSize: 11.5, fontWeight: '800' }]}>#</Text>
            <Text style={[rtlText, { flex: 1, color: c.textMuted, fontSize: 11.5, fontWeight: '800' }]}>البيان</Text>
            <Text style={[rtlText, { width: 62, color: c.textMuted, fontSize: 11.5, fontWeight: '800', textAlign: 'center' }]}>الكمية</Text>
            <Text style={[rtlText, { width: 86, color: c.textMuted, fontSize: 11.5, fontWeight: '800', textAlign: 'left' }]}>الإجمالي</Text>
          </View>
          {items.map((w, idx) => (
            <Pressable
              key={w.id}
              onPress={() => nav.navigate('WorkDetail', { workId: w.id })}
              style={({ pressed }) => ({
                flexDirection: 'row-reverse',
                alignItems: 'center',
                paddingVertical: 11,
                paddingHorizontal: SPACING.md,
                borderTopWidth: 1,
                borderTopColor: c.borderSoft,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={[rtlText, { width: 30, color: c.textFaint, fontSize: 12, fontWeight: '700' }]}>{idx + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[rtlText, { color: c.text, fontSize: 13, fontWeight: '700' }]} numberOfLines={1}>
                  {w.type}
                </Text>
                <Text style={[rtlText, { color: c.textFaint, fontSize: 11, marginTop: 2 }]}>{formatDateShort(w.date)}</Text>
              </View>
              <Text style={[rtlText, { width: 62, color: c.textMuted, fontSize: 12, textAlign: 'center' }]}>
                {formatQuantity(w.quantity)} {w.unit}
              </Text>
              <Text style={[rtlText, { width: 86, color: c.text, fontSize: 12.5, fontWeight: '800', textAlign: 'left' }]}>
                {formatMoney(workTotal(w), currency)}
              </Text>
            </Pressable>
          ))}
        </Card>

        <TotalsBlock
          subtotal={invoice.subtotal}
          discount={invoice.discount}
          taxRate={invoice.taxRate}
          taxAmount={invoice.taxAmount}
          total={invoice.total}
        />

        <SectionHeader title="تصدير ومشاركة" icon="share-social-outline" />
        <Card padded={false} style={{ marginBottom: SPACING.lg, overflow: 'hidden' }}>
          <MenuRow label="ملف طباعة / PDF" icon="print-outline" onPress={doPrint} hint="يفتح نافذة الطباعة ويمكن الحفظ كـ PDF" right={busy === 'print' ? <Ionicons name="reload" size={16} color={c.textFaint} /> : undefined} />
          {!isWeb ? (
            <MenuRow label="حفظ ومشاركة PDF" icon="document-outline" onPress={doPdf} hint="ينشئ ملف PDF جاهز للإرسال" />
          ) : null}
          <MenuRow label="مشاركة نصية" icon="chatbox-ellipses-outline" onPress={doShare} hint={isWeb ? 'نسخ تفاصيل الفاتورة إلى الحافظة' : 'إرسال ملخص الفاتورة عبر التطبيقات'} />
          <MenuRow label="تصدير CSV" icon="download-outline" onPress={doCsv} hint="ملف جدول بيانات لبنود الفاتورة" />
        </Card>

        <SectionHeader title="إدارة الفاتورة" icon="settings-outline" />
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <MenuRow
            label="تغيير الحالة"
            icon="swap-horizontal-outline"
            onPress={() => can(role, 'invoices.edit') && setStatusOpen(true)}
            hint={`الحالة الحالية: ${STATUS_LABELS[invoice.status]}`}
          />
          {invoice.status !== 'paid' ? (
            <MenuRow
              label="تحديد كمدفوعة"
              icon="checkmark-done-outline"
              tone="primary"
              onPress={() => can(role, 'invoices.edit') && changeStatus('paid')}
              hint="يتم تسجيل تاريخ السداد تلقائيًا"
            />
          ) : null}
          <MenuRow
            label="ملاحظات الفاتورة"
            icon="create-outline"
            onPress={() => {
              if (!can(role, 'invoices.edit')) {
                showToast('دورك الحالي لا يسمح بالتعديل', 'error');
                return;
              }
              setNotesDraft(invoice.notes);
              setNotesOpen(true);
            }}
            hint={invoice.notes || 'شروط الدفع، تفاصيل إضافية...'}
          />
          <MenuRow
            label="حذف الفاتورة"
            icon="trash-outline"
            tone="danger"
            onPress={() => {
              if (!can(role, 'invoices.delete')) {
                showToast('دورك الحالي لا يسمح بحذف الفواتير', 'error');
                return;
              }
              setConfirmDelete(true);
            }}
            hint="ستعود البنود إلى قائمة الأعمال غير المفوترة"
          />
        </Card>

        {!can(role, 'invoices.edit') ? (
          <View style={{ marginTop: SPACING.lg }}>
            <Text style={[rtlText, { color: c.textFaint, fontSize: 12, textAlign: 'center' }]}>
              دورك الحالي ({role === 'employee' ? 'موظف' : role === 'accountant' ? 'محاسب' : 'مدير'}) لا يسمح بتعديل حالة الفواتير
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <OptionPicker
        visible={statusOpen}
        title="تغيير حالة الفاتورة"
        searchable={false}
        options={[
          { value: 'draft', label: 'مسودة', hint: 'غير صادرة للعميل' },
          { value: 'issued', label: 'مستحقة', hint: 'صادرة وبانتظار التحصيل' },
          { value: 'paid', label: 'مدفوعة', hint: 'تم تحصيل قيمتها' },
        ]}
        selected={invoice.status}
        onSelect={(v) => changeStatus(v as InvoiceStatus)}
        onClose={() => setStatusOpen(false)}
      />

      <Modal visible={notesOpen} transparent animationType="fade" onRequestClose={() => setNotesOpen(false)}>
        <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'center', padding: SPACING.xl }}>
          <View style={{ backgroundColor: c.surface, borderRadius: RADIUS.xl, padding: SPACING.lg }}>
            <Text style={[rtlText, { color: c.text, fontSize: 16, fontWeight: '800', marginBottom: SPACING.md }]}>ملاحظات الفاتورة</Text>
            <Field label="الملاحظات" value={notesDraft} onChangeText={setNotesDraft} placeholder="شروط الدفع..." multiline />
            <View style={{ flexDirection: 'row-reverse', gap: SPACING.md }}>
              <View style={{ flex: 1 }}>
                <Btn
                  label="حفظ"
                  icon="checkmark"
                  onPress={() => {
                    updateInvoiceNotes(invoice.id, notesDraft.trim());
                    setNotesOpen(false);
                    showToast('تم حفظ الملاحظات');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Btn label="إلغاء" variant="outline" onPress={() => setNotesOpen(false)} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmDelete}
        title="حذف الفاتورة"
        body={`سيتم حذف الفاتورة ${invoice.number} وإرجاع ${items.length} بند إلى الأعمال غير المفوترة. هل أنت متأكد؟`}
        confirmLabel="حذف"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteInvoice(invoice.id);
          setConfirmDelete(false);
          showToast('تم حذف الفاتورة', 'info');
          nav.goBack();
        }}
      />
    </Screen>
  );
}

function monthPeriod(start: string, end: string): string {
  return `${formatDateShort(start)} → ${formatDateShort(end)}`;
}
