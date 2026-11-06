import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { RADIUS, SPACING, usePalette } from '../lib/theme';
import { useApp } from '../state/AppContext';
import {
  Badge,
  Btn,
  Card,
  Field,
  InfoRow,
  Notice,
  ProgressBar,
  Screen,
  ScreenHeader,
  SectionHeader,
  rtlText,
} from '../components/ui';
import { copyToClipboard, downloadApkNative, downloadApkOnWeb, isWeb, openExternal, shareFileNative } from '../lib/exporters';

const EAS_BUILDS_URL = 'https://expo.dev/accounts/arcadalabs/projects/agon-preview/builds';

const BUILD_STEPS: { title: string; body: string; cmd?: string }[] = [
  {
    title: '1. تسجيل الدخول إلى حساب Expo',
    body: 'من مجلد المشروع على جهازك، سجّل الدخول بحسابك في Expo (حساب مجاني).',
    cmd: 'npx eas-cli@latest login',
  },
  {
    title: '2. بناء ملف APK في السحابة',
    body: 'ملف eas.json مضبوط مسبقًا: البروفايل preview ينتج ملف APK جاهز للتثبيت بدون الحاجة إلى Android Studio.',
    cmd: 'npx eas-cli@latest build -p android --profile preview',
  },
  {
    title: '3. نسخ رابط التحميل',
    body: 'بعد انتهاء البناء يظهر رابط Artifact لملف ‎.apk — انسخه والصقه في الحقل بالأعلى ثم اضغط «تنزيل APK».',
  },
  {
    title: '4. التثبيت على الهاتف',
    body: 'افتح الملف الذي تم تنزيله، وفعّل خيار «التثبيت من مصادر غير معروفة» عند الطلب، ثم اضغط تثبيت.',
  },
];

export default function ApkScreen() {
  const c = usePalette();
  const nav = useNavigation<any>();
  const { settings, updateSettings, showToast } = useApp();

  const [url, setUrl] = useState(settings.apkUrl ?? '');
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadedUri, setDownloadedUri] = useState<string | null>(null);

  const version = Constants.expoConfig?.version ?? '1.1.0';
  const packageName = Constants.expoConfig?.android?.package ?? 'com.arcadalabs.bizinvoices';
  const versionCode = `${Constants.expoConfig?.android?.versionCode ?? 2}`;
  const runtimeVersion =
    typeof Constants.expoConfig?.runtimeVersion === 'string'
      ? Constants.expoConfig.runtimeVersion
      : Constants.nativeBuildVersion ?? 'appVersion';
  const isAndroidApp = Platform.OS === 'android' && !isWeb;
  const filename = `biz-invoices-manager-v${version}.apk`;

  const saveUrl = () => {
    updateSettings({ apkUrl: url.trim() });
    showToast('تم حفظ رابط ملف APK');
  };

  const startDownload = async () => {
    const target = url.trim();
    if (!target) {
      showToast('أدخل رابط ملف APK أولًا', 'error');
      return;
    }
    if (!/^https?:\/\//i.test(target)) {
      showToast('الرابط يجب أن يبدأ بـ https:// أو http://', 'error');
      return;
    }
    updateSettings({ apkUrl: target });

    if (isWeb) {
      const ok = downloadApkOnWeb(target, filename);
      showToast(ok ? 'بدأ تنزيل ملف APK عبر المتصفح' : 'تعذر بدء التنزيل - تحقق من الرابط', ok ? 'success' : 'error');
      return;
    }

    if (Platform.OS === 'ios') {
      await openExternal(target);
      showToast('ملف APK مخصص لأندرويد - تم فتح الرابط في المتصفح', 'info');
      return;
    }

    setStatus('downloading');
    setProgress(0);
    setDownloadedUri(null);
    const uri = await downloadApkNative(target, filename, (p) => {
      if (p.totalBytes > 0) setProgress(Math.round((p.bytesWritten / p.totalBytes) * 100));
      else setProgress((prev) => Math.min(95, prev + 5));
    });
    if (!uri) {
      setStatus('error');
      setProgress(0);
      showToast('فشل تنزيل الملف - تحقق من الرابط أو من اتصال الإنترنت', 'error');
      return;
    }
    setProgress(100);
    setStatus('done');
    setDownloadedUri(uri);
    const shared = await shareFileNative(uri, 'application/vnd.android.package-archive', 'تثبيت التطبيق');
    showToast(shared ? 'تم تنزيل APK - افتح الملف للتثبيت' : 'تم حفظ ملف APK في ذاكرة التطبيق', shared ? 'success' : 'info');
  };

  const copy = async (text: string) => {
    const ok = await copyToClipboard(text);
    showToast(ok ? 'تم نسخ الأمر' : 'تعذر النسخ', ok ? 'info' : 'error');
  };

  return (
    <Screen>
      <ScreenHeader
        title="تنزيل التطبيق APK"
        subtitle="نسخة أندرويد قابلة للتثبيت مباشرة على الهاتف"
        onBack={() => nav.goBack()}
        right={
          <View style={{ backgroundColor: 'rgba(61,220,132,0.18)', borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={[rtlText, { color: '#3DDC84', fontSize: 12, fontWeight: '800' }]}>Android</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Card style={{ marginBottom: SPACING.lg }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: RADIUS.lg,
                backgroundColor: c.successSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="logo-android" size={24} color={c.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[rtlText, { color: c.text, fontSize: 15.5, fontWeight: '800' }]}>مدير الأعمال والفواتير</Text>
              <Text style={[rtlText, { color: c.textMuted, fontSize: 12, marginTop: 3 }]}>الإصدار {version} • ملف تثبيت APK</Text>
            </View>
            <Badge label={isAndroidApp ? 'مثبت ✅' : isWeb ? 'نسخة ويب' : Platform.OS.toUpperCase()} tone={isAndroidApp ? 'success' : 'info'} />
          </View>
          <InfoRow label="معرّف التطبيق" value={packageName} icon="finger-print-outline" />
          <InfoRow label="رمز الإصدار" value={versionCode} icon="git-branch-outline" />
          <InfoRow label="إصدار الواجهة" value={`${runtimeVersion}`} icon="layers-outline" />
          <InfoRow label="بيئة التشغيل" value={isWeb ? 'متصفح (Web)' : isAndroidApp ? 'تطبيق أندرويد أصلي' : Platform.OS} icon="phone-portrait-outline" />
        </Card>

        {isAndroidApp ? (
          <Notice
            tone="success"
            icon="checkmark-done-circle"
            text="أنت تستخدم الآن نسخة APK المثبتة على أندرويد. يمكنك استخدام الحقل أدناه لتنزيل إصدار أحدث عند توفره ثم فتحه للتثبيت."
          />
        ) : isWeb ? (
          <Notice
            tone="info"
            icon="information-circle"
            text="أنت تستخدم نسخة الويب. للحصول على التطبيق كملف APK على هاتف أندرويد: الصق رابط ملف APK في الحقل أدناه واضغط «تنزيل APK»، أو ابنِ الملف من مشروع Expo بالخطوات في الأسفل."
          />
        ) : (
          <Notice tone="warning" icon="logo-apple-ar" text="ملف APK مخصص لنظام أندرويد فقط. على iOS يمكنك فتح رابط الملف في المتصفح." />
        )}

        <SectionHeader title="رابط ملف APK" icon="link-outline" />
        <Card style={{ marginBottom: SPACING.lg }}>
          <Field
            label="الرابط المباشر لملف ‎.apk"
            value={url}
            onChangeText={setUrl}
            placeholder="https://expo.dev/artifacts/eas/xxxxxx.apk"
            autoCapitalize="none"
            hint="يُحفظ الرابط على جهازك لتتمكن من التنزيل بضغطة واحدة في كل مرة"
          />
          <Btn label="تنزيل APK" icon="download-outline" onPress={startDownload} loading={status === 'downloading'} />
          <View style={{ flexDirection: 'row-reverse', gap: SPACING.sm, marginTop: SPACING.sm }}>
            <View style={{ flex: 1 }}>
              <Btn label="حفظ الرابط" icon="bookmark-outline" variant="outline" compact onPress={saveUrl} />
            </View>
            {downloadedUri ? (
              <View style={{ flex: 1 }}>
                <Btn
                  label="فتح الملف"
                  icon="folder-open-outline"
                  variant="secondary"
                  compact
                  onPress={() => shareFileNative(downloadedUri, 'application/vnd.android.package-archive', 'تثبيت التطبيق')}
                />
              </View>
            ) : null}
          </View>

          {status === 'downloading' || status === 'done' ? (
            <View style={{ marginTop: SPACING.lg }}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[rtlText, { color: c.textMuted, fontSize: 12, fontWeight: '700' }]}>
                  {status === 'done' ? 'اكتمل التنزيل' : 'جاري تنزيل ملف APK...'}
                </Text>
                <Text style={[rtlText, { color: c.primaryText, fontSize: 12, fontWeight: '800' }]}>{progress}%</Text>
              </View>
              <ProgressBar value={progress} tone={status === 'done' ? c.success : c.primary} />
              <Text style={[rtlText, { color: c.textFaint, fontSize: 11.5, marginTop: 8 }]}>{filename}</Text>
            </View>
          ) : null}

          {status === 'error' ? (
            <View style={{ marginTop: SPACING.md }}>
              <Notice tone="danger" icon="alert-circle" text="تعذر التنزيل. تأكد من صحة الرابط ومن أن الخادم يسمح بالتنزيل المباشر، ثم حاول مجددًا." />
            </View>
          ) : null}
        </Card>

        <SectionHeader title="بناء ملف APK من مشروع Expo" icon="build-outline" />
        <Card style={{ marginBottom: SPACING.lg }}>
          {BUILD_STEPS.map((step, idx) => (
            <View
              key={step.title}
              style={{
                paddingVertical: idx === 0 ? 0 : SPACING.md,
                borderTopWidth: idx === 0 ? 0 : 1,
                borderTopColor: c.borderSoft,
              }}
            >
              <Text style={[rtlText, { color: c.text, fontSize: 13.5, fontWeight: '800' }]}>{step.title}</Text>
              <Text style={[rtlText, { color: c.textMuted, fontSize: 12.5, marginTop: 5, lineHeight: 20 }]}>{step.body}</Text>
              {step.cmd ? (
                <Pressable
                  onPress={() => copy(step.cmd as string)}
                  style={({ pressed }) => ({
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    gap: SPACING.sm,
                    backgroundColor: '#0F172A',
                    borderRadius: RADIUS.md,
                    paddingHorizontal: SPACING.md,
                    paddingVertical: 10,
                    marginTop: 8,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Ionicons name="copy-outline" size={15} color="#7FF3E4" />
                  <Text
                    style={{
                      flex: 1,
                      color: '#E8EEF9',
                      fontSize: 12,
                      fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                      textAlign: 'left',
                      writingDirection: 'ltr',
                    }}
                    numberOfLines={2}
                  >
                    {step.cmd}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </Card>

        <View style={{ gap: SPACING.md }}>
          <Btn label="فتح صفحة البناءات في EAS" icon="open-outline" variant="secondary" onPress={() => openExternal(EAS_BUILDS_URL)} />
          <Btn label="الإعدادات العامة" icon="settings-outline" variant="outline" onPress={() => nav.navigate('Settings')} />
        </View>

        <View style={{ marginTop: SPACING.xl }}>
          <Notice
            tone="primary"
            icon="shield-checkmark-outline"
            text="ملف APK يُبنى عبر EAS Build باستخدام eas.json الموجود في المشروع (بروفايل preview بنوع بناء apk). جميع بيانات التطبيق محفوظة محليًا على جهازك ولا تُرسل إلى أي خادم."
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
