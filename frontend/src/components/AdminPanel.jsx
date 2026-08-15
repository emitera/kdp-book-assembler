import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Search, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Gift, 
  RefreshCw,
  DollarSign,
  Save,
  UserPlus,
  Trash2,
  X,
  Mail,
  Lock,
  CreditCard,
  Sliders,
  Key,
  Globe
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AdminPanel() {
  const { 
    user, 
    userProfile, 
    isAuthLoading, 
    setOneTimePassPriceUsd, 
    setMonthlyProPriceUsd, 
    setYearlySubscriptionPriceUsd,
    setPaymentSettings 
  } = useApp();

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  // Dynamic Pricing Admin State
  const [oneTimePrice, setOneTimePrice] = useState('9.99');
  const [subPrice, setSubPrice] = useState('19.99');
  const [yearlyPrice, setYearlyPrice] = useState('99.99');
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceSuccess, setPriceSuccess] = useState(false);

  // Payment Gateways Configuration State
  const [activeGateway, setActiveGateway] = useState('allpay'); // 'allpay' | 'paddle'
  const [paddleEnv, setPaddleEnv] = useState('sandbox'); // 'sandbox' | 'production'
  const [paddleClientToken, setPaddleClientToken] = useState('');
  const [paddleApiKey, setPaddleApiKey] = useState('');
  const [paddlePriceOnetime, setPaddlePriceOnetime] = useState('');
  const [paddlePriceMonthly, setPaddlePriceMonthly] = useState('');
  const [paddlePriceYearly, setPaddlePriceYearly] = useState('');
  const [allpayStoreId, setAllpayStoreId] = useState('');
  const [allpaySecretKey, setAllpaySecretKey] = useState('');
  const [allpayProductOnetime, setAllpayProductOnetime] = useState('');
  const [allpayProductMonthly, setAllpayProductMonthly] = useState('');
  const [allpayProductYearly, setAllpayProductYearly] = useState('');
  const [savingPaymentSettings, setSavingPaymentSettings] = useState(false);
  const [paymentSettingsSuccess, setPaymentSettingsSuccess] = useState(false);

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newSubStatus, setNewSubStatus] = useState('free');
  const [newIsLifetime, setNewIsLifetime] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState('');

  const isAdmin = user && userProfile?.role === 'admin';

  const fetchUsersAndSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, settingsRes, paymentRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`),
        fetch(`${API_URL}/api/settings`),
        fetch(`${API_URL}/api/admin/payment-settings`)
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsersList(data.users || []);
      }

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setOneTimePrice(String(sData.one_time_pass_price_usd ?? '9.99'));
        setSubPrice(String(sData.subscription_price_usd ?? '19.99'));
        setYearlyPrice(String(sData.yearly_subscription_price_usd ?? '99.99'));
      }

      if (paymentRes.ok) {
        const pData = await paymentRes.json();
        if (pData) {
          setActiveGateway(pData.active_gateway || 'allpay');
          setPaddleEnv(pData.paddle_environment || 'sandbox');
          setPaddleClientToken(pData.paddle_client_token || '');
          setPaddleApiKey(pData.paddle_api_key || '');
          setPaddlePriceOnetime(pData.paddle_price_onetime || '');
          setPaddlePriceMonthly(pData.paddle_price_monthly || '');
          setPaddlePriceYearly(pData.paddle_price_yearly || '');
          setAllpayStoreId(pData.allpay_store_id || '');
          setAllpaySecretKey(pData.allpay_secret_key || '');
          setAllpayProductOnetime(pData.allpay_product_onetime || '');
          setAllpayProductMonthly(pData.allpay_product_monthly || '');
          setAllpayProductYearly(pData.allpay_product_yearly || '');
          if (setPaymentSettings) setPaymentSettings(pData);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load admin directory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsersAndSettings();
    }
  }, [isAdmin]);

  const handleSavePricing = async (e) => {
    e.preventDefault();
    setSavingPrice(true);
    setPriceSuccess(false);

    try {
      const response = await fetch(`${API_URL}/api/admin/update-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oneTimePassPriceUsd: parseFloat(oneTimePrice),
          subscriptionPriceUsd: parseFloat(subPrice),
          yearlySubscriptionPriceUsd: parseFloat(yearlyPrice)
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        const errMsg = data.error || data.message || `Server status ${response.status}`;
        console.error('Server error updating pricing:', errMsg, data);
        throw new Error(errMsg);
      }

      setOneTimePassPriceUsd(parseFloat(oneTimePrice));
      setMonthlyProPriceUsd(parseFloat(subPrice));
      setYearlySubscriptionPriceUsd(parseFloat(yearlyPrice));
      setPriceSuccess(true);
      setTimeout(() => setPriceSuccess(false), 3000);
    } catch (err) {
      console.error('Pricing update error details:', err);
      alert(`Error updating prices: ${err.message}`);
    } finally {
      setSavingPrice(false);
    }
  };

  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    setSavingPaymentSettings(true);
    setPaymentSettingsSuccess(false);

    try {
      const payload = {
        active_gateway: activeGateway,
        paddle_environment: paddleEnv,
        paddle_client_token: paddleClientToken,
        paddle_api_key: paddleApiKey,
        paddle_price_onetime: paddlePriceOnetime,
        paddle_price_monthly: paddlePriceMonthly,
        paddle_price_yearly: paddlePriceYearly,
        allpay_store_id: allpayStoreId,
        allpay_secret_key: allpaySecretKey,
        allpay_product_onetime: allpayProductOnetime,
        allpay_product_monthly: allpayProductMonthly,
        allpay_product_yearly: allpayProductYearly
      };

      const response = await fetch(`${API_URL}/api/admin/update-payment-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        const errMsg = data.error || data.message || `Server status ${response.status}`;
        console.error('Server error updating payment settings:', errMsg, data);
        throw new Error(errMsg);
      }

      if (setPaymentSettings) setPaymentSettings(data.settings || payload);
      setPaymentSettingsSuccess(true);
      setTimeout(() => setPaymentSettingsSuccess(false), 3000);
    } catch (err) {
      console.error('Payment settings update error details:', err);
      alert(`Error updating payment settings: ${err.message}`);
    } finally {
      setSavingPaymentSettings(false);
    }
  };

  const handleToggleLifetime = async (targetUserId, currentStatus) => {
    setTogglingId(targetUserId);
    const newStatus = !currentStatus;

    try {
      const response = await fetch(`${API_URL}/api/admin/toggle-lifetime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          isLifetimeFree: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      const data = await response.json();
      if (data.success) {
        setUsersList(prev =>
          prev.map(u => u.id === targetUserId ? { ...u, is_lifetime_free: newStatus } : u)
        );
      }
    } catch (err) {
      console.error('Toggle lifetime error:', err);
      alert(`Error updating user: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleRoleChange = async (targetUserId, newRoleValue) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/update-user-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, role: newRoleValue })
      });

      if (response.ok) {
        setUsersList(prev =>
          prev.map(u => u.id === targetUserId ? { ...u, role: newRoleValue } : u)
        );
      }
    } catch (err) {
      console.error('Role update error:', err);
      alert('Failed to update user role');
    }
  };

  const handleSubscriptionChange = async (targetUserId, newSubValue) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/update-user-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, subscriptionStatus: newSubValue })
      });

      if (response.ok) {
        setUsersList(prev =>
          prev.map(u => u.id === targetUserId ? { ...u, subscription_status: newSubValue } : u)
        );
      }
    } catch (err) {
      console.error('Subscription update error:', err);
      alert('Failed to update subscription');
    }
  };

  const handleDeleteUser = async (targetUserId, targetEmail) => {
    if (!window.confirm(`Are you sure you want to delete user "${targetEmail}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      });

      if (response.ok) {
        setUsersList(prev => prev.filter(u => u.id !== targetUserId));
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Failed to delete user');
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setCreateUserError('');
    setCreatingUser(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
          subscriptionStatus: newSubStatus,
          isLifetimeFree: newIsLifetime
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create user');
      }

      if (data.profile) {
        setUsersList(prev => [data.profile, ...prev]);
        setIsAddUserModalOpen(false);
        setNewEmail('');
        setNewPassword('');
        setNewRole('user');
        setNewSubStatus('free');
        setNewIsLifetime(false);
      }
    } catch (err) {
      console.error('Create user error:', err);
      setCreateUserError(err.message || 'Error creating user');
    } finally {
      setCreatingUser(false);
    }
  };

  const filteredUsers = usersList.filter(u =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isAuthLoading || (user && !userProfile)) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-sm font-semibold text-slate-300">Проверка прав администратора...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="inline-flex p-4 bg-red-500/10 text-red-400 rounded-full mb-2">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-sm text-slate-400">
            You do not have Administrator permissions to access this page. Please sign in with an Admin account.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-fade-in space-y-5">
            <button
              onClick={() => setIsAddUserModalOpen(false)}
              type="button"
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-1">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New User</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a new user account with initial role and subscription permissions.
              </p>
            </div>

            {createUserError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs">
                {createUserError}
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="newuser@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subscription</label>
                  <select
                    value={newSubStatus}
                    onChange={(e) => setNewSubStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="lifetimeFreeCheck"
                  checked={newIsLifetime}
                  onChange={(e) => setNewIsLifetime(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="lifetimeFreeCheck" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                  Grant Lifetime Free Access (Bypass Paywall)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2"
                >
                  {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save / Сохранить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-xs">
        <div className="max-w-[1720px] w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-extrabold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> ADMIN PANEL
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsersAndSettings}
              type="button"
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Main App</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Dynamic Pricing Configuration Card */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-500" /> Dynamic Pricing Configuration (USD)
            </h2>
            {priceSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Prices Updated!
              </span>
            )}
          </div>

          <form onSubmit={handleSavePricing} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                One-Time Project Pass ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={oneTimePrice}
                onChange={(e) => setOneTimePrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Monthly Pro ($ USD/mo)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={subPrice}
                onChange={(e) => setSubPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Yearly Pro ($ USD/yr)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={yearlyPrice}
                onChange={(e) => setYearlyPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingPrice}
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer h-[42px]"
            >
              {savingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save New Prices</span>
            </button>
          </form>
        </section>

        {/* Payment Gateways Configuration Card */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-500" /> Payment Gateways Configuration / Настройки платежных шлюзов
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Switch active gateway and configure API keys / Product IDs dynamically without restarting the server.
              </p>
            </div>
            {paymentSettingsSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4" /> Gateway Settings Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSavePaymentSettings} className="space-y-6">
            {/* 1. Active Gateway Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Payment Gateway / Активная платежная система
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Allpay Card Option */}
                <div
                  onClick={() => setActiveGateway('allpay')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    activeGateway === 'allpay'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${activeGateway === 'allpay' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Allpay Gateway
                        {activeGateway === 'allpay' && (
                          <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Direct Card Payments / 3D Secure Verification</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="activeGatewayRadio"
                    value="allpay"
                    checked={activeGateway === 'allpay'}
                    onChange={() => setActiveGateway('allpay')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {/* Paddle Card Option */}
                <div
                  onClick={() => setActiveGateway('paddle')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    activeGateway === 'paddle'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${activeGateway === 'paddle' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Paddle Billing
                        {activeGateway === 'paddle' && (
                          <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Global Merchant of Record (MoR) / Tax Compliance</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="activeGatewayRadio"
                    value="paddle"
                    checked={activeGateway === 'paddle'}
                    onChange={() => setActiveGateway('paddle')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Gateway Settings Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Allpay Configuration Block */}
              <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
                activeGateway === 'allpay'
                  ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 opacity-80 hover:opacity-100'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-500" /> Allpay Settings
                  </h3>
                  {activeGateway === 'allpay' && (
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">
                      ● Active Gateway
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Allpay Store ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 2000132"
                      value={allpayStoreId}
                      onChange={(e) => setAllpayStoreId(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Allpay Secret Key</label>
                    <input
                      type="password"
                      placeholder="Secret Key / HashKey"
                      value={allpaySecretKey}
                      onChange={(e) => setAllpaySecretKey(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">One-Time Pass Product ID</label>
                    <input
                      type="text"
                      placeholder="e.g. PROD_ONETIME_PASS"
                      value={allpayProductOnetime}
                      onChange={(e) => setAllpayProductOnetime(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Monthly Pro Product ID</label>
                    <input
                      type="text"
                      placeholder="e.g. PROD_MONTHLY_SUB"
                      value={allpayProductMonthly}
                      onChange={(e) => setAllpayProductMonthly(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Yearly Pro Product ID</label>
                    <input
                      type="text"
                      placeholder="e.g. PROD_YEARLY_SUB"
                      value={allpayProductYearly}
                      onChange={(e) => setAllpayProductYearly(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Paddle Configuration Block */}
              <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
                activeGateway === 'paddle'
                  ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 opacity-80 hover:opacity-100'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-500" /> Paddle Settings
                  </h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={paddleEnv}
                      onChange={(e) => setPaddleEnv(e.target.value)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <option value="sandbox">Sandbox / Test</option>
                      <option value="production">Production / Live</option>
                    </select>
                    {activeGateway === 'paddle' && (
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">
                        ● Active Gateway
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Paddle Client Token</label>
                    <input
                      type="text"
                      placeholder="test_... or live_..."
                      value={paddleClientToken}
                      onChange={(e) => setPaddleClientToken(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Paddle API Key</label>
                    <input
                      type="password"
                      placeholder="paddlev2_..."
                      value={paddleApiKey}
                      onChange={(e) => setPaddleApiKey(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">One-Time Pass Price ID</label>
                    <input
                      type="text"
                      placeholder="pri_01h..."
                      value={paddlePriceOnetime}
                      onChange={(e) => setPaddlePriceOnetime(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Monthly Pro Price ID</label>
                    <input
                      type="text"
                      placeholder="pri_01h..."
                      value={paddlePriceMonthly}
                      onChange={(e) => setPaddlePriceMonthly(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Yearly Pro Price ID</label>
                    <input
                      type="text"
                      placeholder="pri_01h..."
                      value={paddlePriceYearly}
                      onChange={(e) => setPaddlePriceYearly(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPaymentSettings}
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer h-[42px]"
              >
                {savingPaymentSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Payment Settings / Сохранить настройки платежей</span>
              </button>
            </div>
          </form>
        </section>

        {/* User Directory Management Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-500" /> User Access Directory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage roles, subscription levels, lifetime passes, or add new users directly.
              </p>
            </div>

            {/* Header Controls: Search + Add User */}
            <div className="flex items-center gap-3">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                type="button"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-all flex-shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add User / Добавить пользователя</span>
              </button>
            </div>
          </div>

          {/* Users Table Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-sm font-medium">Loading directory...</span>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500 space-y-2">
                <p className="font-semibold text-sm">{error}</p>
                <button
                  onClick={fetchUsersAndSettings}
                  className="px-4 py-2 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-xl text-xs font-bold"
                >
                  Retry
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                No users found matching query &quot;{searchQuery}&quot;.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-6">User Email</th>
                      <th className="py-3.5 px-6">Role</th>
                      <th className="py-3.5 px-6">Subscription</th>
                      <th className="py-3.5 px-6">Lifetime Free</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                        
                        {/* Email */}
                        <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                          {u.email}
                        </td>

                        {/* Interactive Role Selector Dropdown */}
                        <td className="py-4 px-6">
                          <select
                            value={u.role || 'user'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer focus:outline-none text-slate-700 dark:text-slate-200"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>

                        {/* Interactive Subscription Status Dropdown */}
                        <td className="py-4 px-6">
                          <select
                            value={u.subscription_status || 'free'}
                            onChange={(e) => handleSubscriptionChange(u.id, e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer focus:outline-none text-slate-700 dark:text-slate-200"
                          >
                            <option value="free">free</option>
                            <option value="pro">pro</option>
                          </select>
                        </td>

                        {/* Lifetime Free Toggle Button */}
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleToggleLifetime(u.id, u.is_lifetime_free)}
                            disabled={togglingId === u.id}
                            type="button"
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                              u.is_lifetime_free
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {togglingId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : u.is_lifetime_free ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 opacity-50" />
                            )}
                            <span>{u.is_lifetime_free ? 'Lifetime Active' : 'Off'}</span>
                          </button>
                        </td>

                        {/* Actions (Delete Trash Icon) */}
                        <td className="py-4 px-6 text-right">
                          {u.id !== user?.id ? (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              type="button"
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">Current Owner</span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
