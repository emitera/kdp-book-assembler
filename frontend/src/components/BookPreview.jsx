import React, { useState, useRef, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { calculateSpineWidth, calculateCoverDimensions, inchesToPoints } from '../utils/kdpMath';
import { Eye, BookOpen, AlertTriangle, Layers, Book, Move, Sliders, Check, Lock, RotateCcw } from 'lucide-react';

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

  const handleScaleChange = (type, value) => {
    const numericVal = parseFloat(value);
    const updates = {};
    
    if (type === 'xScale') {
      updates.xScale = numericVal;
    } else if (type === 'yScale') {
      updates.yScale = numericVal;
    }

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

  // Calculate dynamic active physical dimensions (Requirement 3)
  const getActivePhysicalDimensions = () => {
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

    const currentW = baseW * (activeTransform.xScale || 1.0);
    const currentH = baseH * (activeTransform.yScale || 1.0);

    if (unit === 'px') {
      return {
        width: `${Math.round(currentW * 300)} px`,
        height: `${Math.round(currentH * 300)} px`
      };
    } else {
      return {
        width: `${currentW.toFixed(2)} in`,
        height: `${currentH.toFixed(2)} in`
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
                    <div 
                      className="w-full h-full relative"
                      style={{
                        transform: `translate(${backCover.xOffset / 2}px, ${backCover.yOffset / 2}px) scale(${backCover.xScale || 1.0}, ${backCover.yScale || 1.0})`,
                        transformOrigin: 'center center',
                        transition: dragState.isDragging ? 'none' : 'transform 0.15s ease'
                      }}
                    >
                      <img src={backCover.preview} alt="Back Cover" className="w-full h-full object-cover pointer-events-none" />
                    </div>
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
                    <div 
                      className="w-full h-full relative"
                      style={{
                        transform: `translate(${spineImage.xOffset / 2}px, ${spineImage.yOffset / 2}px) scale(${spineImage.xScale || 1.0}, ${spineImage.yScale || 1.0})`,
                        transformOrigin: 'center center',
                        transition: dragState.isDragging ? 'none' : 'transform 0.15s ease'
                      }}
                    >
                      <img src={spineImage.preview} alt="Spine" className="w-full h-full object-cover pointer-events-none" />
                    </div>
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
                    <div 
                      className="w-full h-full relative"
                      style={{
                        transform: `translate(${frontCover.xOffset / 2}px, ${frontCover.yOffset / 2}px) scale(${frontCover.xScale || 1.0}, ${frontCover.yScale || 1.0})`,
                        transformOrigin: 'center center',
                        transition: dragState.isDragging ? 'none' : 'transform 0.15s ease'
                      }}
                    >
                      <img src={frontCover.preview} alt="Front Cover" className="w-full h-full object-cover pointer-events-none" />
                    </div>
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
                            <div 
                              className="w-full h-full relative"
                              style={{
                                transform: `translate(${leftPage.xOffset / 2}px, ${leftPage.yOffset / 2}px) scale(${leftPage.xScale || 1.0}, ${leftPage.yScale || 1.0})`,
                                transformOrigin: 'center center',
                                transition: dragState.isDragging ? 'none' : 'transform 0.15s ease'
                              }}
                            >
                              <img src={leftPage.preview} alt="Left page" className="w-full h-full object-cover pointer-events-none" />
                            </div>
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
                            <div 
                              className="w-full h-full relative"
                              style={{
                                transform: `translate(${rightPage.xOffset / 2}px, ${rightPage.yOffset / 2}px) scale(${rightPage.xScale || 1.0}, ${rightPage.yScale || 1.0})`,
                                transformOrigin: 'center center',
                                transition: dragState.isDragging ? 'none' : 'transform 0.15s ease'
                              }}
                            >
                              <img src={rightPage.preview} alt="Right page" className="w-full h-full object-cover pointer-events-none" />
                            </div>
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
                  <div className="bg-white border-l border-slate-200 shadow-sm relative h-full w-full overflow-hidden">
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 text-slate-400">
                      <BookOpen className="w-12 h-12 mb-2 opacity-35" />
                      <span className="text-xs font-extrabold uppercase">KDP TITLE INNER</span>
                    </div>
                  </div>

                  {compiledPages.map((page, idx) => (
                    <div key={page.id || idx} className="bg-white relative h-full w-full overflow-hidden border border-slate-200">
                      {page.isBlank ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-100/50 text-slate-400">
                          <BookOpen className="w-12 h-12 mb-2 opacity-35" />
                          <span className="text-xs font-extrabold uppercase">Blank Page</span>
                        </div>
                      ) : (
                        <img 
                          src={page.preview} 
                          alt="Interior spread" 
                          className="w-full h-full object-cover pointer-events-none" 
                          style={{
                            transform: `translate(${page.xOffset / 2}px, ${page.yOffset / 2}px) scale(${page.xScale || 1.0}, ${page.yScale || 1.0})`,
                            transformOrigin: 'center center'
                          }}
                        />
                      )}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 font-mono">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </HTMLFlipBook>
              </div>
            )}

            {/* Horizontal Slider: Width Scale (Placed below center canvas) */}
            {activeTab !== 'interior3d' && (
              <div className="w-full max-w-[280px] sm:max-w-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl flex flex-col gap-1.5 shadow-2xs">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                  <span>Ширина (X Scale)</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{activeDims.width}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.01"
                  value={activeTransform.xScale}
                  onChange={(e) => handleScaleChange('xScale', e.target.value)}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
              </div>
            )}

          </div>

          {/* Vertical Slider: Height Scale (Placed on the right side of the canvas) */}
          {activeTab !== 'interior3d' && (
            <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs h-72 self-center gap-3">
              <div className="text-[10px] font-extrabold text-slate-550 dark:text-slate-400 uppercase tracking-wider [writing-mode:vertical-lr] rotate-180 text-center">
                Высота (Y): {activeDims.height}
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.01"
                value={activeTransform.yScale}
                onChange={(e) => handleScaleChange('yScale', e.target.value)}
                style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                className="h-44 w-1 bg-slate-205 dark:bg-slate-800 rounded-lg appearance-none cursor-ns-resize accent-indigo-650"
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
