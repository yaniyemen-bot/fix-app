import React from 'react';
import { Platform, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette, RADIUS } from '../lib/theme';
import { useApp } from '../state/AppContext';
import { rtlText } from '../components/ui';

import HomeScreen from '../screens/HomeScreen';
import WorksScreen from '../screens/WorksScreen';
import WorkFormScreen from '../screens/WorkFormScreen';
import WorkDetailScreen from '../screens/WorkDetailScreen';
import InvoicesScreen from '../screens/InvoicesScreen';
import InvoiceNewScreen from '../screens/InvoiceNewScreen';
import InvoiceDetailScreen from '../screens/InvoiceDetailScreen';
import CompaniesScreen from '../screens/CompaniesScreen';
import CompanyFormScreen from '../screens/CompanyFormScreen';
import CompanyDetailScreen from '../screens/CompanyDetailScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CurrencyScreen from '../screens/CurrencyScreen';
import UsersScreen from '../screens/UsersScreen';
import ApkScreen from '../screens/ApkScreen';
import MoreScreen from '../screens/MoreScreen';

export type RootStackParamList = {
  Tabs: undefined;
  WorkForm: { workId?: string; companyId?: string; date?: string } | undefined;
  WorkDetail: { workId: string };
  InvoiceNew: { companyId?: string; monthKey?: string } | undefined;
  InvoiceDetail: { invoiceId: string };
  CompanyForm: { companyId?: string } | undefined;
  CompanyDetail: { companyId: string };
  Reports: undefined;
  Alerts: undefined;
  Settings: undefined;
  Currency: undefined;
  Users: undefined;
  Apk: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  HomeTab: 'home',
  WorksTab: 'briefcase',
  InvoicesTab: 'document-text',
  CompaniesTab: 'business',
  MoreTab: 'menu',
};

function Tabs() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { alerts } = useApp();
  const alertsCount = alerts.filter((a) => a.severity !== 'info').length;
  // ضمان ظهور شريط التبويبات فوق أزرار التنقل في أندرويد وشريط المتصفح في الجوال
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 0 : 12);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textFaint,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderTopWidth: 1,
          height: 66 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
        tabBarIcon: ({ color, size, focused }) => {
          const name = TAB_ICONS[route.name] ?? 'ellipse';
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={focused ? (name as any) : (name as any)} size={size - 2} color={color} />
              {route.name === 'MoreTab' && alertsCount > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    backgroundColor: c.danger,
                    borderRadius: RADIUS.pill,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '800' }}>{alertsCount}</Text>
                </View>
              ) : null}
            </View>
          );
        },
        tabBarLabel: ({ color, focused }) => {
          const labels: Record<string, string> = {
            HomeTab: 'الرئيسية',
            WorksTab: 'الأعمال',
            InvoicesTab: 'الفواتير',
            CompaniesTab: 'الشركات',
            MoreTab: 'المزيد',
          };
          return (
            <Text style={[rtlText, { color, fontSize: 11, fontWeight: focused ? '800' : '600', textAlign: 'center' }]}>
              {labels[route.name] ?? ''}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'الرئيسية' }} />
      <Tab.Screen name="WorksTab" component={WorksScreen} options={{ title: 'الأعمال' }} />
      <Tab.Screen name="InvoicesTab" component={InvoicesScreen} options={{ title: 'الفواتير' }} />
      <Tab.Screen name="CompaniesTab" component={CompaniesScreen} options={{ title: 'الشركات' }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: 'المزيد' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const c = usePalette();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'web' ? 'fade_from_bottom' : 'slide_from_right',
        contentStyle: { backgroundColor: c.bg },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="WorkForm" component={WorkFormScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="WorkDetail" component={WorkDetailScreen} />
      <Stack.Screen name="InvoiceNew" component={InvoiceNewScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <Stack.Screen name="CompanyForm" component={CompanyFormScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CompanyDetail" component={CompanyDetailScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Currency" component={CurrencyScreen} />
      <Stack.Screen name="Users" component={UsersScreen} />
      <Stack.Screen name="Apk" component={ApkScreen} />
    </Stack.Navigator>
  );
}
