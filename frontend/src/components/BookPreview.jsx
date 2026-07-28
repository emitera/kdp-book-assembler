import React, { useState, useRef, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { calculateSpineWidth, calculateCoverDimensions, inchesToPoints } from '../utils/kdpMath';
import { Eye, BookOpen, AlertTriangle, Layers, Book, Move, Sliders, Check, Lock, RotateCcw } from 'lucide-react';

const InputField = ({ value, onChange, min, max, step }) => {
  const [localVal, setLocalVal] = useState(value);
  
  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleSubmit = () => {
    let numVal = parseFloat(localVal);
    if (!isNaN(numVal)) {
      numVal = Math.max(min, Math.min(max, numVal));
      onChange(numVal);
    } else {
      setLocalVal(value);
    }
  };

  return (
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleSubmit();
          e.currentTarget.blur();
        }
      }}
      className="w-16 text-right px-1.5 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-750 rounded text-xs font-mono focus:outline-none focus:border-indigo-500"
    />
  );
};

const PreviewImage = ({ 
  src, 
  xScale = 1.0, 
  yScale = 1.0, 
  xOffset = 0, 
  yOffset = 0, 
  containerWidth, 
  containerHeight, 
  isDragging = false,
  isBleedEnabled = false,
  isCover = false,
  isOdd = false
}) => {
  const { activeTrimSize } = useApp();
  const [aspectRatio, setAspectRatio] = useState(null);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  // Safe fallback while loading
  if (!aspectRatio) {
    return (
      <img
        src={src}
        onLoad={handleImageLoad}
        alt="Loading..."
        className="w-full h-full object-cover pointer-events-none opacity-0"
      />
    );
  }

  // Determine target boundaries based on Bleed
  let targetW = containerWidth;
  let targetH = containerHeight;
  let targetXOffset = 0;
  let targetYOffset = 0;

  if (!isCover && !isBleedEnabled) {
    // Bleed is OFF: Fit inside KDP Safe Zone
    const scaleFactor = containerWidth / activeTrimSize.width;
    const marginGutter = 0.375 * scaleFactor;
    const marginOutside = 0.25 * scaleFactor;
    const marginTop = 0.25 * (containerHeight / activeTrimSize.height);
    const marginBottom = 0.25 * (containerHeight / activeTrimSize.height);

    targetW = containerWidth - (marginGutter + marginOutside);
    targetH = containerHeight - (marginTop + marginBottom);

    // Centered or Gutter shifted:
    const marginLeft = isOdd ? marginGutter : marginOutside;
    targetXOffset = marginLeft - (containerWidth - targetW) / 2;
    targetYOffset = marginBottom - (containerHeight - targetH) / 2;
  }

  const containerRatio = targetW / targetH;
  
  let imgWidth, imgHeight;
  if (aspectRatio > containerRatio) {
    // Image is wider than container
    imgWidth = targetW;
    imgHeight = targetW / aspectRatio;
  } else {
    // Image is taller than container
    imgHeight = targetH;
    imgWidth = targetH * aspectRatio;
  }

  const style = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: `${imgWidth}px`,
    height: `${imgHeight}px`,
    marginLeft: `${-imgWidth / 2}px`,
    marginTop: `${-imgHeight / 2}px`,
    transform: `translate(${targetXOffset + (xOffset / 2)}px, ${targetYOffset + (yOffset / 2)}px) scale(${xScale}, ${yScale})`,
    transformOrigin: 'center center',
    maxWidth: 'none',
    maxHeight: 'none',
    pointerEvents: 'none',
    transition: isDragging ? 'none' : 'transform 0.15s ease'
  };

  return (
    <img
      src={src}
      onLoad={handleImageLoad}
      alt="Previewing"
      style={style}
    />
  );
};

export default function BookPreview() {
  const { t } = useTranslation();
  const {
    frontCover,
    backCover,
    spineImage,
    interiorPages,
    spineColor,
    spineText,
    spineTextColor,
    activeTrimSize,
    activePaperType,
    hasBleed,
    isSingleSided,
    addBlankAtStart,
    isDemoMode,
    unit,
    updateFrontCoverTransform,
    updateBackCoverTransform,
    updateSpineImageTransform,
    updatePageTransform
  } = useApp();

  const [activeTab, setActiveTab] = useState('cover'); // 'cover' | 'interior2d' | 'interior3d'
  
  // Selection state
  const [selectedElement, setSelectedElement] = useState('front'); // 'front' | 'back' | 'spine'
  const [selectedPageId, setSelectedPageId] = useState(null);
  
  // Active spread index for 2D page editor
  const [activeSpreadIndex, setActiveSpreadIndex] = useState(0);

  // Snapping and guides state
  const [dragState, setDragState] = useState({
    isDragging: false,
    snappedX: false,
    snappedY: false,
    element: null
  });

  const canvasRef = useRef(null);
  const flipBookRef = useRef(null);

  // Calculations for Spine & Cover
  const pageCount = (interiorPages.length * (isSingleSided ? 2 : 1)) + (addBlankAtStart ? 1 : 0);
  const spineWidth = calculateSpineWidth(pageCount, activePaperType.multiplier);
  const coverDims = calculateCoverDimensions(activeTrimSize.width, activeTrimSize.height, spineWidth);

  // Preview display ratios
  const baseWidth = activeTrimSize.width;
  const baseHeight = activeTrimSize.height;
  const isLandscape = baseWidth > baseHeight;
  const previewHeight = 330;
  const previewWidth = Math.round(330 * (baseWidth / baseHeight));
  const spinePxWidth = Math.max(16, Math.round(previewWidth * (spineWidth / baseWidth)));

  // Setup initial active page selection when interiorPages are loaded
  useEffect(() => {
    if (interiorPages.length > 0 && !selectedPageId) {
      setSelectedPageId(interiorPages[0].id);
    }
  }, [interiorPages, selectedPageId]);

  // Construct compiled page list
  const getCompiledPages = () => {
    const pages = [];
    if (addBlankAtStart) {
      pages.push({ id: 'blank_start', isBlank: true });
    }
    for (let i = 0; i < interiorPages.length; i++) {
      pages.push(interiorPages[i]);
      if (isSingleSided) {
        pages.push({ id: `blank_${interiorPages[i].id}`, isBlank: true });
      }
    }
    if (pages.length % 2 !== 0) {
      pages.push({ id: 'blank_end', isBlank: true });
    }
    return pages;
  };

  const compiledPages = getCompiledPages();

  // Create spreads of pages
  const getSpreads = () => {
    const spreads = [];
    if (compiledPages.length === 0) return spreads;
    
    spreads.push({
      left: null,
      right: compiledPages[0]
    });

    for (let i = 1; i < compiledPages.length; i += 2) {
      spreads.push({
        left: compiledPages[i],
        right: compiledPages[i + 1] || null
      });
    }
    return spreads;
  };

  const spreads = getSpreads();

  // Drag and drop WYSIWYG core handler
  const handleDragStart = (e, elementKey, pageId = null) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;

    let initX = 0;
    let initY = 0;

    if (pageId) {
      const pageObj = interiorPages.find(p => p.id === pageId);
      if (pageObj) {
        initX = pageObj.xOffset || 0;
        initY = pageObj.yOffset || 0;
      }
    } else {
      if (elementKey === 'front' && frontCover) {
        initX = frontCover.xOffset || 0;
        initY = frontCover.yOffset || 0;
      } else if (elementKey === 'back' && backCover) {
        initX = backCover.xOffset || 0;
        initY = backCover.yOffset || 0;
      } else if (elementKey === 'spine' && spineImage) {
        initX = spineImage.xOffset || 0;
        initY = spineImage.yOffset || 0;
      }
    }

    setDragState({
      isDragging: true,
      snappedX: initX === 0,
      snappedY: initY === 0,
      element: elementKey || pageId
    });

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      // Translate pixels to points
      const scalePointsPerPx = (activeTrimSize.height * 72) / previewHeight;
      let targetX = initX + (dx * scalePointsPerPx);
      let targetY = initY + (dy * scalePointsPerPx);

      // Snap to center: 8-point snapping threshold
      let isSnapX = false;
      let isSnapY = false;

      if (Math.abs(targetX) < 8) {
        targetX = 0;
        isSnapX = true;
      }
      if (Math.abs(targetY) < 8) {
        targetY = 0;
        isSnapY = true;
      }

      setDragState({
        isDragging: true,
        snappedX: isSnapX,
        snappedY: isSnapY,
        element: elementKey || pageId
      });

      if (pageId) {
        updatePageTransform(pageId, { xOffset: targetX, yOffset: targetY });
      } else {
        if (elementKey === 'front') {
          updateFrontCoverTransform({ xOffset: targetX, yOffset: targetY });
        } else if (elementKey === 'back') {
          updateBackCoverTransform({ xOffset: targetX, yOffset: targetY });
        } else if (elementKey === 'spine') {
          updateSpineImageTransform({ xOffset: targetX, yOffset: targetY });
        }
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setDragState({
        isDragging: false,
        snappedX: false,
        snappedY: false,
        element: null
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Helper to render Smart Guides
  const renderSmartGuides = (elementKey) => {
    if (!dragState.isDragging || dragState.element !== elementKey) return null;

    return (
      <div className="absolute inset-0 pointer-events-none z-30">
        {/* Horizontal Guide Axis */}
        <div 
          className={`absolute top-1/2 left-0 right-0 h-[1.5px] -translate-y-1/2 transition-colors ${
            dragState.snappedY ? 'bg-emerald-500 shadow-xs animate-pulse' : 'bg-indigo-500/50 border-t border-dashed border-indigo-400'
          }`} 
        />
        {/* Vertical Guide Axis */}
        <div 
          className={`absolute left-1/2 top-0 bottom-0 w-[1.5px] -translate-x-1/2 transition-colors ${
            dragState.snappedX ? 'bg-emerald-500 shadow-xs animate-pulse' : 'bg-indigo-500/50 border-l border-dashed border-indigo-400'
          }`} 
        />
      </div>
    );
  };

  // Active transform variables
  let activeTransform = { xScale: 1.0, yScale: 1.0, xOffset: 0, yOffset: 0 };

  if (activeTab === 'cover') {
    if (selectedElement === 'front' && frontCover) {
      activeTransform = frontCover;
    } else if (selectedElement === 'back' && backCover) {
      activeTransform = backCover;
    } else if (selectedElement === 'spine' && spineImage) {
      activeTransform = spineImage;
    }
  } else if (activeTab === 'interior2d') {
    const selectedPage = interiorPages.find(p => p.id === selectedPageId);
    if (selectedPage) {
      activeTransform = selectedPage;
    }
  }

  const handlePropChange = (key, value) => {
    let numVal = parseFloat(value);
    if (isNaN(numVal)) return;

    if (key === 'xScale' || key === 'yScale') {
      numVal = Math.max(0.1, Math.min(5.0, numVal));
    } else if (key === 'xOffset' || key === 'yOffset') {
      numVal = Math.max(-2000, Math.min(2000, numVal));
    }

    const updates = { [key]: numVal };

    if (activeTab === 'cover') {
      if (selectedElement === 'front') {
        updateFrontCoverTransform(updates);
      } else if (selectedElement === 'back') {
        updateBackCoverTransform(updates);
      } else if (selectedElement === 'spine') {
        updateSpineImageTransform(updates);
      }
    } else if (activeTab === 'interior2d' && selectedPageId) {
      updatePageTransform(selectedPageId, updates);
    }
  };

  const handleScaleChange = (type, value) => {
    handlePropChange(type, value);
  };

  const resetActiveTransform = () => {
    const updates = { xOffset: 0, yOffset: 0, xScale: 1.0, yScale: 1.0 };
    if (activeTab === 'cover') {
      if (selectedElement === 'front') updateFrontCoverTransform(updates);
      else if (selectedElement === 'back') updateBackCoverTransform(updates);
      else if (selectedElement === 'spine') updateSpineImageTransform(updates);
    } else if (activeTab === 'interior2d' && selectedPageId) {
      updatePageTransform(selectedPageId, updates);
    }
  };

  // Base dimensions calculation
  let baseW = activeTrimSize.width;
  let baseH = activeTrimSize.height;

  if (activeTab === 'cover') {
    if (selectedElement === 'front' || selectedElement === 'back') {
      baseW = activeTrimSize.width + 0.125;
      baseH = activeTrimSize.height + 0.25;
    } else if (selectedElement === 'spine') {
      baseW = spineWidth;
      baseH = activeTrimSize.height + 0.25;
    }
  } else if (activeTab === 'interior2d') {
    baseW = activeTrimSize.width + (hasBleed ? 0.125 : 0);
    baseH = activeTrimSize.height + (hasBleed ? 0.25 : 0);
  }

  // Active units conversion helpers
  const isPx = unit === 'px';
  const baseWVal = isPx ? baseW * 300 : baseW;
  const baseHVal = isPx ? baseH * 300 : baseH;
  const unitLabel = isPx ? 'px' : 'in';

  // Current physical dimensions
  const currentW = baseWVal * (activeTransform.xScale || 1.0);
  const currentH = baseHVal * (activeTransform.yScale || 1.0);

  // Offset values in active units
  const pointsToUnits = isPx ? 300 / 72 : 1 / 72;
  const unitsToPoints = isPx ? 72 / 300 : 72;

  const currentXOffset = (activeTransform.xOffset || 0) * pointsToUnits;
  const currentYOffset = (activeTransform.yOffset || 0) * pointsToUnits;

  // Calculate dynamic active physical dimensions (Requirement 3)
  const getActivePhysicalDimensions = () => {
    if (isPx) {
      return {
        width: `${Math.round(currentW)} px`,
        height: `${Math.round(currentH)} px`
      };
    } else {
      return {
        width: `${currentW.toFixed(3)} in`,
        height: `${currentH.toFixed(3)} in`
      };
    }
  };

  const activeDims = getActivePhysicalDimensions();

  return (
    <div className="space-y-4">
      {/* Tab Controller Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs gap-3">
        <div className="flex items-center gap-3 px-1">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Предпросмотр
            </h3>
            <p className="text-[10px] text-slate-400">
              Выделен: {activeTab === 'cover' ? `Обложка (${selectedElement})` : `Страница (2D)`} — {activeDims.width} × {activeDims.height}
            </p>
          </div>
        </div>

        {/* Action tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
          <button
            onClick={() => setActiveTab('cover')}
            type="button"
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cover'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Редактор обложки</span>
          </button>
          
          <button
            onClick={() => setActiveTab('interior2d')}
            type="button"
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'interior2d'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>2D Страницы</span>
          </button>

          <button
            onClick={() => setActiveTab('interior3d')}
            type="button"
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'interior3d'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent'
            }`}
          >
            <Book className="w-3.5 h-3.5" />
            <span>3D Книга</span>
          </button>
        </div>
      </div>

      {/* Editor Canvas Container (Requirement 3: Reworked Sliders to encase center canvas) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden select-none">
        
        {/* Reset coordinates float button */}
        {activeTab !== 'interior3d' && (
          <button
            onClick={resetActiveTransform}
            className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all shadow-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Сбросить сдвиг</span>
          </button>
        )}

        {/* CAD-like Flex Workspace with Horizontal and Vertical Sliders */}
        <div className="flex flex-row items-center gap-6 justify-center max-w-full">
          
          {/* Main Drawing Area Column */}
          <div className="flex flex-col items-center gap-4">
            
            {/* Tab 1: Cover Spread Editor */}
            {activeTab === 'cover' && (
              <div 
                className="relative flex border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden shadow-lg transition-all max-w-full"
                style={{ height: `${previewHeight}px` }}
                ref={canvasRef}
              >
                {/* Back Cover Block */}
                <div 
                  onMouseDown={(e) => {
                    setSelectedElement('back');
                    if (backCover) handleDragStart(e, 'back');
                  }}
                  className={`relative flex items-center justify-center border-r border-dashed border-slate-300 dark:border-slate-700 cursor-pointer overflow-hidden transition-all ${
                    selectedElement === 'back' ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                  }`}
                  style={{ width: `${previewWidth}px` }}
                >
                  {backCover ? (
                    <PreviewImage
                      src={backCover.preview}
                      xScale={backCover.xScale}
                      yScale={backCover.yScale}
                      xOffset={backCover.xOffset}
                      yOffset={backCover.yOffset}
                      containerWidth={previewWidth}
                      containerHeight={previewHeight}
                      isDragging={dragState.isDragging && selectedElement === 'back'}
                      isBleedEnabled={true}
                      isCover={true}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 uppercase">Back Cover</span>
                  )}
                  {/* Guidelines */}
                  <div className="absolute inset-1 border border-red-500/30 border-dashed pointer-events-none" />
                  <div className="absolute inset-3 border border-indigo-500/20 pointer-events-none" />
                  {renderSmartGuides('back')}
                </div>

                {/* Dynamic Spine Block */}
                <div
                  onMouseDown={(e) => {
                    setSelectedElement('spine');
                    if (spineImage && pageCount >= 79) handleDragStart(e, 'spine');
                  }}
                  className={`relative flex items-center justify-center overflow-hidden cursor-pointer ${
                    selectedElement === 'spine' ? 'ring-2 ring-indigo-500 ring-inset' : ''
                  }`}
                  style={{
                    backgroundColor: spineColor,
                    width: `${spinePxWidth}px`
                  }}
                >
                  {spineImage && pageCount >= 79 ? (
                    <PreviewImage
                      src={spineImage.preview}
                      xScale={spineImage.xScale}
                      yScale={spineImage.yScale}
                      xOffset={spineImage.xOffset}
                      yOffset={spineImage.yOffset}
                      containerWidth={spinePxWidth}
                      containerHeight={previewHeight}
                      isDragging={dragState.isDragging && selectedElement === 'spine'}
                      isBleedEnabled={true}
                      isCover={true}
                    />
                  ) : spineText && pageCount >= 79 ? (
                    <span
                      className="whitespace-nowrap font-bold text-xs uppercase tracking-widest rotate-90 select-none pointer-events-none"
                      style={{ color: spineTextColor }}
                    >
                      {spineText}
                    </span>
                  ) : null}
                  {renderSmartGuides('spine')}
                </div>

                {/* Front Cover Block */}
                <div 
                  onMouseDown={(e) => {
                    setSelectedElement('front');
                    if (frontCover) handleDragStart(e, 'front');
                  }}
                  className={`relative flex items-center justify-center border-l border-dashed border-slate-300 dark:border-slate-700 cursor-pointer overflow-hidden transition-all ${
                    selectedElement === 'front' ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                  }`}
                  style={{ width: `${previewWidth}px` }}
                >
                  {frontCover ? (
                    <PreviewImage
                      src={frontCover.preview}
                      xScale={frontCover.xScale}
                      yScale={frontCover.yScale}
                      xOffset={frontCover.xOffset}
                      yOffset={frontCover.yOffset}
                      containerWidth={previewWidth}
                      containerHeight={previewHeight}
                      isDragging={dragState.isDragging && selectedElement === 'front'}
                      isBleedEnabled={true}
                      isCover={true}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 uppercase">Front Cover</span>
                  )}
                  {/* Guidelines */}
                  <div className="absolute inset-1 border border-red-500/30 border-dashed pointer-events-none" />
                  <div className="absolute inset-3 border border-indigo-500/20 pointer-events-none" />
                  {renderSmartGuides('front')}
                </div>

                {/* Demo watermark */}
                {isDemoMode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/5 z-20">
                    <span className="text-4xl font-extrabold text-red-500/30 uppercase -rotate-12 tracking-widest select-none">
                      DEMO MODE
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: 2D Page Spread Editor */}
            {activeTab === 'interior2d' && (
              <div className="flex flex-col items-center space-y-4">
                {spreads.length > 0 && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 border border-slate-205 dark:border-slate-800 rounded-xl">
                    <button
                      disabled={activeSpreadIndex === 0}
                      onClick={() => {
                        setActiveSpreadIndex(prev => prev - 1);
                        const leftPage = spreads[activeSpreadIndex - 1]?.left;
                        const rightPage = spreads[activeSpreadIndex - 1]?.right;
                        if (rightPage && !rightPage.isBlank) setSelectedPageId(rightPage.id);
                        else if (leftPage && !leftPage.isBlank) setSelectedPageId(leftPage.id);
                      }}
                      className="p-1 text-xs font-bold disabled:opacity-30 cursor-pointer"
                    >
                      ◀
                    </button>
                    <span className="text-[10px] font-bold px-2 text-slate-700 dark:text-slate-300">
                      Разворот {activeSpreadIndex + 1} / {spreads.length}
                    </span>
                    <button
                      disabled={activeSpreadIndex === spreads.length - 1}
                      onClick={() => {
                        setActiveSpreadIndex(prev => prev + 1);
                        const leftPage = spreads[activeSpreadIndex + 1]?.left;
                        const rightPage = spreads[activeSpreadIndex + 1]?.right;
                        if (rightPage && !rightPage.isBlank) setSelectedPageId(rightPage.id);
                        else if (leftPage && !leftPage.isBlank) setSelectedPageId(leftPage.id);
                      }}
                      className="p-1 text-xs font-bold disabled:opacity-30 cursor-pointer"
                    >
                      ▶
                    </button>
                  </div>
                )}

                {spreads.length === 0 ? (
                  <div className="text-center p-12 text-slate-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">Страницы не загружены</p>
                  </div>
                ) : (
                  <div 
                    className="relative flex border border-slate-205 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden shadow-lg transition-all max-w-full"
                    style={{ height: `${previewHeight}px` }}
                  >
                    {/* Left side */}
                    {(() => {
                      const leftPage = spreads[activeSpreadIndex]?.left;
                      if (!leftPage) {
                        return (
                          <div 
                            className="bg-slate-100/30 dark:bg-slate-950/20 border-r border-slate-200 dark:border-slate-800"
                            style={{ width: `${previewWidth}px` }}
                          />
                        );
                      }
                      return (
                        <div
                          onMouseDown={(e) => {
                            if (leftPage.isBlank) return;
                            setSelectedPageId(leftPage.id);
                            handleDragStart(e, null, leftPage.id);
                          }}
                          className={`relative flex items-center justify-center border-r border-slate-200 dark:border-slate-800 cursor-pointer overflow-hidden transition-all ${
                            selectedPageId === leftPage.id ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                          }`}
                          style={{ width: `${previewWidth}px` }}
                        >
                          {leftPage.isBlank ? (
                            <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-600 bg-slate-100/50 dark:bg-slate-950/30 h-full w-full">
                              <BookOpen className="w-8 h-8 opacity-40 mb-1" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">Пустая страница</span>
                            </div>
                          ) : (
                            <PreviewImage
                              src={leftPage.preview}
                              xScale={leftPage.xScale}
                              yScale={leftPage.yScale}
                              xOffset={leftPage.xOffset}
                              yOffset={leftPage.yOffset}
                              containerWidth={previewWidth}
                              containerHeight={previewHeight}
                              isDragging={dragState.isDragging && selectedPageId === leftPage.id}
                              isBleedEnabled={hasBleed}
                              isCover={false}
                              isOdd={false}
                            />
                          )}
                          
                          <div className="absolute inset-1 border border-red-500/20 border-dashed pointer-events-none" />
                          <div className="absolute inset-3 border border-indigo-500/10 pointer-events-none" />
                          {!leftPage.isBlank && renderSmartGuides(leftPage.id)}
                        </div>
                      );
                    })()}

                    {/* Right side */}
                    {(() => {
                      const rightPage = spreads[activeSpreadIndex]?.right;
                      if (!rightPage) {
                        return (
                          <div 
                            className="bg-slate-100/30 dark:bg-slate-950/20 border-l border-slate-200 dark:border-slate-800"
                            style={{ width: `${previewWidth}px` }}
                          />
                        );
                      }
                      return (
                        <div
                          onMouseDown={(e) => {
                            if (rightPage.isBlank) return;
                            setSelectedPageId(rightPage.id);
                            handleDragStart(e, null, rightPage.id);
                          }}
                          className={`relative flex items-center justify-center border-l border-slate-250 dark:border-slate-850 cursor-pointer overflow-hidden transition-all ${
                            selectedPageId === rightPage.id ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                          }`}
                          style={{ width: `${previewWidth}px` }}
                        >
                          {rightPage.isBlank ? (
                            <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-600 bg-slate-100/50 dark:bg-slate-950/30 h-full w-full">
                              <BookOpen className="w-8 h-8 opacity-40 mb-1" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">Пустая страница</span>
                            </div>
                          ) : (
                            <PreviewImage
                              src={rightPage.preview}
                              xScale={rightPage.xScale}
                              yScale={rightPage.yScale}
                              xOffset={rightPage.xOffset}
                              yOffset={rightPage.yOffset}
                              containerWidth={previewWidth}
                              containerHeight={previewHeight}
                              isDragging={dragState.isDragging && selectedPageId === rightPage.id}
                              isBleedEnabled={hasBleed}
                              isCover={false}
                              isOdd={true}
                            />
                          )}
                          
                          <div className="absolute inset-1 border border-red-500/20 border-dashed pointer-events-none" />
                          <div className="absolute inset-3 border border-indigo-500/10 pointer-events-none" />
                          {!rightPage.isBlank && renderSmartGuides(rightPage.id)}
                        </div>
                      );
                    })()}

                    {/* Demo watermark */}
                    {isDemoMode && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/5 z-20">
                        <span className="text-4xl font-extrabold text-red-500/30 uppercase -rotate-12 tracking-widest select-none">
                          DEMO MODE
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: HTMLFlipBook 3D Preview */}
            {activeTab === 'interior3d' && (
              <div className="flex justify-center items-center py-2 max-w-full overflow-hidden">
                <HTMLFlipBook
                  width={previewWidth}
                  height={previewHeight}
                  size="fixed"
                  minWidth={200}
                  maxWidth={600}
                  minHeight={250}
                  maxHeight={600}
                  showCover={true}
                  flippingTime={600}
                  className="shadow-2xl border border-slate-100 dark:border-slate-850 rounded-lg"
                  ref={flipBookRef}
                >
                  {frontCover ? (
                    <div className="bg-white relative h-full w-full overflow-hidden border border-slate-200">
                      <PreviewImage
                        src={frontCover.preview}
                        xScale={frontCover.xScale}
                        yScale={frontCover.yScale}
                        xOffset={frontCover.xOffset}
                        yOffset={frontCover.yOffset}
                        containerWidth={previewWidth}
                        containerHeight={previewHeight}
                        isDragging={false}
                        isBleedEnabled={true}
                        isCover={true}
                      />
                    </div>
                  ) : (
                    <div className="bg-white border-l border-slate-200 shadow-sm relative h-full w-full overflow-hidden">
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 text-slate-400">
                        <BookOpen className="w-12 h-12 mb-2 opacity-35" />
                        <span className="text-xs font-extrabold uppercase">Передняя обложка</span>
                      </div>
                    </div>
                  )}

                  {compiledPages.map((page, idx) => (
                    <div key={page.id || idx} className="bg-white relative h-full w-full overflow-hidden border border-slate-200">
                      {page.isBlank ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-100/50 text-slate-400">
                          <BookOpen className="w-12 h-12 mb-2 opacity-35" />
                          <span className="text-xs font-extrabold uppercase">Blank Page</span>
                        </div>
                      ) : (
                        <PreviewImage
                          src={page.preview}
                          xScale={page.xScale}
                          yScale={page.yScale}
                          xOffset={page.xOffset}
                          yOffset={page.yOffset}
                          containerWidth={previewWidth}
                          containerHeight={previewHeight}
                          isDragging={false}
                          isBleedEnabled={hasBleed}
                          isCover={false}
                          isOdd={idx % 2 !== 0}
                        />
                      )}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 font-mono">
                        {idx + 1}
                      </div>
                    </div>
                  ))}

                  {backCover ? (
                    <div className="bg-white relative h-full w-full overflow-hidden border border-slate-200">
                      <PreviewImage
                        src={backCover.preview}
                        xScale={backCover.xScale}
                        yScale={backCover.yScale}
                        xOffset={backCover.xOffset}
                        yOffset={backCover.yOffset}
                        containerWidth={previewWidth}
                        containerHeight={previewHeight}
                        isDragging={false}
                        isBleedEnabled={true}
                        isCover={true}
                      />
                    </div>
                  ) : (
                    <div className="bg-white border-r border-slate-200 shadow-sm relative h-full w-full overflow-hidden">
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 text-slate-400">
                        <BookOpen className="w-12 h-12 mb-2 opacity-35" />
                        <span className="text-xs font-extrabold uppercase">Задняя обложка</span>
                      </div>
                    </div>
                  )}
                </HTMLFlipBook>
              </div>
            )}

          </div>

        </div>

        {/* Control Panel: Transforms, Scale, Offsets */}
        {activeTab !== 'interior3d' && (
          <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 mt-6 rounded-2xl shadow-2xs space-y-4 max-w-4xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Инструменты коррекции ({activeTab === 'cover' ? `Элемент: ${selectedElement}` : 'Активная страница'})
              </span>
              <button
                onClick={resetActiveTransform}
                type="button"
                className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-all bg-transparent border-0"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Сбросить сдвиг</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Control 1: Width Scale */}
              <div className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-3 rounded-xl text-left">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Ширина ({unitLabel})</span>
                  <InputField
                    min={0.1 * baseWVal}
                    max={5.0 * baseWVal}
                    step={isPx ? 1 : 0.001}
                    value={parseFloat(Number(currentW).toFixed(isPx ? 0 : 3))}
                    onChange={(val) => handlePropChange('xScale', val / baseWVal)}
                  />
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  Базовый размер: {baseWVal.toFixed(3)} {unitLabel}
                </div>
                <input
                  type="range"
                  min={0.1 * baseWVal}
                  max={3.0 * baseWVal}
                  step={isPx ? 1 : 0.01}
                  value={currentW}
                  onChange={(e) => handlePropChange('xScale', parseFloat(e.target.value) / baseWVal)}
                  className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
              </div>

              {/* Control 2: Height Scale */}
              <div className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-3 rounded-xl text-left">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Высота ({unitLabel})</span>
                  <InputField
                    min={0.1 * baseHVal}
                    max={5.0 * baseHVal}
                    step={isPx ? 1 : 0.001}
                    value={parseFloat(Number(currentH).toFixed(isPx ? 0 : 3))}
                    onChange={(val) => handlePropChange('yScale', val / baseHVal)}
                  />
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  Базовый размер: {baseHVal.toFixed(3)} {unitLabel}
                </div>
                <input
                  type="range"
                  min={0.1 * baseHVal}
                  max={3.0 * baseHVal}
                  step={isPx ? 1 : 0.01}
                  value={currentH}
                  onChange={(e) => handlePropChange('yScale', parseFloat(e.target.value) / baseHVal)}
                  className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
              </div>

              {/* Control 3: Offset X */}
              <div className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-3 rounded-xl text-left">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Смещение X ({unitLabel})</span>
                  <InputField
                    min={isPx ? -2000 : -10.0}
                    max={isPx ? 2000 : 10.0}
                    step={isPx ? 1 : 0.001}
                    value={parseFloat(Number(currentXOffset).toFixed(isPx ? 0 : 3))}
                    onChange={(val) => handlePropChange('xOffset', val / pointsToUnits)}
                  />
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  Сдвиг по горизонтали
                </div>
                <input
                  type="range"
                  min={isPx ? -1000 : -3.0}
                  max={isPx ? 1000 : 3.0}
                  step={isPx ? 1 : 0.01}
                  value={currentXOffset}
                  onChange={(e) => handlePropChange('xOffset', parseFloat(e.target.value) / pointsToUnits)}
                  className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
              </div>

              {/* Control 4: Offset Y */}
              <div className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-3 rounded-xl text-left">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Смещение Y ({unitLabel})</span>
                  <InputField
                    min={isPx ? -2000 : -10.0}
                    max={isPx ? 2000 : 10.0}
                    step={isPx ? 1 : 0.001}
                    value={parseFloat(Number(currentYOffset).toFixed(isPx ? 0 : 3))}
                    onChange={(val) => handlePropChange('yOffset', val / pointsToUnits)}
                  />
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  Сдвиг по вертикали
                </div>
                <input
                  type="range"
                  min={isPx ? -1000 : -3.0}
                  max={isPx ? 1000 : 3.0}
                  step={isPx ? 1 : 0.01}
                  value={currentYOffset}
                  onChange={(e) => handlePropChange('yOffset', parseFloat(e.target.value) / pointsToUnits)}
                  className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
