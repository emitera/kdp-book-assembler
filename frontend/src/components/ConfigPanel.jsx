import React from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { TRIM_SIZES, PAPER_TYPES, calculateSpineWidth, calculateCoverDimensions, isSpineTextEligible } from '../utils/kdpMath';
import { Settings, BookOpen, Layers, Type } from 'lucide-react';

export default function ConfigPanel() {
  const { t } = useTranslation();
  const {
    trimSizeId,
    setTrimSizeId,
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
    interiorPages,
    spineColor,
    setSpineColor,
    spineText,
    setSpineText,
    spineTextColor,
    setSpineTextColor,
    spineTextDirection,
    setSpineTextDirection,
    activeTrimSize,
    activePaperType
  } = useApp();

  const userPagesCount = interiorPages.length;
  const pageCount = (userPagesCount * (isSingleSided ? 2 : 1)) + (addBlankAtStart ? 1 : 0);
  const spineWidth = calculateSpineWidth(pageCount, activePaperType.multiplier);
  const coverDims = calculateCoverDimensions(activeTrimSize.width, activeTrimSize.height, spineWidth);
  const textEligible = isSpineTextEligible(pageCount);

  // Derive print type and paper type for distinct select options
  const currentPrintType = activePaperType.type; // 'bw' | 'color'
  const currentPaperColor = paperTypeId.includes('cream') ? 'cream' : 'white';

  const handlePrintTypeChange = (e) => {
    const val = e.target.value;
    if (val === 'bw') {
      // Map to white_bw by default
      setPaperTypeId('white_bw');
    } else if (val === 'std_color') {
      setPaperTypeId('std_color');
    } else if (val === 'prem_color') {
      setPaperTypeId('prem_color');
    }
  };

  const handlePaperColorChange = (e) => {
    const val = e.target.value;
    if (currentPrintType === 'bw') {
      setPaperTypeId(val === 'cream' ? 'cream_bw' : 'white_bw');
    }
  };

  return (
    <div className="space-y-6">
      {/* Book Specifications */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <BookOpen className="w-4 h-4 text-indigo-500" /> <span>{t('config.specifications', 'Параметры книги')}</span>
        </h3>

        {/* Trim Size Select Dropdown */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Формат книги (Trim Size)
          </label>
          <select
            value={trimSizeId}
            onChange={(e) => setTrimSizeId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {TRIM_SIZES.map((size) => (
              <option key={size.id} value={size.id}>
                {size.name}
              </option>
            ))}
          </select>
        </div>

        {/* Book Orientation Selection */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Ориентация книги
          </label>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="portrait">Portrait (Портретная)</option>
            <option value="landscape">Landscape (Альбомная)</option>
          </select>
        </div>

        {/* Print Type Selection */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Тип печати
          </label>
          <select
            value={paperTypeId === 'cream_bw' || paperTypeId === 'white_bw' ? 'bw' : paperTypeId}
            onChange={handlePrintTypeChange}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="bw">Черно-белая (B&W)</option>
            <option value="std_color">Standard Color (Цветная стандартная)</option>
            <option value="prem_color">Premium Color (Цветная премиум)</option>
          </select>
        </div>

        {/* Paper Color Selection */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Цвет бумаги
          </label>
          <select
            value={currentPaperColor}
            onChange={handlePaperColorChange}
            disabled={currentPrintType !== 'bw'}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 disabled:opacity-50 cursor-pointer"
          >
            <option value="white">Белая бумага (White Paper)</option>
            <option value="cream">Кремовая бумага (Cream Paper)</option>
          </select>
          {currentPrintType !== 'bw' && (
            <span className="text-[9px] text-slate-400">
              * Цветная печать KDP доступна только на белой бумаге.
            </span>
          )}
        </div>

        {/* Interior Bleed Switch */}
        <div className="flex justify-between items-center py-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Вылеты за обрез (Bleed)
            </span>
            <span className="text-[10px] text-slate-400 block max-w-[200px]">
              Изображения идут в край страниц.
            </span>
          </div>
          <button
            onClick={() => setHasBleed(!hasBleed)}
            type="button"
            className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              hasBleed ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                hasBleed ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Single-sided printing Switch */}
        <div className="flex justify-between items-center py-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Односторонняя печать
            </span>
            <span className="text-[10px] text-slate-400 block max-w-[200px]">
              Пустая страница слева для защиты от просвечивания.
            </span>
          </div>
          <button
            onClick={() => setIsSingleSided(!isSingleSided)}
            type="button"
            className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isSingleSided ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isSingleSided ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Add blank page at start Switch */}
        <div className="flex justify-between items-center py-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Добавить пустой лист в начало
            </span>
            <span className="text-[10px] text-slate-400 block max-w-[200px]">
              Сдвигает все развороты на один лист.
            </span>
          </div>
          <button
            onClick={() => setAddBlankAtStart(!addBlankAtStart)}
            type="button"
            className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              addBlankAtStart ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                addBlankAtStart ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Spine Customization */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Layers className="w-4 h-4 text-indigo-500" /> <span>Кастомизация корешка</span>
        </h3>

        {/* Spine Color Input */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Цвет корешка
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={spineColor}
              onChange={(e) => setSpineColor(e.target.value)}
              className="w-20 px-2 py-1.5 border border-slate-200 dark:border-slate-850 bg-transparent rounded-lg text-xs text-slate-800 dark:text-slate-200 font-mono text-center focus:outline-none focus:border-indigo-500"
            />
            <input
              type="color"
              value={spineColor.startsWith('#') && spineColor.length === 7 ? spineColor : '#ffffff'}
              onChange={(e) => setSpineColor(e.target.value)}
              className="w-8 h-8 border-0 p-0 rounded-lg overflow-hidden cursor-pointer"
            />
          </div>
        </div>

        {/* Spine Text Customization */}
        {textEligible ? (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Type className="w-4 h-4 text-indigo-500" />
              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Текст корешка (от 79 стр.)
              </label>
            </div>
            
            <input
              type="text"
              value={spineText}
              onChange={(e) => setSpineText(e.target.value)}
              placeholder="Введите название, автора и т.д."
              maxLength={100}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 bg-transparent rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-450">Цвет текста</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={spineTextColor}
                  onChange={(e) => setSpineTextColor(e.target.value)}
                  className="w-20 px-2 py-1.5 border border-slate-200 dark:border-slate-850 bg-transparent rounded-lg text-xs text-slate-800 dark:text-slate-200 font-mono text-center focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="color"
                  value={spineTextColor.startsWith('#') && spineTextColor.length === 7 ? spineTextColor : '#000000'}
                  onChange={(e) => setSpineTextColor(e.target.value)}
                  className="w-8 h-8 border-0 p-0 rounded-lg overflow-hidden cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[10px] text-slate-450 uppercase tracking-wider font-medium">Направление текста</span>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSpineTextDirection('top-to-bottom')}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                    spineTextDirection === 'top-to-bottom'
                      ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-700/50'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
                  }`}
                >
                  Сверху вниз
                </button>
                <button
                  type="button"
                  onClick={() => setSpineTextDirection('bottom-to-top')}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                    spineTextDirection === 'bottom-to-top'
                      ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-700/50'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
                  }`}
                >
                  Снизу вверх
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-center">
            <p className="text-[10px] text-slate-550 leading-relaxed">
              * Текст на корешке доступен при объеме книги от 79 страниц. У вас: {pageCount} стр.
            </p>
          </div>
        )}
      </div>

      {/* Book Metric Summary */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white space-y-4 shadow-md">
        <div className="flex justify-between items-center pb-1">
          <h4 className="text-xs font-bold tracking-wider uppercase opacity-90 flex items-center gap-2">
            <Settings className="w-3.5 h-3.5" /> Расчет размеров KDP
          </h4>

          {/* Unit Switcher */}
          <div className="flex items-center bg-white/20 p-0.5 rounded-lg text-[9px] font-bold backdrop-blur-xs">
            <button
              onClick={() => setUnit('in')}
              type="button"
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                unit === 'in' ? 'bg-white text-indigo-700 shadow-xs' : 'text-white/80 hover:text-white bg-transparent'
              }`}
            >
              Дюймы
            </button>
            <button
              onClick={() => setUnit('px')}
              type="button"
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                unit === 'px' ? 'bg-white text-indigo-700 shadow-xs' : 'text-white/80 hover:text-white bg-transparent'
              }`}
            >
              Пиксели
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-[10px]">
          <div className="space-y-0.5">
            <span className="opacity-75 block">Толщина корешка</span>
            <strong className="text-xs font-bold block">
              {unit === 'in' 
                ? `${spineWidth.toFixed(4)}" (${(spineWidth * 25.4).toFixed(2)} мм)`
                : `${Math.round(spineWidth * 300)} px`
              }
            </strong>
          </div>
          <div className="space-y-0.5">
            <span className="opacity-75 block">Размер обложки</span>
            <strong className="text-xs font-bold block">
              {unit === 'in'
                ? `${coverDims.width.toFixed(3)}" × ${coverDims.height.toFixed(3)}"`
                : `${Math.round(coverDims.width * 300)} × ${Math.round(coverDims.height * 300)} px`
              }
            </strong>
          </div>
          <div className="space-y-0.5">
            <span className="opacity-75 block">Итого страниц</span>
            <strong className="text-xs font-bold block">
              {pageCount} стр. (Мин: 24)
            </strong>
          </div>
          <div className="space-y-0.5">
            <span className="opacity-75 block">Мультипликатор</span>
            <strong className="text-xs font-bold block font-mono">
              {activePaperType.multiplier.toFixed(6)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
