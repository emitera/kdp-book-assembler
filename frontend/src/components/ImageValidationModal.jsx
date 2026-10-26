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

  const reqRatio = (requiredWidth / requiredHeight).toFixed(3);
  const actualRatio = (currentWidth / currentHeight).toFixed(3);
  const ratioLabelReq = `Ratio: ${reqRatio}`;
  const ratioLabelActual = `Ratio: ${actualRatio}`;

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
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl mb-1">
            <AlertTriangle className="w-8 h-8 animate-bounce" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {t('aspectRatio.mismatchAlert', 'Соотношение сторон изображения и холста не совпадает')}
          </h3>
          <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
            {t('aspectRatio.detectedSubtitle', 'Разница соотношений сторон превышает 0.01. Выберите режим отображения:')}
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
                {t('validation.required', 'Требуется (Холст)')}
              </span>
              <strong className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                {requiredLabel}
              </strong>
              <span className="text-[9px] text-slate-450 block font-mono">
                {ratioLabelReq}
              </span>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                {t('validation.uploaded', 'Загружено (Картинка)')}
              </span>
              <strong className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                {uploadedLabel}
              </strong>
              <span className="text-[9px] text-slate-450 block font-mono">
                {ratioLabelActual}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Contain, Cover, Keep */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Mode 1: Contain */}
            <button
              onClick={handleOptimizeClick}
              disabled={isProcessing}
              type="button"
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border border-transparent text-center"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{t('aspectRatio.containMode', '«Вписать (Contain)»')}</span>
              <span className="text-[9px] opacity-80 font-normal">
                {t('aspectRatio.containDesc', 'По большей стороне, с краями')}
              </span>
            </button>

            {/* Mode 2: Cover */}
            <button
              onClick={() => {
                if (validationData.onCover) {
                  validationData.onCover();
                } else {
                  onKeep();
                }
                onClose();
              }}
              disabled={isProcessing}
              type="button"
              className="p-3 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border border-transparent text-center"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('aspectRatio.coverMode', '«Заполнить (Cover)»')}</span>
              <span className="text-[9px] opacity-80 font-normal">
                {t('aspectRatio.coverDesc', 'Без белых полос, с превью')}
              </span>
            </button>
          </div>

          <button
            onClick={handleKeepClick}
            disabled={isProcessing}
            type="button"
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
          >
            {t('validation.noKeep', 'Оставить как есть (без изменений)')}
          </button>
        </div>

      </div>
    </div>
  );
}
