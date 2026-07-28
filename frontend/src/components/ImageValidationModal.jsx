import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Sparkles, X, Loader2 } from 'lucide-react';

export default function ImageValidationModal({ isOpen, validationData, onClose }) {
  const { t } = useTranslation();
  const { unit } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!isOpen || !validationData) return null;

  const { fileName, currentWidth, currentHeight, requiredWidth, requiredHeight, onOptimize, onKeep } = validationData;

  const requiredLabel = unit === 'in'
    ? `${(requiredWidth / 300).toFixed(3)} × ${(requiredHeight / 300).toFixed(3)} in`
    : `${requiredWidth} × ${requiredHeight} px`;

  const uploadedLabel = unit === 'in'
    ? `${(currentWidth / 300).toFixed(3)} × ${(currentHeight / 300).toFixed(3)} in`
    : `${currentWidth} × ${currentHeight} px`;

  const handleOptimizeClick = async () => {
    setIsProcessing(true);
    try {
      await onOptimize();
      onClose();
    } catch (err) {
      console.error('Optimization error:', err);
      alert('Failed to optimize image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeepClick = () => {
    onKeep();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-fade-in space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl mb-1">
            <AlertTriangle className="w-8 h-8 animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Неверные пропорции
          </h3>
          <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
            Пропорции изображения не совпадают с выбранным форматом книги. Оптимизировать расположение?
          </p>
        </div>

        {/* Mismatch Spec Details */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl space-y-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
            📄 {fileName}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Требуется
              </span>
              <strong className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                {requiredLabel}
              </strong>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Загружено
              </span>
              <strong className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                {uploadedLabel}
              </strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleOptimizeClick}
            disabled={isProcessing}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            type="button"
            className="flex-1 py-3 px-4 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent"
            style={{ backgroundColor: isHovered ? '#4338ca' : '#4f46e5' }}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Оптимизировать</span>
          </button>

          <button
            onClick={handleKeepClick}
            disabled={isProcessing}
            type="button"
            className="py-3 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-355 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
          >
            Сохранить исходный
          </button>
        </div>

      </div>
    </div>
  );
}
