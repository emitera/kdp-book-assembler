import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, CheckCircle2, AlertCircle, Image as ImageIcon, BookOpen } from 'lucide-react';
import { getImageDimensions, resizeImageToFit } from '../utils/imageValidator';
import { calculateSpineWidth, calculateCoverDimensions } from '../utils/kdpMath';
import ImageValidationModal from './ImageValidationModal';

export default function FileUploader() {
  const { t } = useTranslation();
  const {
    bindingType,
    coverType,
    frontCover,
    setFrontCover,
    backCover,
    setBackCover,
    fullCover,
    setFullCover,
    spineImage,
    setSpineImage,
    interiorPages,
    setInteriorPages,
    activeTrimSize,
    activePaperType,
    hasBleed,
    isSingleSided,
    addBlankAtStart
  } = useApp();

  const [dragActiveCover, setDragActiveCover] = useState({ front: false, spine: false, back: false, interior: false, full: false });
  const [error, setError] = useState('');
  const [validationModalData, setValidationModalData] = useState(null);

  const frontInputRef = useRef(null);
  const spineInputRef = useRef(null);
  const backInputRef = useRef(null);
  const fullInputRef = useRef(null);
  const interiorInputRef = useRef(null);

  const userPagesCount = interiorPages.length;
  const pageCount = (userPagesCount * (isSingleSided ? 2 : 1)) + (addBlankAtStart ? (isSingleSided ? 2 : 1) : 0);

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError(`Неверный тип файла: ${file.name}. Разрешены только JPG, JPEG и PNG.`);
      return false;
    }
    setError('');
    return true;
  };

  // Dimension validation helper
  const checkAndProcessFile = async (file, uploadType, onSuccess) => {
    try {
      let reqWidthPx, reqHeightPx;
      const spineWidth = calculateSpineWidth(pageCount, activePaperType.multiplier);

      if (uploadType === 'full') {
        const coverDims = calculateCoverDimensions(activeTrimSize.width, activeTrimSize.height, spineWidth, hasBleed, bindingType);
        reqWidthPx = Math.round(coverDims.width * 300);
        reqHeightPx = Math.round(coverDims.height * 300);
      } else if (uploadType === 'front' || uploadType === 'back') {
        if (bindingType === 'hardcover') {
          // Hardcover single page size is Trim + Wrap + Hinge
          reqWidthPx = Math.round((activeTrimSize.width + 0.591 + 0.394) * 300);
          reqHeightPx = Math.round((activeTrimSize.height + 0.591 * 2) * 300);
        } else {
          reqWidthPx = Math.round((activeTrimSize.width + 0.125) * 300);
          reqHeightPx = Math.round((activeTrimSize.height + 0.25) * 300);
        }
      } else if (uploadType === 'spine') {
        reqWidthPx = Math.round(spineWidth * 300);
        if (bindingType === 'hardcover') {
          reqHeightPx = Math.round((activeTrimSize.height + 0.591 * 2) * 300);
        } else {
          reqHeightPx = Math.round((activeTrimSize.height + 0.25) * 300);
        }
      } else {
        // Interior Pages
        reqWidthPx = Math.round((activeTrimSize.width + (hasBleed ? 0.125 : 0)) * 300);
        reqHeightPx = Math.round((activeTrimSize.height + (hasBleed ? 0.25 : 0)) * 300);
      }

      const dims = await getImageDimensions(file);

      // 1. Strict 300 DPI Quality Check (Hard block)
      if (dims.width < reqWidthPx || dims.height < reqHeightPx) {
        setError(`Разрешение файла (${dims.width}x${dims.height}) ниже стандарта 300 DPI (${reqWidthPx}x${reqHeightPx}). Загрузите изображение в лучшем качестве.`);
        return; // Hard block, file is rejected
      }

      // 2. Format / Aspect Ratio Check
      const targetRatio = reqWidthPx / reqHeightPx;
      const actualRatio = dims.width / dims.height;
      const ratioDiff = Math.abs(targetRatio - actualRatio);

      if (ratioDiff > 0.02) {
        setValidationModalData({
          fileName: file.name,
          currentWidth: dims.width,
          currentHeight: dims.height,
          requiredWidth: reqWidthPx,
          requiredHeight: reqHeightPx,
          onOptimize: async () => {
            const resized = await resizeImageToFit(file, reqWidthPx, reqHeightPx);
            onSuccess(resized);
          },
          onKeep: () => {
            onSuccess(file);
          }
        });
      } else {
        onSuccess(file);
      }
    } catch (err) {
      console.error('Validation check error:', err);
      onSuccess(file); // Fallback
    }
  };

  const handleDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveCover((prev) => ({ ...prev, [type]: true }));
    } else if (e.type === 'dragleave') {
      setDragActiveCover((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = async (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveCover((prev) => ({ ...prev, [type]: false }));

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      if (type === 'front') {
        if (validateFile(files[0])) {
          checkAndProcessFile(files[0], 'front', setFrontCover);
        }
      } else if (type === 'back') {
        if (validateFile(files[0])) {
          checkAndProcessFile(files[0], 'back', setBackCover);
        }
      } else if (type === 'spine') {
        if (interiorPages.length >= 79 && validateFile(files[0])) {
          checkAndProcessFile(files[0], 'spine', setSpineImage);
        }
      } else if (type === 'full') {
        if (interiorPages.length > 0 && validateFile(files[0])) {
          checkAndProcessFile(files[0], 'full', setFullCover);
        }
      } else if (type === 'interior') {
        const validFiles = Array.from(files).filter(validateFile);
        if (validFiles.length > 0) {
          handleInteriorAdd(validFiles);
        }
      }
    }
  };

  const handleInteriorAdd = (newFiles) => {
    if (newFiles.length === 0) return;
    
    // Validate first file and offer optimization check, then bulk load remaining files
    if (interiorPages.length === 0) {
      checkAndProcessFile(newFiles[0], 'interior', (processedFirstFile) => {
        const remaining = newFiles.slice(1);
        const updatedList = [processedFirstFile, ...remaining];
        setInteriorPages(updatedList);
      });
    } else {
      // Append files directly if list isn't empty (user adding more pages)
      const updatedList = [...interiorPages.map(p => p.file), ...newFiles];
      setInteriorPages(updatedList);
    }
  };

  const handleInteriorChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(validateFile);
      if (validFiles.length > 0) {
        handleInteriorAdd(validFiles);
      }
    }
  };

  const removePage = (index) => {
    const updated = interiorPages.filter((_, idx) => idx !== index).map(p => p.file);
    setInteriorPages(updated);
  };

  const clearPages = () => {
    setInteriorPages([]);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Dimension Mismatch Modal */}
      <ImageValidationModal
        isOpen={!!validationModalData}
        validationData={validationModalData}
        onClose={() => setValidationModalData(null)}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-xl animate-shake text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Conditional Layout: Parts vs Full Cover */}
      {coverType === 'full' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Cover Spread Dropzone */}
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Полный разворот обложки
            </span>
            {interiorPages.length > 0 ? (
              <div
                onDragEnter={(e) => handleDrag(e, 'full')}
                onDragOver={(e) => handleDrag(e, 'full')}
                onDragLeave={(e) => handleDrag(e, 'full')}
                onDrop={(e) => handleDrop(e, 'full')}
                onClick={() => !fullCover && fullInputRef.current?.click()}
                className={`relative flex items-center justify-between px-3 h-14 border border-dashed rounded-xl transition-all select-none ${
                  fullCover
                    ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : dragActiveCover.full
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 scale-[1.01]'
                      : 'border-slate-250 hover:border-indigo-400 bg-slate-50 dark:bg-slate-950 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {fullCover ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{fullCover.file.name}</p>
                        <p className="text-[9px] text-slate-400">Обложка загружена</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-650 dark:text-slate-300">Перетащите или кликните</span>
                    </>
                  )}
                </div>
                {fullCover && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullCover(null);
                    }}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <input
                  type="file"
                  ref={fullInputRef}
                  onChange={(e) => e.target.files?.[0] && validateFile(e.target.files[0]) && checkAndProcessFile(e.target.files[0], 'full', setFullCover)}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 h-14 border border-dashed border-slate-200 dark:border-slate-850 bg-slate-100/50 dark:bg-slate-950/30 rounded-xl opacity-60 cursor-not-allowed">
                <Upload className="w-4 h-4 text-slate-350" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-450 block leading-tight">Обложка заблокирована</span>
                  <span className="text-[9px] text-slate-400 block leading-none">Сначала добавьте страницы книги для расчета корешка</span>
                </div>
              </div>
            )}
          </div>

          {/* Interior Pages Dropzone */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Файлы страниц ({interiorPages.length})</span>
              {interiorPages.length > 0 && (
                <button
                  onClick={clearPages}
                  type="button"
                  className="text-[9px] font-extrabold text-red-500 hover:text-red-650 flex items-center gap-0.5 cursor-pointer"
                >
                  <Trash2 className="w-2.5 h-2.5" /> Очистить
                </button>
              )}
            </div>
            <div
              onDragEnter={(e) => handleDrag(e, 'interior')}
              onDragOver={(e) => handleDrag(e, 'interior')}
              onDragLeave={(e) => handleDrag(e, 'interior')}
              onDrop={(e) => handleDrop(e, 'interior')}
              onClick={() => interiorInputRef.current?.click()}
              className={`relative flex items-center justify-between px-3 h-14 border border-dashed rounded-xl cursor-pointer transition-all select-none ${
                interiorPages.length > 0
                  ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10'
                  : dragActiveCover.interior
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 scale-[1.01]'
                    : 'border-slate-250 hover:border-indigo-400 bg-slate-50 dark:bg-slate-950'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-slate-650 dark:text-slate-300 block truncate">
                    {interiorPages.length > 0 ? `Загружено: ${interiorPages.length} стр.` : 'Загрузить страницы'}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    Выделите несколько файлов
                  </span>
                </div>
              </div>
              <input
                type="file"
                ref={interiorInputRef}
                onChange={handleInteriorChange}
                accept="image/png, image/jpeg, image/jpg"
                multiple
                className="hidden"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Grid of Compact Dropzones (4 Columns) for Parts Mode */
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Dropzone 1: Front Cover */}
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Передняя часть обложки</span>
            <div
              onDragEnter={(e) => handleDrag(e, 'front')}
              onDragOver={(e) => handleDrag(e, 'front')}
              onDragLeave={(e) => handleDrag(e, 'front')}
              onDrop={(e) => handleDrop(e, 'front')}
              onClick={() => !frontCover && frontInputRef.current?.click()}
              className={`relative flex items-center justify-between px-3 h-14 border border-dashed rounded-xl transition-all select-none ${
                frontCover
                  ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : dragActiveCover.front
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 scale-[1.01]'
                    : 'border-slate-250 hover:border-indigo-400 bg-slate-50 dark:bg-slate-950 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {frontCover ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{frontCover.file.name}</p>
                      <p className="text-[9px] text-slate-400">Передняя часть загружена</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-650 dark:text-slate-300">Перетащите или кликните</span>
                  </>
                )}
              </div>
              {frontCover && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFrontCover(null);
                  }}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <input
                type="file"
                ref={frontInputRef}
                onChange={(e) => e.target.files?.[0] && validateFile(e.target.files[0]) && checkAndProcessFile(e.target.files[0], 'front', setFrontCover)}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
              />
            </div>
          </div>

          {/* Dropzone 2: Spine (Unlocked from 79 pages) */}
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Корешок (Spine)</span>
            {interiorPages.length >= 79 ? (
              <div
                onDragEnter={(e) => handleDrag(e, 'spine')}
                onDragOver={(e) => handleDrag(e, 'spine')}
                onDragLeave={(e) => handleDrag(e, 'spine')}
                onDrop={(e) => handleDrop(e, 'spine')}
                onClick={() => !spineImage && spineInputRef.current?.click()}
                className={`relative flex items-center justify-between px-3 h-14 border border-dashed rounded-xl transition-all select-none ${
                  spineImage
                    ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : dragActiveCover.spine
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 scale-[1.01]'
                      : 'border-slate-250 hover:border-indigo-400 bg-slate-50 dark:bg-slate-950 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {spineImage ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{spineImage.file.name}</p>
                        <p className="text-[9px] text-slate-400">Корешок загружен</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-650 dark:text-slate-300">Перетащите корешок</span>
                    </>
                  )}
                </div>
                {spineImage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSpineImage(null);
                    }}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <input
                  type="file"
                  ref={spineInputRef}
                  onChange={(e) => e.target.files?.[0] && validateFile(e.target.files[0]) && checkAndProcessFile(e.target.files[0], 'spine', setSpineImage)}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 h-14 border border-dashed border-slate-200 dark:border-slate-850 bg-slate-100/50 dark:bg-slate-950/30 rounded-xl opacity-60 cursor-not-allowed">
                <Upload className="w-4 h-4 text-slate-350" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-450 block leading-tight">Корешок заблокирован</span>
                  <span className="text-[9px] text-slate-400 block leading-none font-medium">Требуется от 79 страниц</span>
                </div>
              </div>
            )}
          </div>

          {/* Dropzone 3: Back Cover */}
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Задняя часть обложки</span>
            <div
              onDragEnter={(e) => handleDrag(e, 'back')}
              onDragOver={(e) => handleDrag(e, 'back')}
              onDragLeave={(e) => handleDrag(e, 'back')}
              onDrop={(e) => handleDrop(e, 'back')}
              onClick={() => !backCover && backInputRef.current?.click()}
              className={`relative flex items-center justify-between px-3 h-14 border border-dashed rounded-xl transition-all select-none ${
                backCover
                  ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : dragActiveCover.back
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 scale-[1.01]'
                    : 'border-slate-250 hover:border-indigo-400 bg-slate-50 dark:bg-slate-950 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {backCover ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{backCover.file.name}</p>
                      <p className="text-[9px] text-slate-400">Задняя часть загружена</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-650 dark:text-slate-300">Перетащите или кликните</span>
                  </>
                )}
              </div>
              {backCover && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBackCover(null);
                  }}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <input
                type="file"
                ref={backInputRef}
                onChange={(e) => e.target.files?.[0] && validateFile(e.target.files[0]) && checkAndProcessFile(e.target.files[0], 'back', setBackCover)}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
              />
            </div>
          </div>

          {/* Dropzone 4: Interior Pages */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Файлы страниц ({interiorPages.length})</span>
              {interiorPages.length > 0 && (
                <button
                  onClick={clearPages}
                  type="button"
                  className="text-[9px] font-extrabold text-red-500 hover:text-red-650 flex items-center gap-0.5 cursor-pointer"
                >
                  <Trash2 className="w-2.5 h-2.5" /> Очистить
                </button>
              )}
            </div>
            <div
              onDragEnter={(e) => handleDrag(e, 'interior')}
              onDragOver={(e) => handleDrag(e, 'interior')}
              onDragLeave={(e) => handleDrag(e, 'interior')}
              onDrop={(e) => handleDrop(e, 'interior')}
              onClick={() => interiorInputRef.current?.click()}
              className={`relative flex items-center justify-between px-3 h-14 border border-dashed rounded-xl cursor-pointer transition-all select-none ${
                interiorPages.length > 0
                  ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10'
                  : dragActiveCover.interior
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 scale-[1.01]'
                    : 'border-slate-250 hover:border-indigo-400 bg-slate-50 dark:bg-slate-950'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-slate-650 dark:text-slate-300 block truncate">
                    {interiorPages.length > 0 ? `Загружено: ${interiorPages.length} стр.` : 'Загрузить страницы'}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    Выделите несколько файлов
                  </span>
                </div>
              </div>
              <input
                type="file"
                ref={interiorInputRef}
                onChange={handleInteriorChange}
                accept="image/png, image/jpeg, image/jpg"
                multiple
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Accordion List of Uploaded Pages (Highly compact dropdown) */}
      {interiorPages.length > 0 && (
        <details className="group border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs">
          <summary className="p-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer list-none flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
            <span>Показать список файлов ({interiorPages.length})</span>
            <span className="transition-transform group-open:rotate-180">▼</span>
          </summary>
          <div className="border-t border-slate-100 dark:border-slate-800 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850 p-1">
            {interiorPages.map((page, index) => (
              <div key={page.id} className="flex items-center justify-between p-2 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 text-xs transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-550 dark:text-slate-450">
                    {index + 1}
                  </span>
                  <img
                    src={page.preview}
                    alt={`Page ${index + 1}`}
                    className="w-7 h-7 object-cover rounded border border-slate-200 dark:border-slate-700 bg-slate-50"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs md:max-w-md">
                      {page.file.name}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {formatSize(page.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePage(index);
                  }}
                  type="button"
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Pages multiplier info box */}
      {interiorPages.length > 0 && (() => {
        const rem = (pageCount + 1) % 4;
        const blankPagesToAdd = rem === 0 ? 0 : 4 - rem;

        return (
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl flex gap-3 text-xs text-amber-800 dark:text-amber-300 animate-fade-in shadow-2xs">
            <AlertCircle className="w-5 h-5 text-amber-550 flex-shrink-0" />
            <div className="space-y-1.5 leading-relaxed">
              <span className="font-bold block text-amber-900 dark:text-amber-200 text-xs">
                Особенность книжной печати (правило 4 страниц)
              </span>
              <p className="opacity-95">
                В типографии книги печатаются на больших листах, которые затем сгибаются. Поэтому итоговое количество страниц в книге всегда должно делиться на 4.
              </p>
              <div className="bg-white/50 dark:bg-black/30 p-2.5 rounded-lg border border-amber-200/40 dark:border-amber-900/40 text-[11px] space-y-1">
                <div>Сейчас в вашей книге: <strong className="font-bold">{pageCount}</strong> стр.</div>
                <div>Типография всегда добавляет 1 техническую страницу со своими данными в самый конец.</div>
                <div>Чтобы выполнить правило кратности, при печати в конец вашей книги будет автоматически добавлено <strong className="font-bold">{blankPagesToAdd}</strong> пустых страниц.</div>
              </div>
              <p className="text-[11px] opacity-90 italic">
                Совет: Вы можете добавить свой контент или пустые листы самостоятельно, чтобы полностью контролировать внешний вид книги.
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
