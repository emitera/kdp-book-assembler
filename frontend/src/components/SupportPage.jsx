import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';
import { supabase } from '../services/supabaseClient';
import { MessageSquare, ArrowLeft, Send, CheckCircle2, AlertCircle, Loader2, Globe } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function SupportPage() {
  const { t, i18n } = useTranslation();
  const { user, language, changeLanguage } = useApp();
  
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const currentLang = (language || i18n.language || 'en').startsWith('ru') ? 'ru' : 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'ru' ? 'en' : 'ru';
    if (changeLanguage) {
      changeLanguage(nextLang);
    } else {
      i18n.changeLanguage(nextLang);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // 1. Try sending via Backend API (which inserts into DB + dispatches real email notification)
      let submittedSuccessfully = false;

      try {
        const response = await fetch(`${API_URL}/api/support/ticket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            subject,
            category,
            message,
            userId: user?.id || null
          })
        });

        if (response.ok) {
          submittedSuccessfully = true;
        }
      } catch (apiErr) {
        console.warn('Backend support endpoint unreachable, falling back to direct Supabase insert:', apiErr);
      }

      // 2. Fallback to direct Supabase insert if backend API was offline
      if (!submittedSuccessfully) {
        const { error: insertError } = await supabase
          .from('support_tickets')
          .insert({
            user_id: user?.id || null,
            email,
            subject,
            category,
            message,
            status: 'open'
          });

        if (insertError) throw insertError;
      }

      setSuccess(true);
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Support ticket submission error:', err);
      setError(err.message || t('support.errorMessage', 'Failed to submit support request. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shadow-xs">
        <Logo />
        
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            type="button"
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span className="uppercase">{currentLang}</span>
          </button>

          <a
            href="/"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('support.backToApp', 'Back to Assembler')}</span>
          </a>
        </div>
      </header>

      {/* Main Support Form */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-10 space-y-6">
        
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <div className="inline-flex p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-1">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('support.title', 'Birdy Pages Support & Help')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('support.subtitle', 'Have a question, feedback, or technical issue with KDP book generation? Send us a ticket and our team will get back to you shortly.')}
          </p>
        </div>

        {/* Support Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
          
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>
                {t('support.successMessage', 'Thank you! Your support ticket has been received. We will contact you at {{email}}.', { email })}
              </span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('support.emailLabel', 'Your Email Address *')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('support.emailPlaceholder', 'author@example.com')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('support.categoryLabel', 'Ticket Category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer text-slate-900 dark:text-slate-100"
              >
                <option value="general">{t('support.categories.general', 'General Inquiry')}</option>
                <option value="billing">{t('support.categories.billing', 'Billing & Payments')}</option>
                <option value="technical">{t('support.categories.technical', 'PDF Generation Issue')}</option>
                <option value="feature">{t('support.categories.feature', 'Feature Request')}</option>
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('support.subjectLabel', 'Subject *')}
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('support.subjectPlaceholder', 'e.g. Issue with 8.5x11 cover spread PDF')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Message Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('support.messageLabel', 'Message *')}
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('support.messagePlaceholder', 'Describe your issue or question in detail...')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{t('support.submitBtn', 'Submit Ticket')}</span>
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
