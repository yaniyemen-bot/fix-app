import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Alert 
} from 'react-native';
import { useApp } from '../lib/AppContext'; // تأكد من مطابقة المسار لملف AppContext لديك

export default function CashFlowScreen() {
  const { cashFlows, addCashFlow } = useApp();

  // حالات النموذج (Form States)
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');

  // معالجة حفظ العملية الحسابية
  const handleSave = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }
    if (!details.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال تفاصيل أو بيان العملية');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // استدعاء الدالة المدمجة في AppContext
    addCashFlow({
      type,
      amount: Number(amount),
      details: details.trim(),
      date: today,
    });

    // إعادة تهيئة الحقول بعد الحفظ بنجاح
    setAmount('');
    setDetails('');
    Alert.alert('نجاح', 'تم تسجيل العملية المالية بنجاح في حركة الصندوق');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>إدارة حركة الصندوق اليومية</Text>

      {/* نموذج الإدخال */}
      <View style={styles.formCard}>
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[styles.typeButton, type === 'income' && styles.incomeActive]} 
            onPress={() => setType('income')}
          >
            <Text style={[styles.typeText, type === 'income' && styles.activeText]}>إيراد (+)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.typeButton, type === 'expense' && styles.expenseActive]} 
            onPress={() => setType('expense')}
          >
            <Text style={[styles.typeText, type === 'expense' && styles.activeText]}>مصروف (-)</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="المبلغ (ر.ي)"
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="تفاصيل العملية والبيان..."
          placeholderTextColor="#64748B"
          multiline
          numberOfLines={3}
          value={details}
          onChangeText={setDetails}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>حفظ وتثبيت العملية</Text>
        </TouchableOpacity>
      </View>

      {/* سجل الحركات الماليّة */}
      <Text style={styles.sectionTitle}>آخر الحركات المسجلة</Text>
      <FlatList
        data={cashFlows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <View style={styles.historyRight}>
              <Text style={styles.historyDetails}>{item.details}</Text>
              <Text style={styles.historyDate}>{item.date}</Text>
            </View>
            <Text style={[styles.historyAmount, item.type === 'income' ? styles.textIncome : styles.textExpense]}>
              {item.type === 'income' ? '+' : '-'} {item.amount.toLocaleString()} ر.ي
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>لا توجد حركات مالية مسجلة حالياً</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B132B', padding: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  formCard: { backgroundColor: '#1C2541', padding: 16, borderRadius: 12, marginBottom: 20 },
  typeSelector: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  typeButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#3A506B', alignItems: 'center' },
  incomeActive: { backgroundColor: '#10B981' },
  expenseActive: { backgroundColor: '#EF4444' },
  typeText: { color: '#94A3B8', fontWeight: 'bold' },
  activeText: { color: '#FFFFFF' },
  input: { backgroundColor: '#0B132B', color: '#FFFFFF', padding: 12, borderRadius: 8, marginBottom: 12, textAlign: 'right' },
  textArea: { height: 60, textAlignVertical: 'top' },
  saveButton: { backgroundColor: '#4EA8DE', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  saveButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  sectionTitle: { color: '#94A3B8', fontSize: 15, fontWeight: '600', marginBottom: 10, textAlign: 'right' },
  historyCard: { backgroundColor: '#1C2541', padding: 12, borderRadius: 8, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyRight: { alignItems: 'flex-end' },
  historyDetails: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  historyDate: { color: '#64748B', fontSize: 11, marginTop: 4 },
  historyAmount: { fontSize: 15, fontWeight: 'bold' },
  textIncome: { color: '#10B981' },
  textExpense: { color: '#EF4444' },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 20, fontSize: 13 }
});
