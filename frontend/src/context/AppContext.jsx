import React, { createContext, useState, useContext, useEffect } from 'react';
import { TRIM_SIZES, PAPER_TYPES } from '../utils/kdpMath';
import { extractLeftmostPixelColor } from '../utils/canvasHelper';
import { supabase } from '../services/supabaseClient';
import i18n from '../i18n/i18n';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// API Endpoint configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AppProvider = ({ children }) => {
  // Supabase User Auth State
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // i18n Language & Multi-Currency State
  const [language, setLanguage] = useState(() => i18n.language || 'en');
  const [currency, setCurrency] = useState(() => localStorage.getItem('birdy_currency') || 'USD'); // 'USD' | 'EUR' | 'NIS'

  // Dynamic Base Prices (in USD)
  const [oneTimePassPriceUsd, setOneTimePassPriceUsd] = useState(9.99);
  const [monthlyProPriceUsd, setMonthlyProPriceUsd] = useState(19.99);
  const [yearlySubscriptionPriceUsd, setYearlySubscriptionPriceUsd] = useState(99.99);

  // Fetch pricing dynamically on mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch(`${API_URL}/api/settings`);
        if (response.ok) {
          const data = await response.json();
          if (data.one_time_pass_price_usd) setOneTimePassPriceUsd(data.one_time_pass_price_usd);
          if (data.subscription_price_usd) setMonthlyProPriceUsd(data.subscription_price_usd);
          if (data.yearly_subscription_price_usd) setYearlySubscriptionPriceUsd(data.yearly_subscription_price_usd);
        }
      } catch (err) {
        console.error('Failed to fetch pricing:', err);
      }
    };
    fetchPricing();
  }, []);

  // Exchange Rates (1 USD base)
  const EXCHANGE_RATES = {
    USD: { rate: 1.0, symbol: '$', prefix: true },
    EUR: { rate: 0.92, symbol: '€', prefix: true },
    NIS: { rate: 3.65, symbol: '₪', prefix: true }
  };

  // Price conversion and formatting helper
  const formatPrice = (usdAmount) => {
    const config = EXCHANGE_RATES[currency] || EXCHANGE_RATES.USD;
    const converted = (usdAmount * config.rate).toFixed(2);
    return config.prefix ? `${config.symbol}${converted}` : `${converted} ${config.symbol}`;
  };

  const changeCurrency = (curr) => {
    setCurrency(curr);
    localStorage.setItem('birdy_currency', curr);
  };

  // Unique Project Session ID (persists across page reloads via sessionStorage)
  const [projectId] = useState(() => {
    let id = sessionStorage.getItem('kdp_project_id');
    if (!id) {
      id = `proj_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      sessionStorage.setItem('kdp_project_id', id);
    }
    return id;
  });

  // KDP Project Settings State
  const [bindingType, setBindingType] = useState('paperback'); // 'paperback' | 'hardcover'
  const [coverType, setCoverType] = useState('parts'); // 'parts' | 'full'
  const [trimSizeId, setTrimSizeId] = useState(TRIM_SIZES[0].id);
  const [customWidth, setCustomWidth] = useState(6.0);
  const [customHeight, setCustomHeight] = useState(9.0);
  const [paperTypeId, setPaperTypeId] = useState(PAPER_TYPES[0].id);
  const [hasBleed, setHasBleed] = useState(true);
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  const [isSingleSided, setIsSingleSided] = useState(false);
  const [addBlankAtStart, setAddBlankAtStart] = useState(false);
  const [unit, setUnit] = useState('in'); // 'in' | 'px'
  
  // File Upload State
  const [frontCover, setFrontCover] = useState(null); // File & preview URL
  const [backCover, setBackCover] = useState(null);   // File & preview URL
  const [fullCover, setFullCover] = useState(null);   // File & preview URL
  const [interiorPages, setInteriorPages] = useState([]); // Array of { id, file, preview }
  
  // Custom Spine Configurations
  const [spineColor, setSpineColor] = useState('#FFFFFF');
  const [spineText, setSpineText] = useState('');
  const [spineTextColor, setSpineTextColor] = useState('#000000');
  const [spineTextDirection, setSpineTextDirection] = useState('top-to-bottom'); // 'top-to-bottom' | 'bottom-to-top'
  const [spineImage, setSpineImage] = useState(null); // File & preview URL

  // Anti-piracy / Billing State
  const [proToken, setProToken] = useState(() => localStorage.getItem('kdp_pro_token') || null);
  const [oneTimeProjectPass, setOneTimeProjectPass] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState('idle'); // 'idle' | 'pending' | 'error'

  // Enforce hardcover trim size allowed values
  useEffect(() => {
    if (bindingType === 'hardcover') {
      const allowedHardcoverSizes = ['5.5x8.5', '6x9', '6.14x9.21', '7x10', '8.25x11'];
      if (!allowedHardcoverSizes.includes(trimSizeId)) {
        setTrimSizeId('6x9');
      }
    }
  }, [bindingType, trimSizeId]);

  // Retrieve current active config objects
  const baseTrimSize = TRIM_SIZES.find(t => t.id === trimSizeId) || TRIM_SIZES[0];
  const isLandscape = orientation === 'landscape';
  const activeTrimSize = trimSizeId === 'custom' ? {
    id: 'custom',
    name: `Custom (${customWidth}" x ${customHeight}")`,
    width: isLandscape ? customHeight : customWidth,
    height: isLandscape ? customWidth : customHeight
  } : {
    ...baseTrimSize,
    width: isLandscape ? baseTrimSize.height : baseTrimSize.width,
    height: isLandscape ? baseTrimSize.width : baseTrimSize.height,
    name: isLandscape 
      ? `${baseTrimSize.height}" x ${baseTrimSize.width}"` 
      : baseTrimSize.name
  };
  const activePaperType = PAPER_TYPES.find(p => p.id === paperTypeId) || PAPER_TYPES[0];

  // Derive if we are running in Demo Mode (lifetime free or active sub bypasses paywall)
  const isDemoMode = !proToken && !oneTimeProjectPass && !(userProfile?.is_lifetime_free === true || userProfile?.subscription_status === 'pro');

  // Fetch profile details from Supabase
  const fetchUserProfile = async (currentUser) => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      if (profile) {
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Listen to Supabase Auth State Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      fetchUserProfile(currentUser);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      fetchUserProfile(currentUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync i18n Language Changes
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLanguage(lng);
  };

  // Persist JWT token to LocalStorage
  useEffect(() => {
    if (proToken) {
      localStorage.setItem('kdp_pro_token', proToken);
    } else {
      localStorage.removeItem('kdp_pro_token');
    }
  }, [proToken]);

  // Handle URL redirect query parameters after successful payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const returnedProjectId = urlParams.get('projectId');

    if (paymentStatus === 'success' && returnedProjectId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      
      const fetchProjectToken = async () => {
        setCheckoutStatus('pending');
        try {
          const response = await fetch(`${API_URL}/api/get-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: returnedProjectId })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.token) {
              setProToken(data.token);
              setOneTimeProjectPass(true);
              setCheckoutStatus('idle');
            } else {
              setCheckoutStatus('error');
            }
          } else {
            setCheckoutStatus('error');
          }
        } catch (err) {
          console.error('Failed to retrieve project pass token:', err);
          setCheckoutStatus('error');
        }
      };
      
      fetchProjectToken();
    }
  }, []);

  // Clean up Blob URLs when files are removed or updated
  const revokeFilePreview = (fileState) => {
    if (fileState?.preview) {
      URL.revokeObjectURL(fileState.preview);
    }
  };

  const handleSetFrontCover = async (file) => {
    if (!file) {
      revokeFilePreview(frontCover);
      setFrontCover(null);
      return;
    }
    
    const previewUrl = URL.createObjectURL(file);
    const newCover = { 
      file, 
      preview: previewUrl,
      xOffset: 0,
      yOffset: 0,
      xScale: 1.0,
      yScale: 1.0
    };
    
    revokeFilePreview(frontCover);
    setFrontCover(newCover);

    try {
      const extractedColor = await extractLeftmostPixelColor(file);
      setSpineColor(extractedColor);
    } catch (err) {
      console.error('Spine color extraction failed:', err);
      setSpineColor('#FFFFFF'); // Fallback
    }
  };

  const handleSetBackCover = (file) => {
    if (!file) {
      revokeFilePreview(backCover);
      setBackCover(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    revokeFilePreview(backCover);
    setBackCover({ 
      file, 
      preview: previewUrl,
      xOffset: 0,
      yOffset: 0,
      xScale: 1.0,
      yScale: 1.0
    });
  };

  const handleSetSpineImage = (file) => {
    if (!file) {
      revokeFilePreview(spineImage);
      setSpineImage(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    revokeFilePreview(spineImage);
    setSpineImage({ 
      file, 
      preview: previewUrl,
      xOffset: 0,
      yOffset: 0,
      xScale: 1.0,
      yScale: 1.0
    });
  };

  const handleSetInteriorPages = (fileList) => {
    interiorPages.forEach(p => revokeFilePreview(p));
    
    if (!fileList || fileList.length === 0) {
      setInteriorPages([]);
      return;
    }

    const pages = Array.from(fileList).map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      file,
      preview: URL.createObjectURL(file),
      xOffset: 0,
      yOffset: 0,
      xScale: 1.0,
      yScale: 1.0
    }));

    setInteriorPages(pages);
  };

  const updateFrontCoverTransform = (updates) => {
    setFrontCover(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateBackCoverTransform = (updates) => {
    setBackCover(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateFullCoverTransform = (updates) => {
    setFullCover(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleSetFullCover = (file) => {
    if (!file) {
      revokeFilePreview(fullCover);
      setFullCover(null);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    revokeFilePreview(fullCover);
    setFullCover({
      file,
      preview: previewUrl,
      xOffset: 0,
      yOffset: 0,
      xScale: 1.0,
      yScale: 1.0
    });
  };

  const updateSpineImageTransform = (updates) => {
    setSpineImage(prev => prev ? { ...prev, ...updates } : null);
  };

  const updatePageTransform = (pageId, updates) => {
    setInteriorPages(prev => prev.map(p => p.id === pageId ? { ...p, ...updates } : p));
  };

  const handleClearAll = () => {
    revokeFilePreview(frontCover);
    revokeFilePreview(backCover);
    revokeFilePreview(fullCover);
    revokeFilePreview(spineImage);
    interiorPages.forEach(p => revokeFilePreview(p));

    setFrontCover(null);
    setBackCover(null);
    setFullCover(null);
    setSpineImage(null);
    setInteriorPages([]);
    setSpineText('');
    setSpineColor('#FFFFFF');
    setSpineTextColor('#000000');
    setSpineTextDirection('top-to-bottom');
    setOneTimeProjectPass(false);
    setBindingType('paperback');
    setCoverType('parts');
  };

  const handlePurchaseProjectPass = async (email, provider = 'paypal', planType = 'one_time', amount = 9.99) => {
    try {
      setCheckoutStatus('pending');
      let normalizedType = 'project_pass';
      if (planType === 'subscription') {
        normalizedType = 'subscription_monthly';
      } else if (planType === 'yearly') {
        normalizedType = 'subscription_yearly';
      }

      const response = await fetch(`${API_URL}/api/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          projectId,
          userId: user?.id || null,
          type: normalizedType,
          provider,
          amount: parseFloat(amount)
        })
      });

      if (!response.ok) {
        throw new Error('Checkout API call failed');
      }

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned from API');
      }
    } catch (err) {
      console.error('Purchase initiation failed:', err);
      setCheckoutStatus('error');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    // Auth State
    user,
    setUser,
    userProfile,
    fetchUserProfile,
    isAuthModalOpen,
    setIsAuthModalOpen,
    signOut: handleSignOut,

    // i18n & Currency
    language,
    changeLanguage,
    currency,
    changeCurrency,
    formatPrice,
    oneTimePassPriceUsd,
    setOneTimePassPriceUsd,
    monthlyProPriceUsd,
    setMonthlyProPriceUsd,
    yearlySubscriptionPriceUsd,
    setYearlySubscriptionPriceUsd,

    // State
    projectId,
    bindingType,
    setBindingType,
    coverType,
    setCoverType,
    trimSizeId,
    setTrimSizeId,
    customWidth,
    setCustomWidth,
    customHeight,
    setCustomHeight,
    paperTypeId,
    setPaperTypeId,
    hasBleed,
    setHasBleed,
    orientation,
    setOrientation,
    isSingleSided,
    setIsSingleSided,
    addBlankAtStart,
    setAddBlankAtStart,
    unit,
    setUnit,
    frontCover,
    backCover,
    fullCover,
    spineImage,
    interiorPages,
    spineColor,
    setSpineColor,
    spineText,
    setSpineText,
    spineTextColor,
    setSpineTextColor,
    spineTextDirection,
    setSpineTextDirection,
    proToken,
    setProToken,
    oneTimeProjectPass,
    setOneTimeProjectPass,
    checkoutStatus,
    
    // Derived
    activeTrimSize,
    activePaperType,
    isDemoMode,
    
    // Actions
    setFrontCover: handleSetFrontCover,
    setBackCover: handleSetBackCover,
    setFullCover: handleSetFullCover,
    setSpineImage: handleSetSpineImage,
    setInteriorPages: handleSetInteriorPages,
    updateFrontCoverTransform,
    updateBackCoverTransform,
    updateFullCoverTransform,
    updateSpineImageTransform,
    updatePageTransform,
    clearAll: handleClearAll,
    purchaseProjectPass: handlePurchaseProjectPass
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
