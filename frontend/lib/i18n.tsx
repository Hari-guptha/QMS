'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

const translations: Translations = {
  // Common
  'common.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
  'common.error': { en: 'Error', ar: 'خطأ' },
  'common.success': { en: 'Success', ar: 'نجح' },
  'common.save': { en: 'Save', ar: 'حفظ' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'common.submit': { en: 'Submit', ar: 'إرسال' },
  'common.back': { en: 'Back', ar: 'رجوع' },
  'common.next': { en: 'Next', ar: 'التالي' },
  'common.close': { en: 'Close', ar: 'إغلاق' },
  'common.required': { en: 'Required', ar: 'مطلوب' },
  'common.or': { en: 'or', ar: 'أو' },
  
  // Navigation
  'nav.queueManagement': { en: 'Queue Management System', ar: 'نظام إدارة الطوابير' },
  'nav.myAccount': { en: 'My Account', ar: 'حسابي' },
  'nav.themeLayout': { en: 'Theme & Layout', ar: 'المظهر والتخطيط' },
  'nav.updatePassword': { en: 'Update Password', ar: 'تحديث كلمة المرور' },
  'nav.signOut': { en: 'Sign Out', ar: 'تسجيل الخروج' },
  'nav.account': { en: 'Account', ar: 'حساب' },
  
  // Customer
  'customer.checkIn': { en: 'Customer Check-In', ar: 'تسجيل وصول العميل' },
  'customer.selectService': { en: 'Select a service category and get your queue token instantly', ar: 'اختر فئة الخدمة واحصل على رمز الطابور فوراً' },
  'customer.selectServiceStep': { en: 'Select Service', ar: 'اختر الخدمة' },
  'customer.yourDetails': { en: 'Your Details', ar: 'تفاصيلك' },
  'customer.name': { en: 'Name', ar: 'الاسم' },
  'customer.phone': { en: 'Phone', ar: 'الهاتف' },
  'customer.email': { en: 'Email', ar: 'البريد الإلكتروني' },
  'customer.emailOptional': { en: 'Email (Optional)', ar: 'البريد الإلكتروني (اختياري)' },
  'customer.getToken': { en: 'Get My Token', ar: 'احصل على رمزي' },
  'customer.processing': { en: 'Processing...', ar: 'جاري المعالجة...' },
  'customer.tokenNumber': { en: 'Your Token Number', ar: 'رقم رمزك' },
  'customer.category': { en: 'Category', ar: 'الفئة' },
  'customer.status': { en: 'Status', ar: 'الحالة' },
  'customer.positionInQueue': { en: 'Position in Queue', ar: 'الموقع في الطابور' },
  'customer.assignedAgent': { en: 'Assigned Agent', ar: 'الموظف المخصص' },
  'customer.viewStatusPage': { en: 'View Status Page', ar: 'عرض صفحة الحالة' },
  'customer.checkInAgain': { en: 'Check In Again', ar: 'تسجيل وصول مرة أخرى' },
  'customer.viewQueueStatus': { en: 'View Queue Status', ar: 'عرض حالة الطابور' },
  'customer.backToHome': { en: 'Back to Home', ar: 'العودة إلى الصفحة الرئيسية' },
  'customer.selectedService': { en: 'Selected Service', ar: 'الخدمة المحددة' },
  'customer.change': { en: 'Change', ar: 'تغيير' },
  'customer.enterFullName': { en: 'Enter your full name', ar: 'أدخل اسمك الكامل' },
  'customer.enterPhone': { en: '+1234567890', ar: '+1234567890' },
  'customer.enterEmail': { en: 'your@email.com', ar: 'your@email.com' },
  'customer.loadingCategories': { en: 'Loading service categories...', ar: 'جاري تحميل فئات الخدمات...' },
  'customer.noCategories': { en: 'No service categories available at the moment.', ar: 'لا توجد فئات خدمات متاحة في الوقت الحالي.' },
  'customer.estimatedWait': { en: 'Est. wait:', ar: 'الوقت المتوقع:' },
  'customer.minutes': { en: 'min', ar: 'دقيقة' },
  
  // Dashboard
  'dashboard.admin': { en: 'Admin Dashboard', ar: 'لوحة تحكم المدير' },
  'dashboard.agent': { en: 'Agent Dashboard', ar: 'لوحة تحكم الموظف' },
  'dashboard.manageSystem': { en: 'Manage your queue management system', ar: 'إدارة نظام إدارة الطوابير الخاص بك' },
  
  // Home
  'home.title': { en: 'Queue Management System', ar: 'نظام إدارة الطوابير' },
  'home.titleMain': { en: 'Queue Management', ar: 'إدارة الطوابير' },
  'home.titleSystem': { en: 'System', ar: 'النظام' },
  'home.customer': { en: 'Customer', ar: 'عميل' },
  'home.customerDesc': { en: 'Check in and get your queue token instantly', ar: 'سجل الوصول واحصل على رمز الطابور فوراً' },
  'home.agent': { en: 'Agent', ar: 'موظف' },
  'home.agentDesc': { en: 'Manage your queue and serve customers efficiently', ar: 'إدارة طابورك وخدمة العملاء بكفاءة' },
  'home.admin': { en: 'Admin', ar: 'مدير' },
  'home.adminDesc': { en: 'System administration and analytics dashboard', ar: 'لوحة تحكم إدارة النظام والتحليلات' },
  'home.getStarted': { en: 'Get Started', ar: 'ابدأ' },
  'home.viewPublicStatus': { en: 'View Public Status Page', ar: 'عرض صفحة الحالة العامة' },
  'home.featureLightning': { en: 'Lightning Fast', ar: 'سريع جداً' },
  'home.featureLightningDesc': { en: 'Instant token generation and real-time updates', ar: 'إنشاء رمز فوري وتحديثات في الوقت الفعلي' },
  'home.featureAnalytics': { en: 'Analytics Dashboard', ar: 'لوحة تحكم التحليلات' },
  'home.featureAnalyticsDesc': { en: 'Comprehensive insights and performance metrics', ar: 'رؤى شاملة ومقاييس الأداء' },
  'home.featureSecure': { en: 'Secure & Reliable', ar: 'آمن وموثوق' },
  'home.featureSecureDesc': { en: 'Enterprise-grade security and data protection', ar: 'أمان على مستوى المؤسسات وحماية البيانات' },
  'home.featureRealtime': { en: 'Real-time Updates', ar: 'تحديثات فورية' },
  'home.featureRealtimeDesc': { en: 'Live queue status and instant notifications', ar: 'حالة الطابور المباشرة وإشعارات فورية' },
  
  // Status
  'status.title': { en: 'Queue Status', ar: 'حالة الطابور' },
  'status.subtitle': { en: 'Real-time view of all active queues and ticket statuses', ar: 'عرض مباشر لجميع الطوابير النشطة وحالات التذاكر' },
  'status.loading': { en: 'Loading queue status...', ar: 'جاري تحميل حالة الطابور...' },
  'status.totalTickets': { en: 'Total Tickets', ar: 'إجمالي التذاكر' },
  'status.pending': { en: 'Pending', ar: 'قيد الانتظار' },
  'status.active': { en: 'Active', ar: 'نشط' },
  'status.agents': { en: 'Agents', ar: 'الموظفون' },
  'status.liveUpdates': { en: 'Live Updates', ar: 'تحديثات مباشرة' },
  'status.disconnected': { en: 'Disconnected', ar: 'غير متصل' },
  'status.lastUpdated': { en: 'Last updated:', ar: 'آخر تحديث:' },
  'status.refresh': { en: 'Refresh', ar: 'تحديث' },
  'status.noActiveQueues': { en: 'No Active Queues', ar: 'لا توجد طوابير نشطة' },
  'status.noActiveQueuesDesc': { en: 'There are no active queues at the moment. Check back later!', ar: 'لا توجد طوابير نشطة في الوقت الحالي. تحقق مرة أخرى لاحقاً!' },
  'status.noTicketsInQueue': { en: 'No tickets in queue', ar: 'لا توجد تذاكر في الطابور' },
  'status.position': { en: 'Position:', ar: 'الموقع:' },
  'status.called': { en: 'Called', ar: 'تم الاستدعاء' },
  'status.serving': { en: 'Serving', ar: 'قيد الخدمة' },
  'status.completed': { en: 'Completed', ar: 'مكتمل' },
  'status.hold': { en: 'Hold', ar: 'معلق' },
  'status.noShow': { en: 'No Show', ar: 'لم يحضر' },
  
  // Login
  'login.welcomeBack': { en: 'Welcome Back', ar: 'مرحباً بعودتك' },
  'login.signInToQMS': { en: 'Sign in to your QMS account', ar: 'قم بتسجيل الدخول إلى حساب QMS الخاص بك' },
  'login.login': { en: 'Login', ar: 'تسجيل الدخول' },
  'login.password': { en: 'Password', ar: 'كلمة المرور' },
  'login.enterLoginId': { en: 'Enter your login Id', ar: 'أدخل معرف تسجيل الدخول الخاص بك' },
  'login.enterPassword': { en: 'Enter your password', ar: 'أدخل كلمة المرور الخاصة بك' },
  'login.rememberMe': { en: 'Remember me', ar: 'تذكرني' },
  'login.forgotPassword': { en: 'Forgot password?', ar: 'نسيت كلمة المرور؟' },
  'login.signIn': { en: 'Sign In', ar: 'تسجيل الدخول' },
  'login.signingIn': { en: 'Signing in...', ar: 'جاري تسجيل الدخول...' },
  'login.signInWithMicrosoft': { en: 'Sign in with Microsoft', ar: 'تسجيل الدخول باستخدام Microsoft' },
  'login.failed': { en: 'Login failed', ar: 'فشل تسجيل الدخول' },
  'login.accessDeniedAdmin': { en: 'Access denied. Admin account required.', ar: 'تم رفض الوصول. يلزم حساب المدير.' },
  'login.accessDeniedAgent': { en: 'Access denied. Agent account required.', ar: 'تم رفض الوصول. يلزم حساب الموظف.' },
  'login.useAdminPage': { en: 'Please use the Admin login page to access admin features.', ar: 'يرجى استخدام صفحة تسجيل دخول المدير للوصول إلى ميزات المدير.' },
  
  // Errors
  'error.nameRequired': { en: 'Name is required', ar: 'الاسم مطلوب' },
  'error.phoneRequired': { en: 'Phone number is required', ar: 'رقم الهاتف مطلوب' },
  'error.failedCheckIn': { en: 'Failed to check in. Please try again.', ar: 'فشل تسجيل الوصول. يرجى المحاولة مرة أخرى.' },
  'error.failedLoadCategories': { en: 'Failed to load service categories. Please try again.', ar: 'فشل تحميل فئات الخدمات. يرجى المحاولة مرة أخرى.' },
  'error.ticketNotFound': { en: 'Ticket not found', ar: 'لم يتم العثور على التذكرة' },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      // Update HTML dir attribute
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    if (mounted && typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language] || translation.en;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  // Always provide context value, even during SSR
  const contextValue: I18nContextType = {
    language,
    setLanguage,
    t,
    dir,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

