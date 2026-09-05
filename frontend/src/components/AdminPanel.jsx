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
  Globe,
  MessageSquare,
  Plus,
  Minus,
  AlertTriangle,
  Clock,
  Check,
  Ban,
  Sparkles
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

  // Active Admin Tab: 'users' | 'pricing' | 'tickets'
  const [activeTab, setActiveTab] = useState('users');

  // Users Directory State
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

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

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newSubStatus, setNewSubStatus] = useState('free');
  const [newCredits, setNewCredits] = useState(0);
  const [newIsLifetime, setNewIsLifetime] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState('');

  const isAdmin = user && userProfile?.role === 'admin';

  const fetchUsersAndSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, settingsRes, paymentRes, ticketsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`),
        fetch(`${API_URL}/api/settings`),
        fetch(`${API_URL}/api/admin/payment-settings`),
        fetch(`${API_URL}/api/admin/support-tickets`).catch(() => ({ ok: false }))
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

      if (ticketsRes && ticketsRes.ok) {
        const tData = await ticketsRes.json();
        setSupportTickets(tData.tickets || []);
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

  // Handle Credits Delta Update (+1, +5, -1)
  const handleUpdateCredits = async (targetUserId, delta, directValue = null) => {
    setUpdatingUserId(targetUserId);
    try {
      const payload = directValue !== null 
        ? { userId: targetUserId, credits: directValue }
        : { userId: targetUserId, delta };

      const response = await fetch(`${API_URL}/api/admin/update-user-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUsersList(prev =>
          prev.map(u => u.id === targetUserId 
            ? { ...u, generation_credits: data.profile?.generation_credits ?? (directValue !== null ? directValue : Math.max(0, (u.generation_credits || 0) + delta)) } 
            : u
          )
        );
      } else {
        throw new Error(data.error || 'Failed to update credits');
      }
    } catch (err) {
      console.error('Update credits error:', err);
      alert(`Error updating credits: ${err.message}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle Manual Plan Switching (free, onetime, monthly, yearly, canceled)
  const handlePlanChange = async (targetUserId, newPlan) => {
    setUpdatingUserId(targetUserId);
    try {
      const response = await fetch(`${API_URL}/api/admin/update-user-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, plan: newPlan })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUsersList(prev =>
          prev.map(u => u.id === targetUserId ? { ...u, subscription_status: newPlan } : u)
        );
      } else {
        throw new Error(data.error || 'Failed to update plan');
      }
    } catch (err) {
      console.error('Plan update error:', err);
      alert(`Error updating plan: ${err.message}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle Cancel Subscription
  const handleCancelSubscription = async (targetUserId, targetEmail) => {
    if (!window.confirm(`Вы уверены, что хотите отменить подписку для пользователя "${targetEmail}"? Платный доступ будет прекращен.`)) {
      return;
    }

    setUpdatingUserId(targetUserId);
    try {
      const response = await fetch(`${API_URL}/api/admin/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUsersList(prev =>
          prev.map(u => u.id === targetUserId ? { ...u, subscription_status: 'canceled' } : u)
        );
        alert(`Подписка для ${targetEmail} успешно отменена.`);
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Cancel subscription error:', err);
      alert(`Ошибка отмены подписки: ${err.message}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle Support Ticket Status Update
  const handleTicketStatusChange = async (ticketId, nextStatus) => {
    setUpdatingTicketId(ticketId);
    try {
      const response = await fetch(`${API_URL}/api/admin/update-ticket-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: nextStatus })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSupportTickets(prev =>
          prev.map(t => t.id === ticketId ? { ...t, status: nextStatus } : t)
        );
      }
    } catch (err) {
      console.error('Ticket status update error:', err);
      alert('Failed to update ticket status');
    } finally {
      setUpdatingTicketId(null);
    }
  };

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
    setUpdatingUserId(targetUserId);
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

      if (!response.ok) throw new Error('Failed to update user status');

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
      setUpdatingUserId(null);
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
        // If initial credits were specified, update credits
        if (newCredits > 0) {
          await handleUpdateCredits(data.profile.id, 0, newCredits);
          data.profile.generation_credits = newCredits;
        }
        setUsersList(prev => [data.profile, ...prev]);
        setIsAddUserModalOpen(false);
        setNewEmail('');
        setNewPassword('');
        setNewRole('user');
        setNewSubStatus('free');
        setNewCredits(0);
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
          <h2 className="text-2xl font-bold">Access Denied / Доступ запрещен</h2>
          <p className="text-sm text-slate-400">
            У вас нет прав администратора для доступа к этой странице. Пожалуйста, войдите под учетной записью администратора.
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
                Create a new user account with initial role, plan, and credits.
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Plan</label>
                  <select
                    value={newSubStatus}
                    onChange={(e) => setNewSubStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="free">Free (Бесплатный)</option>
                    <option value="onetime">One-Time Pass (Разовый)</option>
                    <option value="monthly">Monthly Pro (Месячный)</option>
                    <option value="yearly">Yearly Pro (Годовой)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Initial Free Generations / Кредиты генераций
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCredits}
                  onChange={(e) => setNewCredits(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
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
                  Grant Lifetime Free Access (Бессрочный доступ)
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
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
        <div className="max-w-[1720px] w-full mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-extrabold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> ADMIN PANEL & CRM
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsersAndSettings}
              type="button"
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

      {/* Admin Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2">
        <div className="max-w-[1720px] w-full mx-auto flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            type="button"
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Пользователи / Users CRM ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            type="button"
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Платежи и Цены / Pricing & Gateways</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            type="button"
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Тикеты Поддержки / Support Tickets ({supportTickets.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* TAB 1: USERS & CRM */}
        {activeTab === 'users' && (
          <section className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-500" /> Управление Пользователями (CRM &amp; Credits)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Поиск клиентов, начисление бесплатных генераций (компенсация Refund Policy), ручная смена тарифа и отмена подписок.
                </p>
              </div>

              {/* Header Controls: Search + Add User */}
              <div className="flex items-center gap-3">
                <div className="relative min-w-[280px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Поиск по Email или User ID..."
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
                  <span>+ Add User / Добавить</span>
                </button>
              </div>
            </div>

            {/* Users Table Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <span className="text-sm font-medium">Загрузка базы пользователей...</span>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500 space-y-2">
                  <p className="font-semibold text-sm">{error}</p>
                  <button
                    onClick={fetchUsersAndSettings}
                    className="px-4 py-2 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Повторить
                  </button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  Пользователи по запросу &quot;{searchQuery}&quot; не найдены.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-6">Пользователь (Email)</th>
                        <th className="py-3.5 px-6">Тарифный план</th>
                        <th className="py-3.5 px-6">Баланс генераций</th>
                        <th className="py-3.5 px-6">Статус / Отмена подписки</th>
                        <th className="py-3.5 px-6">Lifetime Free</th>
                        <th className="py-3.5 px-6">Роль</th>
                        <th className="py-3.5 px-6 text-right">Удалить</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {filteredUsers.map((u) => {
                        const isSubActive = u.subscription_status === 'monthly' || u.subscription_status === 'yearly' || u.subscription_status === 'pro';
                        const isOnetime = u.subscription_status === 'onetime';

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                            
                            {/* Email & ID */}
                            <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                              <div className="flex flex-col">
                                <span>{u.email}</span>
                                <span className="text-[10px] text-slate-400 font-mono select-all">
                                  ID: {u.id.substring(0, 8)}...
                                </span>
                              </div>
                            </td>

                            {/* Manual Plan Switching Dropdown */}
                            <td className="py-4 px-6">
                              <select
                                value={u.subscription_status || 'free'}
                                onChange={(e) => handlePlanChange(u.id, e.target.value)}
                                disabled={updatingUserId === u.id}
                                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer focus:outline-none text-slate-800 dark:text-slate-200"
                              >
                                <option value="free">Free (Бесплатный)</option>
                                <option value="onetime">One-Time Pass (Разовый)</option>
                                <option value="monthly">Monthly Pro (Месячный)</option>
                                <option value="yearly">Yearly Pro (Годовой)</option>
                                <option value="canceled">Canceled (Отменена)</option>
                              </select>
                            </td>

                            {/* Credits / Generations Management */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 ${
                                  (u.generation_credits || 0) > 0
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  {u.generation_credits || 0}
                                </span>

                                {/* Quick Increment Actions */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleUpdateCredits(u.id, 1)}
                                    disabled={updatingUserId === u.id}
                                    title="Начислить +1 бесплатную генерацию (Refund Compensation)"
                                    className="p-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                  >
                                    +1
                                  </button>
                                  <button
                                    onClick={() => handleUpdateCredits(u.id, 5)}
                                    disabled={updatingUserId === u.id}
                                    title="Начислить +5 генераций"
                                    className="p-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                  >
                                    +5
                                  </button>
                                  {(u.generation_credits || 0) > 0 && (
                                    <button
                                      onClick={() => handleUpdateCredits(u.id, -1)}
                                      disabled={updatingUserId === u.id}
                                      title="Списать 1 генерацию"
                                      className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                    >
                                      -1
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Subscription Status & Cancel Action */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                {u.is_lifetime_free ? (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full">
                                    Lifetime Active
                                  </span>
                                ) : isSubActive ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-full">
                                      {u.subscription_status}
                                    </span>
                                    <button
                                      onClick={() => handleCancelSubscription(u.id, u.email)}
                                      disabled={updatingUserId === u.id}
                                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-400 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                      title="Отменить подписку пользователя"
                                    >
                                      <Ban className="w-3 h-3" />
                                      <span>Отменить</span>
                                    </button>
                                  </div>
                                ) : isOnetime ? (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-full">
                                    One-Time Pass
                                  </span>
                                ) : u.subscription_status === 'canceled' ? (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 rounded-full">
                                    Canceled
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-full">
                                    Free
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Lifetime Free Toggle Button */}
                            <td className="py-4 px-6">
                              <button
                                onClick={() => handleToggleLifetime(u.id, u.is_lifetime_free)}
                                disabled={updatingUserId === u.id}
                                type="button"
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                  u.is_lifetime_free
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                {updatingUserId === u.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : u.is_lifetime_free ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 opacity-50" />
                                )}
                                <span>{u.is_lifetime_free ? 'Active' : 'Off'}</span>
                              </button>
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

                            {/* Actions (Delete User) */}
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
                                <span className="text-[10px] text-slate-400 font-medium italic">Owner</span>
                              )}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 2: PRICING & PAYMENT GATEWAYS */}
        {activeTab === 'pricing' && (
          <div className="space-y-8 animate-fade-in">
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
                    Переключение активного шлюза (Allpay / Paddle) и ввод API ключей без перезагрузки сервера.
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
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">One-Time Product ID</label>
                        <input
                          type="text"
                          placeholder="prod_onetime_pass"
                          value={allpayProductOnetime}
                          onChange={(e) => setAllpayProductOnetime(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Monthly Product ID</label>
                        <input
                          type="text"
                          placeholder="prod_monthly_sub"
                          value={allpayProductMonthly}
                          onChange={(e) => setAllpayProductMonthly(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Yearly Product ID</label>
                        <input
                          type="text"
                          placeholder="prod_yearly_sub"
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
                        <Globe className="w-4 h-4 text-indigo-500" /> Paddle Settings (Billing v2)
                      </h3>
                      {activeGateway === 'paddle' && (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">
                          ● Active Gateway
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Environment</label>
                        <select
                          value={paddleEnv}
                          onChange={(e) => setPaddleEnv(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="sandbox">Sandbox (Testing)</option>
                          <option value="production">Production (Live)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Client-Side Token</label>
                        <input
                          type="text"
                          placeholder="test_... or live_..."
                          value={paddleClientToken}
                          onChange={(e) => setPaddleClientToken(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">API Key (Backend Secret)</label>
                        <input
                          type="password"
                          placeholder="API Secret Key"
                          value={paddleApiKey}
                          onChange={(e) => setPaddleApiKey(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">One-Time Price ID</label>
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
          </div>
        )}

        {/* TAB 3: SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <section className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-indigo-500" /> Входящие Тикеты Поддержки (Support Inbox)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Обращения пользователей из формы поддержки, темы вопросов и статусы решения.
                </p>
              </div>

              <button
                onClick={fetchUsersAndSettings}
                type="button"
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Обновить</span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
              {supportTickets.length === 0 ? (
                <div className="p-16 text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-sm font-medium">Нет активных тикетов поддержки.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {supportTickets.map((t) => (
                    <div key={t.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            t.status === 'resolved' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : t.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {t.status || 'open'}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {t.subject}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] rounded-md font-semibold">
                            {t.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{new Date(t.created_at).toLocaleString()}</span>
                          <select
                            value={t.status || 'open'}
                            onChange={(e) => handleTicketStatusChange(t.id, e.target.value)}
                            disabled={updatingTicketId === t.id}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold px-2 py-1 rounded-lg cursor-pointer focus:outline-none"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" />
                        <a href={`mailto:${t.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                          {t.email}
                        </a>
                        {t.user_id && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            (User ID: {t.user_id.substring(0, 8)}...)
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 whitespace-pre-wrap leading-relaxed">
                        {t.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
