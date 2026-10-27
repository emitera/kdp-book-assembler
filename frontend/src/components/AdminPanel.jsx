import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { 
  Users, 
  Search, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  DollarSign,
  Save,
  UserPlus,
  Trash2,
  X,
  Mail,
  Lock,
  CreditCard,
  MessageSquare,
  Plus,
  Minus,
  AlertCircle,
  Ban,
  Sparkles,
  Key,
  Copy,
  Shield,
  ShieldCheck,
  Check
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://kdp-backend.emitera.workers.dev';

export default function AdminPanel() {
  const { 
    user, 
    userProfile, 
    setOneTimePassPriceUsd, 
    setMonthlyProPriceUsd, 
    setYearlySubscriptionPriceUsd,
    setPaymentSettings 
  } = useApp();

  // Active Admin Tab: 'users' | 'licenses' | 'pricing' | 'tickets'
  const [activeTab, setActiveTab] = useState('users');

  // Users Directory State
  const [usersList, setUsersList] = useState([]);
  const [licensesList, setLicensesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Dynamic Pricing Admin State
  const [oneTimePrice, setOneTimePrice] = useState('9.99');
  const [subPrice, setSubPrice] = useState('19.99');
  const [yearlyPrice, setYearlyPrice] = useState('99.99');
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceSuccess, setPriceSuccess] = useState(false);

  // Payment Gateways Configuration State (Paddle MoR Exclusive)
  const [paddleEnv, setPaddleEnv] = useState('sandbox'); // 'sandbox' | 'production'
  const [paddleClientToken, setPaddleClientToken] = useState('');
  const [paddleApiKey, setPaddleApiKey] = useState('');
  const [paddlePriceOnetime, setPaddlePriceOnetime] = useState('');
  const [paddlePriceMonthly, setPaddlePriceMonthly] = useState('');
  const [paddlePriceYearly, setPaddlePriceYearly] = useState('');
  const [savingPaymentSettings, setSavingPaymentSettings] = useState(false);
  const [paymentSettingsSuccess, setPaymentSettingsSuccess] = useState(false);

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState([]);
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

  const getAuthHeaders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return { 'Authorization': `Bearer ${session.access_token}` };
      }
    } catch (err) {
      console.warn('Failed to retrieve session for admin headers:', err);
    }
    return {};
  };

  const adminFetch = async (url, options = {}) => {
    const authHeaders = await getAuthHeaders();
    return fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options.headers || {})
      }
    });
  };

  const fetchUsersAndSettings = async () => {
    setLoading(true);
    try {
      const [usersRes, settingsRes, paymentRes, ticketsRes, licensesRes] = await Promise.all([
        adminFetch(`${API_URL}/api/admin/users`),
        fetch(`${API_URL}/api/settings`),
        adminFetch(`${API_URL}/api/admin/payment-settings`),
        adminFetch(`${API_URL}/api/admin/support-tickets`).catch(() => ({ ok: false })),
        adminFetch(`${API_URL}/api/admin/licenses`).catch(() => ({ ok: false }))
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsersList(data.users || []);
      }

      if (licensesRes && licensesRes.ok) {
        const lData = await licensesRes.json();
        setLicensesList(lData.licenses || []);
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
          setPaddleEnv(pData.paddle_environment || 'sandbox');
          setPaddleClientToken(pData.paddle_client_token || '');
          setPaddleApiKey(pData.paddle_api_key || '');
          setPaddlePriceOnetime(pData.paddle_price_onetime || '');
          setPaddlePriceMonthly(pData.paddle_price_monthly || '');
          setPaddlePriceYearly(pData.paddle_price_yearly || '');
          if (setPaymentSettings) setPaymentSettings(pData);
        }
      }

      if (ticketsRes && ticketsRes.ok) {
        const tData = await ticketsRes.json();
        setSupportTickets(tData.tickets || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndSettings();
  }, []);

  // Action: Create New User (Auth + Profile)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    setCreateUserError('');

    try {
      const res = await adminFetch(`${API_URL}/api/admin/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
          subscriptionStatus: newSubStatus,
          isLifetimeFree: newIsLifetime,
          generationCredits: parseInt(newCredits, 10) || 0
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setCreateUserError(data.error || 'Failed to create user');
      } else {
        setIsAddUserModalOpen(false);
        setNewEmail('');
        setNewPassword('');
        setNewRole('user');
        setNewSubStatus('free');
        setNewCredits(0);
        setNewIsLifetime(false);
        setStatusMessage({ type: 'success', text: `Пользователь ${newEmail} успешно создан!` });
        fetchUsersAndSettings();
      }
    } catch (err) {
      setCreateUserError('Network error while creating user');
    } finally {
      setCreatingUser(false);
    }
  };

  // Action: Update User Role (User / Admin)
  const handleUpdateRole = async (targetUserId, role) => {
    setUpdatingUserId(targetUserId);
    try {
      const res = await adminFetch(`${API_URL}/api/admin/update-user-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, role })
      });

      if (res.ok) {
        setUsersList(usersList.map(u => u.id === targetUserId ? { ...u, role } : u));
        setStatusMessage({ type: 'success', text: `Роль пользователя изменена на: ${role}` });
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Action: Delete User
  const handleDeleteUser = async (targetUserId, targetEmail) => {
    if (!window.confirm(`Вы уверены, что хотите удалить пользователя ${targetEmail}? Это действие удалит его профиль и авторизацию.`)) {
      return;
    }
    setUpdatingUserId(targetUserId);
    try {
      const res = await adminFetch(`${API_URL}/api/admin/delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      });

      if (res.ok) {
        setUsersList(usersList.filter(u => u.id !== targetUserId));
        setStatusMessage({ type: 'success', text: `Пользователь ${targetEmail} удален.` });
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Action: Toggle Lifetime Free Status
  const handleToggleLifetime = async (targetUserId, currentStatus) => {
    setUpdatingUserId(targetUserId);
    try {
      const res = await adminFetch(`${API_URL}/api/admin/toggle-lifetime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, isLifetimeFree: !currentStatus })
      });

      if (res.ok) {
        setUsersList(usersList.map(u => u.id === targetUserId ? { ...u, is_lifetime_free: !currentStatus } : u));
      }
    } catch (err) {
      console.error('Failed to toggle lifetime status:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Action: Update User Generation Credits
  const handleUpdateCredits = async (targetUserId, delta, directValue) => {
    setUpdatingUserId(targetUserId);
    try {
      const payload = directValue !== undefined 
        ? { userId: targetUserId, credits: directValue }
        : { userId: targetUserId, delta };

      const res = await adminFetch(`${API_URL}/api/admin/update-user-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setUsersList(usersList.map(u => u.id === targetUserId ? { ...u, generation_credits: data.profile.generation_credits } : u));
        }
      }
    } catch (err) {
      console.error('Failed to update credits:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Action: Update User Subscription Plan
  const handleUpdatePlan = async (targetUserId, plan) => {
    setUpdatingUserId(targetUserId);
    try {
      const res = await adminFetch(`${API_URL}/api/admin/update-user-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, plan })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setUsersList(usersList.map(u => u.id === targetUserId ? { ...u, subscription_status: data.profile.subscription_status } : u));
          setStatusMessage({ type: 'success', text: `Тариф пользователя изменен на ${plan}` });
        }
      }
    } catch (err) {
      console.error('Failed to update plan:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Action: Cancel Subscription
  const handleCancelSubscription = async (targetUserId) => {
    if (!window.confirm('Отменить подписку пользователя? Доступ к платным функциям будет закрыт.')) {
      return;
    }
    setUpdatingUserId(targetUserId);
    try {
      const res = await adminFetch(`${API_URL}/api/admin/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setUsersList(usersList.map(u => u.id === targetUserId ? { ...u, subscription_status: 'canceled' } : u));
          setStatusMessage({ type: 'success', text: 'Подписка пользователя отменена' });
        }
      }
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Action: Generate Free Desktop License for User
  const handleGenerateLicense = async (targetUserId, targetEmail) => {
    setUpdatingUserId(targetUserId);
    try {
      const res = await adminFetch(`${API_URL}/api/admin/generate-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: targetUserId, send_email: true })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Ключ ${data.license.license_key} успешно выдан для ${targetEmail}!` });
        const licRes = await adminFetch(`${API_URL}/api/admin/licenses`);
        if (licRes.ok) {
          const lData = await licRes.json();
          setLicensesList(lData.licenses || []);
        }
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Ошибка создания лицензии' });
      }
    } catch (err) {
      console.error('Error generating license:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Action: Revoke License
  const handleRevokeLicense = async (licenseId, keyString) => {
    if (!window.confirm(`Вы уверены, что хотите отозвать лицензионный ключ ${keyString}? Десктопное приложение будет заблокировано.`)) {
      return;
    }
    try {
      const res = await adminFetch(`${API_URL}/api/admin/revoke-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_id: licenseId })
      });
      const data = await res.json();
      if (data.success) {
        setLicensesList(licensesList.map(l => l.id === licenseId ? { ...l, status: 'revoked' } : l));
        setStatusMessage({ type: 'success', text: `Ключ ${keyString} успешно отозван.` });
      }
    } catch (err) {
      console.error('Error revoking license:', err);
    }
  };

  // Copy Key to Clipboard
  const handleCopyKey = (keyText) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Action: Save App Pricing
  const handleSavePrices = async (e) => {
    e.preventDefault();
    setSavingPrice(true);
    setPriceSuccess(false);

    try {
      const res = await adminFetch(`${API_URL}/api/admin/update-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oneTimePassPriceUsd: parseFloat(oneTimePrice),
          subscriptionPriceUsd: parseFloat(subPrice),
          yearlySubscriptionPriceUsd: parseFloat(yearlyPrice)
        })
      });

      if (res.ok) {
        setPriceSuccess(true);
        if (setOneTimePassPriceUsd) setOneTimePassPriceUsd(parseFloat(oneTimePrice));
        if (setMonthlyProPriceUsd) setMonthlyProPriceUsd(parseFloat(subPrice));
        if (setYearlySubscriptionPriceUsd) setYearlySubscriptionPriceUsd(parseFloat(yearlyPrice));
        setTimeout(() => setPriceSuccess(false), 3000);
      } else {
        const d = await res.json();
        alert(`Error updating prices: ${d.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving prices');
    } finally {
      setSavingPrice(false);
    }
  };

  // Action: Save Paddle Payment Settings
  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    setSavingPaymentSettings(true);
    setPaymentSettingsSuccess(false);

    try {
      const payload = {
        active_gateway: 'paddle',
        paddle_environment: paddleEnv,
        paddle_client_token: paddleClientToken,
        paddle_api_key: paddleApiKey,
        paddle_price_onetime: paddlePriceOnetime,
        paddle_price_monthly: paddlePriceMonthly,
        paddle_price_yearly: paddlePriceYearly
      };

      const res = await adminFetch(`${API_URL}/api/admin/update-payment-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setPaymentSettingsSuccess(true);
        if (setPaymentSettings) setPaymentSettings(payload);
        setTimeout(() => setPaymentSettingsSuccess(false), 3000);
      } else {
        const d = await res.json();
        alert(`Error updating settings: ${d.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving payment settings');
    } finally {
      setSavingPaymentSettings(false);
    }
  };

  // Action: Update Support Ticket Status
  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    setUpdatingTicketId(ticketId);
    try {
      const res = await adminFetch(`${API_URL}/api/admin/update-ticket-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: newStatus })
      });

      if (res.ok) {
        setSupportTickets(supportTickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <a href="/" className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Birdy Pages Command Center
                </h1>
                <span className="bg-indigo-950/80 text-indigo-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-800/50 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-0.5">
                CRM пользователей, роли, десктопные лицензии и Paddle MoR
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Пользователи CRM
            </button>
            <button
              onClick={() => setActiveTab('licenses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'licenses' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4" />
              Десктопные лицензии
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'pricing' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Цены и Paddle
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Тикеты ({supportTickets.filter(t => t.status === 'open').length})
            </button>
          </div>
        </div>

        {/* Status Message Notification */}
        {statusMessage && (
          <div className={`flex items-center justify-between gap-3 p-4 rounded-xl border ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}>
            <div className="flex items-center gap-2.5">
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="text-sm font-medium">{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100 p-1">✕</button>
          </div>
        )}

        {/* TAB 1: USERS CRM */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Top Toolbar: Search + Add User Button + Refresh */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск по Email или User ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Add User Button */}
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Добавить пользователя
                </button>

                <button
                  onClick={fetchUsersAndSettings}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Обновить
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-xs border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Пользователь</th>
                      <th className="px-6 py-4">Роль</th>
                      <th className="px-6 py-4">Тарифный план</th>
                      <th className="px-6 py-4">Кредиты (Refund)</th>
                      <th className="px-6 py-4">Lifetime Free</th>
                      <th className="px-6 py-4">Десктопные лицензии</th>
                      <th className="px-6 py-4 text-right">Управление</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredUsers.map((u) => {
                      const userLicenses = licensesList.filter(l => l.user_id === u.id);
                      return (
                        <tr key={u.id} className="hover:bg-slate-800/20 transition">
                          {/* User Email & ID */}
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">{u.email}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{u.id}</div>
                          </td>

                          {/* Role Selector Dropdown */}
                          <td className="px-6 py-4">
                            <select
                              value={u.role || 'user'}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              disabled={updatingUserId === u.id}
                              className={`border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none ${
                                u.role === 'admin' 
                                  ? 'bg-purple-950/60 border-purple-800 text-purple-300' 
                                  : 'bg-slate-950 border-slate-800 text-slate-300'
                              }`}
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>

                          {/* Subscription Plan Dropdown */}
                          <td className="px-6 py-4">
                            <select
                              value={u.subscription_status || 'free'}
                              onChange={(e) => handleUpdatePlan(u.id, e.target.value)}
                              disabled={updatingUserId === u.id}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="free">Free Plan</option>
                              <option value="onetime">One-Time Pass</option>
                              <option value="monthly">Monthly Pro</option>
                              <option value="yearly">Yearly Pro</option>
                              <option value="lifetime">Lifetime Desktop</option>
                              <option value="canceled">Canceled</option>
                            </select>
                          </td>

                          {/* Generation Credits (Refund Policy) */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/40 text-xs">
                                {u.generation_credits ?? 0}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdateCredits(u.id, 1)}
                                  title="Выдать +1 бесплатную генерацию (Refund Policy)"
                                  className="p-1 bg-slate-800 hover:bg-emerald-600 rounded text-slate-300 hover:text-white transition"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleUpdateCredits(u.id, -1)}
                                  title="Списать 1 генерацию"
                                  className="p-1 bg-slate-800 hover:bg-rose-600 rounded text-slate-300 hover:text-white transition"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Lifetime Free Toggle */}
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleLifetime(u.id, u.is_lifetime_free)}
                              disabled={updatingUserId === u.id}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 border ${
                                u.is_lifetime_free
                                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {u.is_lifetime_free ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                              <span>{u.is_lifetime_free ? 'Active' : 'Off'}</span>
                            </button>
                          </td>

                          {/* Desktop Keys */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {userLicenses.length > 0 ? (
                                userLicenses.map((lic) => (
                                  <div key={lic.id} className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/30">
                                      {lic.license_key}
                                    </span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                      lic.status === 'active' ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                                    }`}>
                                      {lic.status}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-slate-500 italic">Нет выданных ключей</span>
                              )}
                            </div>
                          </td>

                          {/* Action Buttons: Generate License + Cancel Sub + Delete User */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Generate License Key */}
                              <button
                                onClick={() => handleGenerateLicense(u.id, u.email)}
                                disabled={updatingUserId === u.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition"
                                title="Выдать лицензионный ключ"
                              >
                                <Key className="w-3.5 h-3.5" />
                                Выдать ключ
                              </button>

                              {/* Cancel Subscription */}
                              {u.subscription_status !== 'canceled' && u.subscription_status !== 'free' && (
                                <button
                                  onClick={() => handleCancelSubscription(u.id)}
                                  className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 rounded-lg text-xs font-medium transition"
                                  title="Отменить подписку"
                                >
                                  Отменить
                                </button>
                              )}

                              {/* Delete User */}
                              {u.id !== user?.id && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                                  title="Удалить пользователя"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ALL DESKTOP LICENSES */}
        {activeTab === 'licenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                Все выпущенные десктопные лицензии
              </h2>
              <button
                onClick={fetchUsersAndSettings}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </button>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-xs border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Лицензионный ключ</th>
                      <th className="px-6 py-4">Email пользователя</th>
                      <th className="px-6 py-4">Hardware ID (Привязка ПК)</th>
                      <th className="px-6 py-4">Статус</th>
                      <th className="px-6 py-4">Дата выпуска</th>
                      <th className="px-6 py-4 text-right">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {licensesList.map((lic) => (
                      <tr key={lic.id} className="hover:bg-slate-800/20 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 font-mono font-bold text-indigo-300">
                            {lic.license_key}
                            <button
                              onClick={() => handleCopyKey(lic.license_key)}
                              className="text-slate-400 hover:text-white transition p-1"
                              title="Скопировать ключ"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {copiedKey === lic.license_key && (
                              <span className="text-[10px] text-emerald-400 font-sans font-semibold">Скопировано!</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {lic.profiles?.email || '—'}
                        </td>

                        <td className="px-6 py-4">
                          {lic.hardware_id ? (
                            <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              {lic.hardware_id.substring(0, 16)}...
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Не привязан</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            lic.status === 'active'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : lic.status === 'revoked'
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          }`}>
                            {lic.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(lic.created_at).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {lic.status === 'active' ? (
                            <button
                              onClick={() => handleRevokeLicense(lic.id, lic.license_key)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-medium transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Отозвать
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Отозван</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DYNAMIC PRICING & PADDLE SETTINGS */}
        {activeTab === 'pricing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dynamic App Pricing */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-400" />
                  Настройка цен тарифов (USD)
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Цены отображаются на странице покупки и применяются для клиентов
                </p>
              </div>

              <form onSubmit={handleSavePrices} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    One-Time Project Pass Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={oneTimePrice}
                    onChange={(e) => setOneTimePrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Monthly Subscription Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={subPrice}
                    onChange={(e) => setSubPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Yearly Subscription Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={yearlyPrice}
                    onChange={(e) => setYearlyPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPrice}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-white"
                >
                  {savingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Сохранить цены
                </button>

                {priceSuccess && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Цены успешно сохранены в базе данных!
                  </div>
                )}
              </form>
            </div>

            {/* Paddle Merchant of Record Settings */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  Параметры Paddle (Merchant of Record)
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Эксклюзивный платежный шлюз для обработки оплат и рекуррентных подписок
                </p>
              </div>

              <form onSubmit={handleSavePaymentSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Paddle Environment
                  </label>
                  <select
                    value={paddleEnv}
                    onChange={(e) => setPaddleEnv(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="sandbox">Sandbox (Тестирование)</option>
                    <option value="production">Production (Боевой режим)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Paddle Client Token
                  </label>
                  <input
                    type="text"
                    value={paddleClientToken}
                    onChange={(e) => setPaddleClientToken(e.target.value)}
                    placeholder="test_... или live_..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Paddle API Secret Key
                  </label>
                  <input
                    type="password"
                    value={paddleApiKey}
                    onChange={(e) => setPaddleApiKey(e.target.value)}
                    placeholder="••••••••••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      One-Time Price ID
                    </label>
                    <input
                      type="text"
                      value={paddlePriceOnetime}
                      onChange={(e) => setPaddlePriceOnetime(e.target.value)}
                      placeholder="pri_..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Monthly Price ID
                    </label>
                    <input
                      type="text"
                      value={paddlePriceMonthly}
                      onChange={(e) => setPaddlePriceMonthly(e.target.value)}
                      placeholder="pri_..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Yearly Price ID
                    </label>
                    <input
                      type="text"
                      value={paddlePriceYearly}
                      onChange={(e) => setPaddlePriceYearly(e.target.value)}
                      placeholder="pri_..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPaymentSettings}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 font-semibold rounded-xl text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 text-white"
                >
                  {savingPaymentSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Сохранить настройки Paddle
                </button>

                {paymentSettingsSuccess && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Настройки Paddle успешно обновлены!
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Входящие обращения пользователей
              </h2>
              <button
                onClick={fetchUsersAndSettings}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </button>
            </div>

            <div className="space-y-4">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">{ticket.email}</span>
                      <span className="bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 text-[11px] font-bold px-2 py-0.5 rounded-lg uppercase">
                        {ticket.category}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(ticket.created_at).toLocaleString()}
                      </span>
                    </div>

                    <select
                      value={ticket.status}
                      onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                      disabled={updatingTicketId === ticket.id}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs font-semibold text-slate-200"
                    >
                      <option value="open">Open (Новый)</option>
                      <option value="in_progress">In Progress (В работе)</option>
                      <option value="resolved">Resolved (Решен)</option>
                      <option value="closed">Closed (Закрыт)</option>
                    </select>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 text-sm text-slate-300 whitespace-pre-wrap font-sans">
                    {ticket.message}
                  </div>
                </div>
              ))}

              {supportTickets.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Нет входящих тикетов поддержки
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL: ADD NEW USER */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-950/60 text-indigo-400 border border-indigo-800/50 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Добавить пользователя</h3>
                  <p className="text-xs text-slate-400">Создать аккаунт и настроить тариф</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createUserError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {createUserError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Email адрес
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Роль
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Тариф
                  </label>
                  <select
                    value={newSubStatus}
                    onChange={(e) => setNewSubStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="free">Free</option>
                    <option value="onetime">One-Time Pass</option>
                    <option value="monthly">Monthly Pro</option>
                    <option value="yearly">Yearly Pro</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Кредиты
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newCredits}
                    onChange={(e) => setNewCredits(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsLifetime}
                      onChange={(e) => setNewIsLifetime(e.target.checked)}
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-300">Lifetime Free</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  {creatingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
