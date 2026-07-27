import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';
import termsMd from '../content/docs/terms.md?raw';
import refundMd from '../content/docs/refund.md?raw';
import privacyMd from '../content/docs/privacy.md?raw';

export default function DocViewer({ type }) {
  let content = '';
  let title = '';

  if (type === 'terms') {
    content = termsMd;
    title = 'Terms of Service';
  } else if (type === 'refund') {
    content = refundMd;
    title = 'Refund and Cancellation Policy';
  } else if (type === 'privacy') {
    content = privacyMd;
    title = 'Privacy Policy';
  }

  const navigateHome = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300 pb-16">
      {/* Header Container (unified width limit matching main workspace) */}
      <div className="max-w-[1500px] w-full mx-auto px-4 md:px-6 my-6">
        <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 px-6 py-4 rounded-2xl flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-3">
            <a 
              href="/" 
              onClick={navigateHome}
              className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold transition-all text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </a>
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Birdy Pages legal
          </span>
        </header>
      </div>

      {/* Main Document Content */}
      <main className="max-w-[800px] w-full mx-auto px-4 md:px-6 flex-1">
        <article className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 mt-2 border-b border-slate-100 dark:border-slate-800 pb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-4 mt-8" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 mt-6" {...props} />,
              p: ({ node, ...props }) => <p className="text-slate-600 dark:text-slate-350 leading-relaxed mb-4 text-sm md:text-base" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-600 dark:text-slate-350 text-sm md:text-base" {...props} />,
              li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-slate-950 dark:text-white" {...props} />,
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </main>
    </div>
  );
}
