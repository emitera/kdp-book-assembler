import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Eye, EyeOff, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function LegendPanel({ 
  showGuides = true, 
  onToggleGuides = null,
  className = '' 
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const guideItems = [
    {
      id: 'bleed',
      title: t('legend.bleed', 'Bleed (Линия обреза)'),
      desc: t('legend.bleedDesc', 'Красный пунктир — граница среза KDP (0.125" / 3.2 мм)'),
      color: '#ef4444',
      lineStyle: {
        borderColor: '#ef4444',
        filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.85))'
      }
    },
    {
      id: 'safeMargin',
      title: t('legend.safeMargin', 'Safe Margin (Безопасная зона)'),
      desc: t('legend.safeMarginDesc', 'Синий пунктир — все важные тексты и лица должны быть внутри'),
      color: '#6366f1',
      lineStyle: {
        borderColor: '#6366f1',
        filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.85))'
      }
    },
    {
      id: 'gutterHinge',
      title: t('legend.gutterHinge', 'Gutter / Hinge (Сгиб и каналы)'),
      desc: t('legend.gutterHingeDesc', 'Голубой пунктир — каналы сгиба корешка / внутреннее поле'),
      color: '#0284c7',
      lineStyle: {
        borderColor: '#0284c7',
        filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.85))'
      }
    },
    {
      id: 'barcode',
      title: t('legend.barcode', 'Barcode (Зона штрихкода)'),
      desc: t('legend.barcodeDesc', 'Желтый пунктир — резерв под ISBN штрихкод (2" × 1.2")'),
      color: '#f59e0b',
      lineStyle: {
        borderColor: '#f59e0b',
        filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.85))'
      }
    }
  ];

  return (
    <div className={`pointer-events-auto transition-all duration-200 ${className}`}>
      {/* Floating Card */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden text-left max-w-[320px]">
        {/* Header / Toggle Pill */}
        <div className="p-2.5 px-3.5 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            type="button"
            className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none"
          >
            <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold tracking-tight">
              {t('legend.title', 'Направляющие KDP')}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {/* Quick Visibility Toggle */}
          {onToggleGuides && (
            <button
              onClick={onToggleGuides}
              type="button"
              title={showGuides ? t('legend.hide', 'Скрыть') : t('legend.show', 'Показать')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                showGuides 
                  ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40' 
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {showGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Expandable Guide Body */}
        {isExpanded && (
          <div className="p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              {t('legend.subtitle', 'Линии усилены контрастным свечением для четкости на любом фоне:')}
            </p>
            <div className="space-y-2">
              {guideItems.map((item) => (
                <div 
                  key={item.id}
                  className="p-2 rounded-xl bg-slate-50/60 dark:bg-slate-850/40 border border-slate-150/60 dark:border-slate-800/60 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    {/* High-Contrast Line Sample */}
                    <div 
                      className="w-7 h-0 border-b-2 border-dashed flex-shrink-0"
                      style={item.lineStyle}
                    />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug pl-9">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
