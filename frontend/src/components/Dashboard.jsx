import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import FileUploader from './FileUploader';
import ConfigPanel from './ConfigPanel';
import BookPreview from './BookPreview';
import Logo from './Logo';
import AuthModal from './AuthModal';
import { CoverGenerator } from '../services/CoverGenerator';
import { InteriorGenerator } from '../services/InteriorGenerator';
import { 
  Download, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Lock, 
  CreditCard,
  User,
  LogOut,
  LogIn,
  UserPlus,
  HelpCircle,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const {
    frontCover,
    backCover,
    interiorPages,
    spineColor,
    spineText,
    spineTextColor,
    spineTextDirection,
    spineImage,
    activeTrimSize,
    activePaperType,
    hasBleed,
    isSingleSided,
    addBlankAtStart,
    isDemoMode,
    clearAll,
    purchaseProjectPass,
    proToken,
    oneTimeProjectPass,
    checkoutStatus,
    setOneTimeProjectPass,
    user,
    userProfile,
    signOut,
    isAuthModalOpen,
    setIsAuthModalOpen,
    changeLanguage,
    language,
    currency,
    changeCurrency,
    formatPrice,
    oneTimePassPriceUsd,
    monthlyProPriceUsd,
    yearlySubscriptionPriceUsd
  } = useApp();

  const [emailInput, setEmailInput] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('demo'); // 'demo' | 'one_time' | 'subscription' | 'yearly'
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [downloadUrls, setDownloadUrls] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Sidebar collapsible state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auth modal default mode state
  const [authModalMode, setAuthModalMode] = useState('login');

  // Checkout pricing modal state
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [showOnlyPaidPlans, setShowOnlyPaidPlans] = useState(false);
  const [isShowLowPageCountConfirm, setIsShowLowPageCountConfirm] = useState(false);

  const pageCount = (interiorPages.length * (isSingleSided ? 2 : 1)) + (addBlankAtStart ? 1 : 0);
  const isCoverReady = !!(frontCover && backCover);
  const isInteriorReady = pageCount >= 24;
  const canGenerate = isCoverReady && interiorPages.length > 0;

  const handleLanguageToggle = (lang) => {
    changeLanguage(lang);
  };

  const handleCurrencyChange = (e) => {
    changeCurrency(e.target.value);
  };



  const handleCheckoutTrigger = (provider) => {
    const targetEmail = emailInput || user?.email || '';
    if (!targetEmail) {
      alert(t('engine.enterEmailPrompt', 'Please enter your email address to proceed with checkout.'));
      return;
    }

    let targetAmount = oneTimePassPriceUsd;
    if (selectedPlan === 'subscription') {
      targetAmount = monthlyProPriceUsd;
    } else if (selectedPlan === 'yearly') {
      targetAmount = yearlySubscriptionPriceUsd;
    }
    purchaseProjectPass(targetEmail, provider, selectedPlan, targetAmount);
  };

  const startGenerateFlow = () => {
    if (user || !isDemoMode) {
      executePDFGeneration(false);
    } else {
      // Show checkout options modal
      setShowOnlyPaidPlans(false);
      setSelectedPlan('demo');
      setIsCheckoutModalOpen(true);
    }
  };

  const handleGeneratePDFs = () => {
    if (!canGenerate) return;
    
    if (pageCount < 24) {
      setIsShowLowPageCountConfirm(true);
    } else {
      startGenerateFlow();
    }
  };

  const executePDFGeneration = async (demoOverride = false) => {
    setIsGenerating(true);
    setGenerationProgress(10);
    setErrorMsg('');
    setDownloadUrls(null);

    try {
      // 1. Generate Cover Spread PDF
      setGenerationStep('Generating KDP Cover Spread PDF...');
      const coverPdfBlob = await CoverGenerator.generate({
        frontCover: frontCover,
        backCover: backCover,
        trimSize: activeTrimSize,
        paperType: activePaperType,
        pageCount: pageCount,
        spineColor: spineColor,
        spineText: spineText,
        spineTextColor: spineTextColor,
        spineTextDirection: spineTextDirection,
        spineImage: spineImage
      });
      setGenerationProgress(50);

      // 2. Generate Interior Spreads PDF
      setGenerationStep('Generating KDP Interior PDF with Gutter Shifts...');
      const interiorPdfBlob = await InteriorGenerator.generate({
        interiorPages: interiorPages,
        trimSize: activeTrimSize,
        hasBleed: hasBleed,
        isSingleSided: isSingleSided,
        addBlankAtStart: addBlankAtStart,
        isDemoMode: demoOverride,
        onProgress: (progressPercent) => {
          setGenerationProgress(50 + Math.round(progressPercent * 0.45));
        }
      });

      setGenerationProgress(100);
      setGenerationStep('Done! Preparing downloads...');

      // Create downloadable URLs
      const coverBlob = new Blob([coverPdfBlob], { type: 'application/pdf' });
      const interiorBlob = new Blob([interiorPdfBlob], { type: 'application/pdf' });

      const coverUrl = URL.createObjectURL(coverBlob);
      const interiorUrl = URL.createObjectURL(interiorBlob);

      setDownloadUrls({
        cover: coverUrl,
        interior: interiorUrl,
        coverFilename: `KDP_Cover_Spread_${activeTrimSize.id}_${pageCount}p.pdf`,
        interiorFilename: `KDP_Interior_${activeTrimSize.id}_${pageCount}p.pdf`
      });
    } catch (err) {
      console.error('PDF Generation failed:', err);
      setErrorMsg(`PDF Generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Auth Modal Dialog */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        defaultMode={authModalMode}
      />

      {/* Low Page Count Confirmation Modal */}
      {isShowLowPageCountConfirm && (
        <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-fade-in space-y-6">
            
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Внимание: Требования KDP
              </h3>
              <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed">
                Минимальное количество страниц для публикации на Amazon KDP — 24. Сейчас в вашей книге <strong className="text-slate-900 dark:text-white font-bold">{pageCount}</strong> страниц. KDP может не принять этот файл для публикации. Вы хотите продолжить генерацию PDF для черновика/проверки?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setIsShowLowPageCountConfirm(false);
                  startGenerateFlow();
                }}
                className="py-2.5 px-4 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all text-center"
              >
                Продолжить генерацию
              </button>
              <button
                onClick={() => setIsShowLowPageCountConfirm(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-250 font-bold text-xs rounded-xl cursor-pointer transition-all text-center"
              >
                Отмена
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Checkout / Billing Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative animate-fade-in space-y-6">
            
            {/* Currency Selector (Symmetric to Close button) */}
            <div className="absolute top-5 left-5">
              <select
                value={currency}
                onChange={handleCurrencyChange}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer focus:outline-none text-slate-700 dark:text-slate-200 shadow-2xs"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="NIS">NIS (₪)</option>
              </select>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsCheckoutModalOpen(false)}
              type="button"
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-1">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-sans">
                {showOnlyPaidPlans ? 'Выберите Pro тариф для продолжения' : 'Сборка PDF документа'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {showOnlyPaidPlans 
                  ? 'Зарегистрированным авторам доступен экспорт без ограничений страниц и водяных знаков.'
                  : 'Выберите демонстрационный режим или активируйте Pro-версию для скачивания полной книги.'}
              </p>
            </div>

            {/* Radio Option Switcher cards */}
            <div className="space-y-3">
              {/* Option 1: Demo (Only shown if !showOnlyPaidPlans) */}
              {!showOnlyPaidPlans && (
                <label
                  onClick={() => setSelectedPlan('demo')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedPlan === 'demo'
                      ? 'border-indigo-650 bg-indigo-50/20 dark:bg-indigo-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="billingPlan"
                      checked={selectedPlan === 'demo'}
                      onChange={() => setSelectedPlan('demo')}
                      className="accent-indigo-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-150 block">Демо-версия</span>
                      <span className="text-[10px] text-slate-400">Лимит 10 страниц, водяной знак &quot;DEMO MODE&quot;</span>
                    </div>
                  </div>
                  <strong className="text-xs font-bold text-slate-850 dark:text-slate-150">Бесплатно</strong>
                </label>
              )}

              {/* Option 2: One-time single project pass */}
              <label
                onClick={() => setSelectedPlan('one_time')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'one_time'
                    ? 'border-indigo-650 bg-indigo-50/20 dark:bg-indigo-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 bg-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="billingPlan"
                    checked={selectedPlan === 'one_time'}
                    onChange={() => setSelectedPlan('one_time')}
                    className="accent-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-850 dark:text-slate-150 block">Одноразовая генерация (Single Project)</span>
                    <span className="text-[10px] text-slate-400">Полный экспорт одной собранной книги без ограничений</span>
                  </div>
                </div>
                <strong className="text-xs font-bold text-slate-850 dark:text-slate-150">{formatPrice(oneTimePassPriceUsd)}</strong>
              </label>

              {/* Option 3: Monthly Subscription */}
              <label
                onClick={() => setSelectedPlan('subscription')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'subscription'
                    ? 'border-indigo-650 bg-indigo-50/20 dark:bg-indigo-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 bg-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="billingPlan"
                    checked={selectedPlan === 'subscription'}
                    onChange={() => setSelectedPlan('subscription')}
                    className="accent-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-850 dark:text-slate-150 block">Ежемесячная подписка Pro (Monthly subscription)</span>
                    <span className="text-[10px] text-slate-400">Безлимитный экспорт любых книг, отмена в любое время</span>
                  </div>
                </div>
                <strong className="text-xs font-bold text-slate-850 dark:text-slate-150">{formatPrice(monthlyProPriceUsd)} / мес</strong>
              </label>

              {/* Option 4: Yearly Subscription */}
              <label
                onClick={() => setSelectedPlan('yearly')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                  selectedPlan === 'yearly'
                    ? 'border-indigo-650 bg-indigo-50/20 dark:bg-indigo-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 bg-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="billingPlan"
                    checked={selectedPlan === 'yearly'}
                    onChange={() => setSelectedPlan('yearly')}
                    className="accent-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-850 dark:text-slate-150 block flex items-center gap-2">
                      Годовая подписка Pro (Yearly subscription)
                      <span className="px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-full">
                        1 month free
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400">Максимальная выгода для постоянных авторов</span>
                  </div>
                </div>
                <strong className="text-xs font-bold text-slate-850 dark:text-slate-150">{formatPrice(yearlySubscriptionPriceUsd)} / год</strong>
              </label>
            </div>

            {/* Switch Actions */}
            {selectedPlan === 'demo' ? (
              <button
                onClick={() => {
                  setIsCheckoutModalOpen(false);
                  executePDFGeneration(true);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all text-center block"
              >
                Сгенерировать демо-версию
              </button>
            ) : (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Email prompt if user is guest */}
                {!user && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Адрес электронной почты для отправки чека и доступа:
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Payment provider choices */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Выберите метод оплаты:
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleCheckoutTrigger('paypal')}
                      className="py-3 px-4 bg-[#FFC439] hover:bg-[#E5AF30] text-[#003087] font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      PayPal
                    </button>
                    <button
                      onClick={() => handleCheckoutTrigger('allpay')}
                      className="py-3 px-4 bg-slate-900 dark:bg-slate-105 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      Кредитная карта
                    </button>
                  </div>
                </div>

                {/* Local Dev Bypass button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setOneTimeProjectPass(true);
                      setIsCheckoutModalOpen(false);
                    }}
                    type="button"
                    className="text-[11px] font-semibold text-indigo-500 hover:underline cursor-pointer"
                  >
                    {t('engine.skipSimulatePro', 'Skip & Simulate Pro Mode (Local bypass)')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Max-width Unified Wrapper */}
      <div className="max-w-[1500px] w-full mx-auto px-4 md:px-6 flex flex-col flex-1">

        {/* Header Bar */}
        <header className="sticky top-2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3.5 my-3 rounded-2xl flex flex-col md:flex-row gap-3 md:gap-0 justify-between items-center shadow-xs">
          <div className="flex justify-between items-center w-full md:w-auto">
            <Logo />
            {/* Mobile Auth Status Badge */}
            <div className="flex md:hidden items-center gap-2">
              {user ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl max-w-[100px] truncate">
                    <User className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span className="text-[10px] font-bold truncate text-slate-700 dark:text-slate-200">
                      {user.email}
                    </span>
                  </div>
                  <button
                    onClick={signOut}
                    type="button"
                    className="p-1.5 text-slate-500 hover:text-red-650 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setAuthModalMode('signup');
                      setIsAuthModalOpen(true);
                    }}
                    type="button"
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-extrabold shadow-sm"
                  >
                    Регистрация
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    type="button"
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-200 rounded-lg text-[9px] font-extrabold shadow-sm"
                  >
                    Вход
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Controls & Switchers */}
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2 md:gap-3 border-t md:border-t-0 border-slate-105 dark:border-slate-800 pt-2.5 md:pt-0">
            <div className="flex items-center gap-2">

              {/* Language Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handleLanguageToggle('en')}
                  type="button"
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                    language.startsWith('en')
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => handleLanguageToggle('ru')}
                  type="button"
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                    language.startsWith('ru')
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  RU
                </button>
              </div>

              {/* Support help button */}
              <a
                href="/support"
                className="p-1.5 text-slate-500 hover:text-indigo-655 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Support & Help"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </a>

              {/* Admin Panel button (Admin user check) */}
              {user && userProfile?.role === 'admin' && (
                <a
                  href="/admin"
                  className="px-2 py-1 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-350 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin</span>
                </a>
              )}
            </div>

            {/* Desktop Auth Badge & Reset Button */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">
                {user ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <User className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-medium max-w-[120px] truncate text-slate-700 dark:text-slate-200">
                        {user.email}
                      </span>
                    </div>
                    <button
                      onClick={signOut}
                      type="button"
                      className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title={t('header.signOut', 'Sign Out')}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAuthModalMode('signup');
                        setIsAuthModalOpen(true);
                      }}
                      type="button"
                      className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Зарегистрироваться</span>
                    </button>
                    <button
                      onClick={() => {
                        setAuthModalMode('login');
                        setIsAuthModalOpen(true);
                      }}
                      type="button"
                      className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-250 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Войти</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Reset button */}
              <button
                onClick={clearAll}
                type="button"
                className="p-1.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('header.resetProject', 'Reset Project')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main className="flex-1 flex flex-col lg:flex-row gap-6 pb-8 relative min-w-0 items-start">
          
          {/* Collapsible Config Sidebar */}
          <aside className={`flex-shrink-0 transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs ${
            isSidebarOpen ? 'w-full lg:w-[320px] p-6 opacity-100' : 'w-0 p-0 opacity-0 border-0'
          }`}>
            {isSidebarOpen && <ConfigPanel />}
          </aside>

          {/* Toggle Sidebar Action Button (Desktop only, floating on border) */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            type="button"
            className="absolute top-6 z-35 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-md hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 cursor-pointer hidden lg:flex items-center justify-center transition-all duration-300 -translate-x-1/2"
            style={{ left: isSidebarOpen ? '320px' : '0px' }}
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* Main workspace editor */}
          <div className="flex-1 space-y-6 min-w-0 w-full relative">

            {/* Section 1: Dropzones File Upload */}
            <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                1. Загрузка исходных файлов обложек и страниц (Zero-Upload)
              </h2>
              <FileUploader />
            </section>

            {/* Section 2: Interactive WYSIWYG Editor spread */}
            <section>
              <BookPreview />
            </section>

            {/* Section 3: PDF Assembler status checklist & Generate button */}
            <section className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-bold text-slate-855 dark:text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" /> {t('engine.title', '3. Сборка готового макета')}
                </h2>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {isDemoMode ? (
                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-full text-xs font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Режим: Демо (Демонстрационный)
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-full text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Режим: Pro (Активирован)
                    </span>
                  )}
                </div>
              </div>

              {/* checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${isCoverReady ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'}`}>
                  <div className="flex items-center gap-2.5 font-bold text-xs mb-1">
                    {isCoverReady ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-slate-400" />}
                    <span>Файлы обложки</span>
                  </div>
                  <p className="text-[11px] opacity-80">
                    {isCoverReady ? 'Передняя и задняя обложки загружены и скомпонованы.' : 'Требуется загрузить обложки.'}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${isInteriorReady ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300' : 'bg-amber-50/50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-300'}`}>
                  <div className="flex items-center gap-2.5 font-bold text-xs mb-1">
                    {isInteriorReady ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                    <span>Количество страниц ({pageCount})</span>
                  </div>
                  <p className="text-[11px] opacity-80">
                    {isInteriorReady 
                      ? 'Страниц достаточно для верстки печатных изданий KDP (>= 24 страниц).' 
                      : `Необходимо еще страниц: ${24 - pageCount}`}
                  </p>
                </div>
              </div>

              {/* Error messages */}
              {errorMsg && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Generate PDF Trigger button */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleGeneratePDFs}
                  disabled={!canGenerate || isGenerating}
                  type="button"
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer ${
                    canGenerate && !isGenerating
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 scale-[1.01]'
                      : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{generationStep || 'Сборка...'} ({generationProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Собрать и экспортировать книгу (PDF)</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400">
                  Верстка выполняется на вашем устройстве, исходники не загружаются на сервер.
                </p>
              </div>

              {/* Download links */}
              {downloadUrls && (
                <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>Книга собрана и готова к публикации!</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <a
                      href={downloadUrls.cover}
                      download={downloadUrls.coverFilename}
                      className="p-4 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400 rounded-xl flex items-center justify-between shadow-xs transition-all hover:scale-[1.02]"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate font-sans">
                          Скачать файл обложки (Cover Spread)
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate font-mono">
                          {downloadUrls.coverFilename}
                        </span>
                      </div>
                      <div className="p-2 bg-emerald-500 text-white rounded-lg">
                        <Download className="w-4 h-4" />
                      </div>
                    </a>

                    <a
                      href={downloadUrls.interior}
                      download={downloadUrls.interiorFilename}
                      className="p-4 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400 rounded-xl flex items-center justify-between shadow-xs transition-all hover:scale-[1.02]"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate font-sans">
                          Скачать файл страниц (Interior PDF)
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate font-mono">
                          {downloadUrls.interiorFilename}
                        </span>
                      </div>
                      <div className="p-2 bg-emerald-500 text-white rounded-lg">
                        <Download className="w-4 h-4" />
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>© 2026 Birdy Pages — Smart Book Assembler for KDP. Operated by emITera. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a 
              href="/terms" 
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/terms');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Terms of Service
            </a>
            <a 
              href="/refund" 
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/refund');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Refund Policy
            </a>
            <a 
              href="/privacy" 
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/privacy');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
            <a 
              href="/support" 
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/support');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Support &amp; Help
            </a>
            {user && userProfile?.role === 'admin' && (
              <a 
                href="/admin" 
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/admin');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                Admin Panel
              </a>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
