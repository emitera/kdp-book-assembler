import React, { useState, useRef, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { calculateSpineWidth, calculateCoverDimensions, calculateInteriorDimensions } from '../utils/kdpMath';
import { Eye, BookOpen, AlertTriangle, Layers, Book, Move, Sliders, Check, Lock, RotateCcw, ZoomIn, ZoomOut, Crop, Maximize2, Minimize2, Info, AlertCircle, X } from 'lucide-react';
import LegendPanel from './LegendPanel';

export const guideStyles = {
  bleed: {
    borderColor: '#ef4444',
    filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.85))'
  },
  safe: {
    borderColor: '#6366f1',
    filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.85))'
  },
  gutter: {
    borderColor: '#0284c7',
    filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.85))'
  },
  barcode: {
    borderColor: '#f59e0b',
    filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.85))'
  }
};

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

const ResizeHandles = ({
  xScale = 1.0,
  yScale = 1.0,
  xOffset = 0,
  yOffset = 0,
  containerWidth,
  containerHeight,
  aspectRatio,
  onResizeStart
}) => {
  if (!aspectRatio) return null;

  const containerRatio = containerWidth / containerHeight;
  let imgWidth, imgHeight;
  if (aspectRatio > containerRatio) {
    imgWidth = containerWidth;
    imgHeight = containerWidth / aspectRatio;
  } else {
    imgHeight = containerHeight;
    imgWidth = containerHeight * aspectRatio;
  }

  const w_box = imgWidth * xScale;
  const h_box = imgHeight * yScale;
  const cx = containerWidth / 2 + (xOffset / 2);
  const cy = containerHeight / 2 + (yOffset / 2);

  const left = cx - w_box / 2;
  const top = cy - h_box / 2;

  return (
    <div 
      className="absolute border-2 border-indigo-500 pointer-events-none z-30"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${w_box}px`,
        height: `${h_box}px`
      }}
    >
      {/* Top Left */}
      <div 
        onMouseDown={(e) => onResizeStart(e, 'tl', imgWidth, imgHeight)}
        className="absolute w-3 h-3 bg-indigo-600 border border-white rounded-full cursor-nwse-resize -top-1.5 -left-1.5 pointer-events-auto shadow-sm"
      />
      {/* Top Right */}
      <div 
        onMouseDown={(e) => onResizeStart(e, 'tr', imgWidth, imgHeight)}
        className="absolute w-3 h-3 bg-indigo-600 border border-white rounded-full cursor-nesw-resize -top-1.5 -right-1.5 pointer-events-auto shadow-sm"
      />
      {/* Bottom Left */}
      <div 
        onMouseDown={(e) => onResizeStart(e, 'bl', imgWidth, imgHeight)}
        className="absolute w-3 h-3 bg-indigo-600 border border-white rounded-full cursor-nesw-resize -bottom-1.5 -left-1.5 pointer-events-auto shadow-sm"
      />
      {/* Bottom Right */}
      <div 
        onMouseDown={(e) => onResizeStart(e, 'br', imgWidth, imgHeight)}
        className="absolute w-3 h-3 bg-indigo-600 border border-white rounded-full cursor-nwse-resize -bottom-1.5 -right-1.5 pointer-events-auto shadow-sm"
      />
    </div>
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
  isSelected = false,
  onResizeStart = null,
  onAspectRatioLoaded = null
}) => {
  const [aspectRatio, setAspectRatio] = useState(null);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      const ratio = naturalWidth / naturalHeight;
      setAspectRatio(ratio);
      if (onAspectRatioLoaded) {
        onAspectRatioLoaded(ratio, naturalWidth, naturalHeight);
      }
    }
  };

  if (!aspectRatio) {
    return (
      <img
        src={src}
        onLoad={handleImageLoad}
        alt="Loading..."
        className="w-full h-full object-contain pointer-events-none opacity-0"
      />
    );
  }

  // Strictly calculate aspect-ratio contain dimensions based on canvas container
  const containerRatio = containerWidth / containerHeight;
  let imgWidth, imgHeight;
  if (aspectRatio > containerRatio) {
    imgWidth = containerWidth;
    imgHeight = containerWidth / aspectRatio;
  } else {
    imgHeight = containerHeight;
    imgWidth = containerHeight * aspectRatio;
  }

  const style = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: `${imgWidth}px`,
    height: `${imgHeight}px`,
    marginLeft: `${-imgWidth / 2}px`,
    marginTop: `${-imgHeight / 2}px`,
    transform: `translate(${xOffset / 2}px, ${yOffset / 2}px) scale(${xScale}, ${yScale})`,
    transformOrigin: 'center center',
    maxWidth: 'none',
    maxHeight: 'none',
    pointerEvents: 'none',
    transition: isDragging ? 'none' : 'transform 0.15s ease'
  };

  return (
    <>
      <img
        src={src}
        onLoad={handleImageLoad}
        alt="Previewing"
        style={style}
      />
      {isSelected && onResizeStart && (
        <ResizeHandles
          xScale={xScale}
          yScale={yScale}
          xOffset={xOffset}
          yOffset={yOffset}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          aspectRatio={aspectRatio}
          onResizeStart={onResizeStart}
        />
      )}
    </>
  );
};

export default function BookPreview() {
  const { t } = useTranslation();
  const {
    bindingType,
    coverType,
    trimSizeId,
    frontCover,
    backCover,
    fullCover,
    spineImage,
    interiorPages,
    spineColor,
    spineText,
    spineTextColor,
    spineTextDirection,
    activeTrimSize,
    activePaperType,
    hasBleed,
    isSingleSided,
    addBlankAtStart,
    isDemoMode,
    unit,
    updateFrontCoverTransform,
    updateBackCoverTransform,
    updateFullCoverTransform,
    updateSpineImageTransform,
    updatePageTransform
  } = useApp();

  const [activeTab, setActiveTab] = useState('cover'); // 'cover' | 'interior2d' | 'interior3d'
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [selectedElement, setSelectedElement] = useState('front'); // 'front' | 'back' | 'spine' | 'full'
  const [activeSpreadIndex, setActiveSpreadIndex] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [workspaceWidth, setWorkspaceWidth] = useState(1040);

  // High-contrast guides visibility & legend state
  const [showGuides, setShowGuides] = useState(true);

  // Aspect ratio detection map: [elementKey/pageId] -> { ratio, width, height }
  const [imageAspectRatios, setImageAspectRatios] = useState({});

  // Interactive Cover Crop Preview Mode state (Zero-Crop policy: transform only)
  const [cropPreview, setCropPreview] = useState({
    isActive: false,
    elementKey: null, // 'full' | 'front' | 'back' | 'spine'
    pageId: null,     // interior page id
    coverScale: 1.0,
    currentScale: 1.0,
    xOffset: 0,
    yOffset: 0,
    originalTransform: null
  });

  const workspaceRef = useRef(null);
  const flipBookRef = useRef(null);
  const canvasRef = useRef(null);

  const [dragState, setDragState] = useState({
    isDragging: false,
    snappedX: false,
    snappedY: false,
    element: null
  });

  // Track size changes of the workspace area to automatically adapt canvas scale
  useEffect(() => {
    if (!workspaceRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width - 48; // minus padding
        if (width > 200) {
          setWorkspaceWidth(width);
        }
      }
    });
    observer.observe(workspaceRef.current);
    return () => observer.disconnect();
  }, []);

  const userPagesCount = interiorPages.length;
  // If single sided print is selected, actual pages count doubles
  const pageCount = (userPagesCount * (isSingleSided ? 2 : 1)) + (addBlankAtStart ? (isSingleSided ? 2 : 1) : 0);
  const spineWidth = calculateSpineWidth(pageCount, activePaperType.multiplier);

  // Setup initial active page selection when interiorPages are loaded
  useEffect(() => {
    if (interiorPages.length > 0 && !selectedPageId) {
      setSelectedPageId(interiorPages[0].id);
    }
  }, [interiorPages, selectedPageId]);

  // Construct compiled page list for interior spreads
  const getCompiledPages = () => {
    const pages = [];
    if (addBlankAtStart) {
      pages.push({ id: 'blank_start_1', isBlank: true });
      if (isSingleSided) {
        pages.push({ id: 'blank_start_2', isBlank: true });
      }
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

  const getSpreads = () => {
    const spreads = [];
    for (let i = 0; i < compiledPages.length; i += 2) {
      spreads.push({
        left: compiledPages[i],
        right: compiledPages[i + 1] || null
      });
    }
    return spreads;
  };

  const spreads = getSpreads();

  // Reset current active page or cover spread zoom/offsets
  const resetActiveTransform = () => {
    const updates = { xOffset: 0, yOffset: 0, xScale: 1.0, yScale: 1.0 };
    if (activeTab === 'cover') {
      if (coverType === 'full') updateFullCoverTransform(updates);
      else if (selectedElement === 'front') updateFrontCoverTransform(updates);
      else if (selectedElement === 'back') updateBackCoverTransform(updates);
      else if (selectedElement === 'spine') updateSpineImageTransform(updates);
    } else if (activeTab === 'interior2d' && selectedPageId) {
      updatePageTransform(selectedPageId, updates);
    }
  };

  // Base dimensions calculation in inches
  let baseW = activeTrimSize.width;
  let baseH = activeTrimSize.height;

  if (activeTab === 'cover') {
    if (coverType === 'full') {
      if (bindingType === 'hardcover') {
        baseW = (activeTrimSize.width * 2) + spineWidth + (0.591 * 2) + (0.394 * 2);
        baseH = activeTrimSize.height + (0.591 * 2);
      } else {
        baseW = (activeTrimSize.width * 2) + spineWidth + (hasBleed ? 0.25 : 0);
        baseH = activeTrimSize.height + (hasBleed ? 0.25 : 0);
      }
    } else {
      if (selectedElement === 'front' || selectedElement === 'back') {
        if (bindingType === 'hardcover') {
          baseW = activeTrimSize.width + 0.591 + 0.394;
          baseH = activeTrimSize.height + (0.591 * 2);
        } else {
          baseW = activeTrimSize.width + 0.125;
          baseH = activeTrimSize.height + 0.25;
        }
      } else if (selectedElement === 'spine') {
        baseW = spineWidth;
        if (bindingType === 'hardcover') {
          baseH = activeTrimSize.height + (0.591 * 2);
        } else {
          baseH = activeTrimSize.height + 0.25;
        }
      }
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

  // Get active selected transform object
  const getActiveTransform = () => {
    if (activeTab === 'interior2d') {
      const activePg = interiorPages.find(p => p.id === selectedPageId);
      return activePg || { xScale: 1.0, yScale: 1.0, xOffset: 0, yOffset: 0 };
    }
    if (coverType === 'full') {
      return fullCover || { xScale: 1.0, yScale: 1.0, xOffset: 0, yOffset: 0 };
    }
    if (selectedElement === 'front') return frontCover || { xScale: 1.0, yScale: 1.0, xOffset: 0, yOffset: 0 };
    if (selectedElement === 'back') return backCover || { xScale: 1.0, yScale: 1.0, xOffset: 0, yOffset: 0 };
    if (selectedElement === 'spine') return spineImage || { xScale: 1.0, yScale: 1.0, xOffset: 0, yOffset: 0 };
    return { xScale: 1.0, yScale: 1.0, xOffset: 0, yOffset: 0 };
  };

  const activeTransform = getActiveTransform();

  // Current physical dimensions
  const currentW = baseWVal * (activeTransform.xScale || 1.0);
  const currentH = baseHVal * (activeTransform.yScale || 1.0);

  // Offset values in active units
  const pointsToUnits = isPx ? 300 / 72 : 1 / 72;
  const unitsToPoints = isPx ? 72 / 300 : 72;

  const currentXOffset = (activeTransform.xOffset || 0) * pointsToUnits;
  const currentYOffset = (activeTransform.yOffset || 0) * pointsToUnits;

  // Real-time aspect-ratio fit pxPerInch math (Strictly derived from KDP Sidebar parameters)
  const coverDims = calculateCoverDimensions(
    activeTrimSize.width,
    activeTrimSize.height,
    spineWidth,
    hasBleed,
    bindingType
  );
  const totalCoverWidthInches = coverDims.width;
  const coverHeightInches = coverDims.height;

  const pxPerInchCover = (workspaceWidth / totalCoverWidthInches) * zoom;
  const coverCanvasPxWidth = Math.round(totalCoverWidthInches * pxPerInchCover);
  const coverCanvasPxHeight = Math.round(coverHeightInches * pxPerInchCover);
  const spinePxWidth = Math.max(16, Math.round(spineWidth * pxPerInchCover));
  const coverPagePxWidth = Math.round(((totalCoverWidthInches - spineWidth) / 2) * pxPerInchCover);

  const interiorDims = calculateInteriorDimensions(
    activeTrimSize.width,
    activeTrimSize.height,
    hasBleed
  );
  const interiorWidthInches = interiorDims.width;
  const interiorHeightInches = interiorDims.height;
  const totalInteriorWidthInches = interiorWidthInches * 2;

  const pxPerInchInterior = (workspaceWidth / totalInteriorWidthInches) * zoom;
  const interiorPagePxWidth = Math.round(interiorWidthInches * pxPerInchInterior);
  const interiorPreviewHeight = Math.round(interiorHeightInches * pxPerInchInterior);
  const interiorSpreadPxWidth = interiorPagePxWidth * 2;

  // Active preview dimensions depending on tab
  const previewHeight = activeTab === 'cover' ? coverCanvasPxHeight : interiorPreviewHeight;
  const previewWidth = activeTab === 'cover' ? coverPagePxWidth : interiorPagePxWidth;
  const pxPerInch = activeTab === 'cover' ? pxPerInchCover : pxPerInchInterior;

  const getActivePhysicalDimensions = () => {
    if (activeTab === 'cover') {
      if (coverType === 'full') {
        if (!fullCover) return 'Изображение не загружено';
        const inW = baseW * fullCover.xScale;
        const inH = baseH * fullCover.yScale;
        return isPx
          ? `${Math.round(inW * 300)} × ${Math.round(inH * 300)} px (300 DPI)`
          : `${inW.toFixed(3)}" × ${inH.toFixed(3)}"`;
      }
      if (selectedElement === 'front') {
        if (!frontCover) return 'Изображение не загружено';
        const inW = baseW * frontCover.xScale;
        const inH = baseH * frontCover.yScale;
        return isPx
          ? `${Math.round(inW * 300)} × ${Math.round(inH * 300)} px (300 DPI)`
          : `${inW.toFixed(3)}" × ${inH.toFixed(3)}"`;
      }
      if (selectedElement === 'back') {
        if (!backCover) return 'Изображение не загружено';
        const inW = baseW * backCover.xScale;
        const inH = baseH * backCover.yScale;
        return isPx
          ? `${Math.round(inW * 300)} × ${Math.round(inH * 300)} px (300 DPI)`
          : `${inW.toFixed(3)}" × ${inH.toFixed(3)}"`;
      }
      if (selectedElement === 'spine') {
        if (!spineImage) return 'Изображение не загружено';
        const inW = baseW * spineImage.xScale;
        const inH = baseH * spineImage.yScale;
        return isPx
          ? `${Math.round(inW * 300)} × ${Math.round(inH * 300)} px (300 DPI)`
          : `${inW.toFixed(3)}" × ${inH.toFixed(3)}"`;
      }
    } else if (activeTab === 'interior2d' && selectedPageId) {
      const page = interiorPages.find(p => p.id === selectedPageId);
      if (!page) return 'Изображение не загружено';
      const inW = baseW * page.xScale;
      const inH = baseH * page.yScale;
      return isPx
        ? `${Math.round(inW * 300)} × ${Math.round(inH * 300)} px (300 DPI)`
        : `${inW.toFixed(3)}" × ${inH.toFixed(3)}"`;
    }
    return '';
  };

  // Image aspect ratio loader callback
  const handleAspectRatioLoaded = (keyOrPageId, ratio, width, height) => {
    setImageAspectRatios(prev => {
      if (prev[keyOrPageId]?.ratio === ratio) return prev;
      return {
        ...prev,
        [keyOrPageId]: { ratio, width, height }
      };
    });
  };

  // Drag and drop WYSIWYG core handler
  const handleDragStart = (e, elementKey, pageId = null) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;

    const isCropPreviewThis = cropPreview.isActive && (
      (pageId && cropPreview.pageId === pageId) ||
      (!pageId && cropPreview.elementKey === elementKey)
    );

    let initX = 0;
    let initY = 0;

    if (isCropPreviewThis) {
      initX = cropPreview.xOffset || 0;
      initY = cropPreview.yOffset || 0;
    } else if (pageId) {
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
      } else if (elementKey === 'full' && fullCover) {
        initX = fullCover.xOffset || 0;
        initY = fullCover.yOffset || 0;
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
      const scalePointsPerPx = (baseH * 72) / previewHeight;
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

      if (isCropPreviewThis) {
        // PREVIEW MODE: Only update local cropPreview state, do NOT touch AppContext
        setCropPreview(prev => ({
          ...prev,
          xOffset: targetX,
          yOffset: targetY
        }));
      } else if (pageId) {
        updatePageTransform(pageId, { xOffset: targetX, yOffset: targetY });
      } else {
        if (elementKey === 'front') {
          updateFrontCoverTransform({ xOffset: targetX, yOffset: targetY });
        } else if (elementKey === 'back') {
          updateBackCoverTransform({ xOffset: targetX, yOffset: targetY });
        } else if (elementKey === 'spine') {
          updateSpineImageTransform({ xOffset: targetX, yOffset: targetY });
        } else if (elementKey === 'full') {
          updateFullCoverTransform({ xOffset: targetX, yOffset: targetY });
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

  // Interactive Corner-Drag Resize Core Logic
  const handleResizeStart = (e, handle, imgW, imgH, elementKey, pageId = null) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    let initXScale = 1.0;
    let initYScale = 1.0;
    let currentXOffset = 0;
    let currentYOffset = 0;

    if (pageId) {
      const pageObj = interiorPages.find(p => p.id === pageId);
      if (pageObj) {
        initXScale = pageObj.xScale || 1.0;
        initYScale = pageObj.yScale || 1.0;
        currentXOffset = pageObj.xOffset || 0;
        currentYOffset = pageObj.yOffset || 0;
      }
    } else {
      if (elementKey === 'front' && frontCover) {
        initXScale = frontCover.xScale || 1.0;
        initYScale = frontCover.yScale || 1.0;
        currentXOffset = frontCover.xOffset || 0;
        currentYOffset = frontCover.yOffset || 0;
      } else if (elementKey === 'back' && backCover) {
        initXScale = backCover.xScale || 1.0;
        initYScale = backCover.yScale || 1.0;
        currentXOffset = backCover.xOffset || 0;
        currentYOffset = backCover.yOffset || 0;
      } else if (elementKey === 'spine' && spineImage) {
        initXScale = spineImage.xScale || 1.0;
        initYScale = spineImage.yScale || 1.0;
        currentXOffset = spineImage.xOffset || 0;
        currentYOffset = spineImage.yOffset || 0;
      } else if (elementKey === 'full' && fullCover) {
        initXScale = fullCover.xScale || 1.0;
        initYScale = fullCover.yScale || 1.0;
        currentXOffset = fullCover.xOffset || 0;
        currentYOffset = fullCover.yOffset || 0;
      }
    }

    const containerElement = e.target.closest('.cursor-pointer, .overflow-hidden') || e.target.parentElement;
    if (!containerElement) return;

    const rect = containerElement.getBoundingClientRect();
    const cx = rect.width / 2 + (currentXOffset / 2);
    const cy = rect.height / 2 + (currentYOffset / 2);
    const centerX = rect.left + cx;
    const centerY = rect.top + cy;

    const d_start = Math.sqrt(Math.pow(startX - centerX, 2) + Math.pow(startY - centerY, 2));

    const handleMouseMove = (moveEvent) => {
      const curX = moveEvent.clientX;
      const curY = moveEvent.clientY;

      const d_current = Math.sqrt(Math.pow(curX - centerX, 2) + Math.pow(curY - centerY, 2));
      if (d_start < 5) return;

      const k = d_current / d_start;
      
      const newXScale = Math.min(5.0, Math.max(0.1, initXScale * k));
      const newYScale = Math.min(5.0, Math.max(0.1, initYScale * k));

      if (pageId) {
        updatePageTransform(pageId, { xScale: newXScale, yScale: newYScale });
      } else {
        if (elementKey === 'front') {
          updateFrontCoverTransform({ xScale: newXScale, yScale: newYScale });
        } else if (elementKey === 'back') {
          updateBackCoverTransform({ xScale: newXScale, yScale: newYScale });
        } else if (elementKey === 'spine') {
          updateSpineImageTransform({ xScale: newXScale, yScale: newYScale });
        } else if (elementKey === 'full') {
          updateFullCoverTransform({ xScale: newXScale, yScale: newYScale });
        }
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Helper to render Smart Guides
  const renderSmartGuides = (elementKey, pageId = null) => {
    const isDraggingThis = dragState.isDragging && (dragState.element === (elementKey || pageId));
    if (!isDraggingThis) return null;

    return (
      <div className="absolute inset-0 pointer-events-none z-15">
        {dragState.snappedX && (
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-500/80 border-l border-dashed border-emerald-300 dark:border-emerald-600 -translate-x-1/2 shadow-xs" />
        )}
        {dragState.snappedY && (
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-500/80 border-t border-dashed border-emerald-300 dark:border-emerald-600 -translate-y-1/2 shadow-xs" />
        )}
      </div>
    );
  };

  // Active asset and aspect ratio calculation helpers
  const getActiveKey = () => {
    if (activeTab === 'interior2d') return selectedPageId;
    if (coverType === 'full') return 'full';
    return selectedElement;
  };

  const activeKey = getActiveKey();
  const activeImgInfo = imageAspectRatios[activeKey];
  const containerRatio = baseW / baseH;
  const imgRatio = activeImgInfo ? activeImgInfo.ratio : null;
  const ratioDiff = imgRatio ? Math.abs(containerRatio - imgRatio) : 0;
  const isRatioMismatch = ratioDiff > 0.01;
  const calculatedCoverScale = imgRatio ? Math.max(containerRatio / imgRatio, imgRatio / containerRatio) : 1.0;

  // Active asset fit mode
  const activeFitMode = activeTransform.fitMode || (activeTransform.xScale > 1.05 ? 'cover' : 'contain');

  // Mode 1: Contain
  const handleSetContain = () => {
    if (cropPreview.isActive) {
      setCropPreview({ isActive: false, elementKey: null, pageId: null });
    }
    const updates = {
      xScale: 1.0,
      yScale: 1.0,
      xOffset: 0,
      yOffset: 0,
      fitMode: 'contain'
    };
    if (activeTab === 'interior2d' && selectedPageId) {
      updatePageTransform(selectedPageId, updates);
    } else {
      if (coverType === 'full') updateFullCoverTransform(updates);
      else if (selectedElement === 'front') updateFrontCoverTransform(updates);
      else if (selectedElement === 'back') updateBackCoverTransform(updates);
      else if (selectedElement === 'spine') updateSpineImageTransform(updates);
    }
  };

  // Mode 2: Cover Preview Activation (does NOT commit immediately)
  const handleStartCoverPreview = () => {
    setCropPreview({
      isActive: true,
      elementKey: activeTab === 'cover' ? (coverType === 'full' ? 'full' : selectedElement) : null,
      pageId: activeTab === 'interior2d' ? selectedPageId : null,
      coverScale: calculatedCoverScale,
      currentScale: calculatedCoverScale,
      xOffset: activeTransform.xOffset || 0,
      yOffset: activeTransform.yOffset || 0,
      originalTransform: {
        xScale: activeTransform.xScale || 1.0,
        yScale: activeTransform.yScale || 1.0,
        xOffset: activeTransform.xOffset || 0,
        yOffset: activeTransform.yOffset || 0,
        fitMode: activeTransform.fitMode || 'contain'
      }
    });
  };

  // Apply previewed crop (commits transform to AppContext)
  const handleApplyCrop = () => {
    const updates = {
      xScale: cropPreview.currentScale,
      yScale: cropPreview.currentScale,
      xOffset: cropPreview.xOffset,
      yOffset: cropPreview.yOffset,
      fitMode: 'cover'
    };
    if (cropPreview.pageId) {
      updatePageTransform(cropPreview.pageId, updates);
    } else if (cropPreview.elementKey === 'front') {
      updateFrontCoverTransform(updates);
    } else if (cropPreview.elementKey === 'back') {
      updateBackCoverTransform(updates);
    } else if (cropPreview.elementKey === 'spine') {
      updateSpineImageTransform(updates);
    } else if (cropPreview.elementKey === 'full') {
      updateFullCoverTransform(updates);
    }
    setCropPreview({ isActive: false, elementKey: null, pageId: null });
  };

  // Cancel previewed crop (reverts to previous without saving)
  const handleCancelCrop = () => {
    setCropPreview({ isActive: false, elementKey: null, pageId: null });
  };

  const handlePropChange = (key, value) => {
    const updates = { [key]: value };
    if (activeTab === 'interior2d' && selectedPageId) {
      updatePageTransform(selectedPageId, updates);
    } else {
      if (coverType === 'full') {
        updateFullCoverTransform(updates);
      } else {
        if (selectedElement === 'front') updateFrontCoverTransform(updates);
        else if (selectedElement === 'back') updateBackCoverTransform(updates);
        else if (selectedElement === 'spine') updateSpineImageTransform(updates);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar and view tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-3xl gap-4 shadow-2xs">
        <div className="space-y-0.5 text-left">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-indigo-500" />
            <span>2. {t('preview.title', 'Интерактивный предпросмотр')}</span>
          </h2>
          <span className="text-[10px] text-slate-400 block font-medium">
            {activeTab === 'cover' ? 'Обложка' : 'Страницы книги'} — {activeTrimSize.name}
          </span>
        </div>

        {/* CAD scale zoom controls */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl">
          {activeTab !== 'interior3d' && (
            <div className="flex items-center bg-slate-50 dark:bg-slate-950/40 p-0.5 rounded-lg border border-slate-150 dark:border-slate-850 gap-1">
              <button
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                type="button"
                className="text-xs font-extrabold text-slate-500 hover:text-indigo-650 cursor-pointer bg-transparent border-none p-1.5 rounded-md hover:bg-slate-100/50"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-extrabold text-slate-650 dark:text-slate-200 w-12 text-center select-none font-mono">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                type="button"
                className="text-xs font-extrabold text-slate-500 hover:text-indigo-650 cursor-pointer bg-transparent border-none p-1.5 rounded-md hover:bg-slate-100/50"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-650"
              />
            </div>
          )}

          {/* Editor Mode Tabs */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950/40 p-0.5 rounded-lg border border-slate-150 dark:border-slate-850">
            <button
              onClick={() => { setActiveTab('cover'); setSelectedElement(coverType === 'full' ? 'full' : 'front'); }}
              type="button"
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'cover'
                  ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Обложка</span>
            </button>
            
            <button
              onClick={() => setActiveTab('interior2d')}
              type="button"
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'interior2d'
                  ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>2D Страницы</span>
            </button>

            <button
              onClick={() => setActiveTab('interior3d')}
              type="button"
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'interior3d'
                  ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Book className="w-3.5 h-3.5" />
              <span>3D Книга</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Canvas Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden select-none">
        
        {/* Reset coordinates float button */}
        {activeTab !== 'interior3d' && (
          <button
            onClick={resetActiveTransform}
            className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-indigo-650 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all shadow-2xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Сбросить сдвиг</span>
          </button>
        )}

        {/* Floating Legend Panel for High-Contrast Guide lines */}
        <LegendPanel
          showGuides={showGuides}
          onToggleGuides={() => setShowGuides(prev => !prev)}
          className="absolute top-4 right-4 z-30"
        />

        {/* Floating Cover Crop Preview Mode Bar */}
        {cropPreview.isActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-500/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-amber-300">
                  {t('aspectRatio.previewActive', 'Режим превью: Заполнить (Cover)')}
                </div>
                <div className="text-[10px] text-slate-300 hidden sm:block">
                  {t('aspectRatio.previewHint', 'Перетаскивайте изображение мышью, чтобы выбрать идеальную область кропа')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyCrop}
                type="button"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('aspectRatio.applyBtn', 'Применить')}</span>
              </button>
              <button
                onClick={handleCancelCrop}
                type="button"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                {t('aspectRatio.cancelBtn', 'Отмена')}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable CAD-like Flex Workspace */}
        <div ref={workspaceRef} className="w-full overflow-x-auto p-6 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-2xl flex justify-center">
          <div className="flex flex-row items-center gap-6 justify-center max-w-full">
          
          {/* Main Drawing Area Column */}
          <div className="flex flex-col items-center gap-4">
            
            {/* Tab 1: Cover Spread Editor */}
            {activeTab === 'cover' && (
              coverType === 'full' ? (
                /* Full Cover layout */
                (() => {
                  const isCropPreviewFull = cropPreview.isActive && cropPreview.elementKey === 'full';
                  return (
                    <div
                      className={`relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-lg transition-all max-w-full ${
                        isCropPreviewFull ? 'overflow-visible z-25 ring-2 ring-amber-400' : 'overflow-hidden'
                      }`}
                      style={{
                        height: `${coverCanvasPxHeight}px`,
                        width: `${coverCanvasPxWidth}px`
                      }}
                      ref={canvasRef}
                    >
                      {/* Layer 1: Image Layer (Underneath guides) */}
                      <div
                        onMouseDown={(e) => {
                          setSelectedElement('full');
                          if (fullCover) handleDragStart(e, 'full');
                        }}
                        className={`absolute inset-0 cursor-pointer transition-all ${
                          isCropPreviewFull ? 'overflow-visible z-25' : 'overflow-hidden'
                        } ${
                          selectedElement === 'full' ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/40'
                        }`}
                      >
                        {fullCover ? (
                          <PreviewImage
                            src={fullCover.preview}
                            xScale={isCropPreviewFull ? cropPreview.currentScale : fullCover.xScale}
                            yScale={isCropPreviewFull ? cropPreview.currentScale : fullCover.yScale}
                            xOffset={isCropPreviewFull ? cropPreview.xOffset : fullCover.xOffset}
                            yOffset={isCropPreviewFull ? cropPreview.yOffset : fullCover.yOffset}
                            containerWidth={coverCanvasPxWidth}
                            containerHeight={coverCanvasPxHeight}
                            isDragging={dragState.isDragging && (selectedElement === 'full' || isCropPreviewFull)}
                            isSelected={selectedElement === 'full' && !isCropPreviewFull}
                            onResizeStart={(ev, hnd, iw, ih) => handleResizeStart(ev, hnd, iw, ih, 'full')}
                            onAspectRatioLoaded={(r, w, h) => handleAspectRatioLoaded('full', r, w, h)}
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                            <BookOpen className="w-12 h-12 mb-2 opacity-35" />
                            <span className="text-[10px] font-bold uppercase">Загрузите полный разворот обложки</span>
                          </div>
                        )}
                      </div>

                      {/* Semi-transparent Crop Trim Overlay for Preview Mode */}
                      {isCropPreviewFull && (
                        <div className="absolute inset-0 pointer-events-none z-30 border-2 border-dashed border-amber-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                          <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded shadow flex items-center gap-1">
                            <Crop className="w-3 h-3" />
                            <span>{t('aspectRatio.cropOverlayLabel', 'Зона сохранения (Trim)')}</span>
                          </div>
                        </div>
                      )}

                      {/* Layer 2: Guides Layer (Fixed to Canvas, pointer-events-none, never scales with image) */}
                      {showGuides && (
                        <div className="absolute inset-0 pointer-events-none z-20">
                          {/* Spine boundary guides (Gutter) */}
                          <div
                            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-2 border-r-2 border-dashed border-sky-600 bg-sky-50/5"
                            style={{ width: `${spinePxWidth}px`, ...guideStyles.gutter }}
                          />

                          {/* Hardcover channels and wrap zones */}
                          {bindingType === 'hardcover' ? (
                            <>
                              {/* Wrap areas (0.591" = 15mm from all 4 outer edges) */}
                              <div className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-red-500" style={{ height: `${0.591 * pxPerInchCover}px`, ...guideStyles.bleed }} />
                              <div className="absolute bottom-0 left-0 right-0 border-t-2 border-dashed border-red-500" style={{ height: `${0.591 * pxPerInchCover}px`, ...guideStyles.bleed }} />
                              <div className="absolute top-0 bottom-0 left-0 border-r-2 border-dashed border-red-500" style={{ width: `${0.591 * pxPerInchCover}px`, ...guideStyles.bleed }} />
                              <div className="absolute top-0 bottom-0 right-0 border-l-2 border-dashed border-red-500" style={{ width: `${0.591 * pxPerInchCover}px`, ...guideStyles.bleed }} />

                              {/* Hinge channels (0.394" = 10mm flanking spine) */}
                              <div className="absolute top-0 bottom-0 border-l-2 border-r-2 border-dashed border-sky-600" style={{
                                left: `${(0.591 + activeTrimSize.width) * pxPerInchCover}px`,
                                width: `${0.394 * pxPerInchCover}px`,
                                ...guideStyles.gutter
                              }} />
                              <div className="absolute top-0 bottom-0 border-l-2 border-r-2 border-dashed border-sky-600" style={{
                                left: `${(0.591 + activeTrimSize.width + 0.394 + spineWidth) * pxPerInchCover}px`,
                                width: `${0.394 * pxPerInchCover}px`,
                                ...guideStyles.gutter
                              }} />
                            </>
                          ) : (
                            <>
                              {/* Paperback Bleed / Trim lines (0.125" from canvas edge) */}
                              {hasBleed && (
                                <div
                                  className="absolute border-2 border-dashed border-red-500"
                                  style={{
                                    top: `${0.125 * pxPerInchCover}px`,
                                    bottom: `${0.125 * pxPerInchCover}px`,
                                    left: `${0.125 * pxPerInchCover}px`,
                                    right: `${0.125 * pxPerInchCover}px`,
                                    ...guideStyles.bleed
                                  }}
                                />
                              )}
                              {/* Safe Margins (0.25" inside trim) */}
                              <div
                                className="absolute border-2 border-dashed border-indigo-500"
                                style={{
                                  top: `${(hasBleed ? 0.375 : 0.25) * pxPerInchCover}px`,
                                  bottom: `${(hasBleed ? 0.375 : 0.25) * pxPerInchCover}px`,
                                  left: `${(hasBleed ? 0.375 : 0.25) * pxPerInchCover}px`,
                                  right: `${(hasBleed ? 0.375 : 0.25) * pxPerInchCover}px`,
                                  ...guideStyles.safe
                                }}
                              />
                            </>
                          )}

                          {/* Barcode Guide Zone on Back Cover */}
                          <div
                            className="absolute border-2 border-dashed border-amber-500 bg-amber-400/10 flex flex-col items-center justify-center pointer-events-none rounded-sm"
                            style={{
                              width: `${2.0 * pxPerInchCover}px`,
                              height: `${1.2 * pxPerInchCover}px`,
                              left: `${(bindingType === 'hardcover' ? (0.591 + activeTrimSize.width - 2.0 - 0.25) : (activeTrimSize.width - 2.0 - 0.25 + (hasBleed ? 0.125 : 0))) * pxPerInchCover}px`,
                              bottom: `${(bindingType === 'hardcover' ? (0.591 + 0.25) : (0.25 + (hasBleed ? 0.125 : 0))) * pxPerInchCover}px`,
                              ...guideStyles.barcode
                            }}
                          >
                            <span className="text-[8px] font-extrabold uppercase tracking-tight text-amber-500 drop-shadow">
                              KDP Barcode
                            </span>
                            <span className="text-[7px] text-amber-500/90 font-mono">
                              2.0" × 1.2"
                            </span>
                          </div>

                          {renderSmartGuides('full')}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                /* Parts Layout: Back, Spine, Front Cover */
                (() => {
                  const isCropPreviewBack = cropPreview.isActive && cropPreview.elementKey === 'back';
                  const isCropPreviewSpine = cropPreview.isActive && cropPreview.elementKey === 'spine';
                  const isCropPreviewFront = cropPreview.isActive && cropPreview.elementKey === 'front';
                  const isAnyPartsCrop = isCropPreviewBack || isCropPreviewSpine || isCropPreviewFront;

                  return (
                    <div 
                      className={`relative flex border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-lg transition-all max-w-full ${
                        isAnyPartsCrop ? 'overflow-visible z-25' : 'overflow-hidden'
                      }`}
                      style={{ 
                        width: `${coverCanvasPxWidth}px`,
                        height: `${coverCanvasPxHeight}px` 
                      }}
                      ref={canvasRef}
                    >
                      {/* Back Cover Block */}
                      <div 
                        onMouseDown={(e) => {
                          setSelectedElement('back');
                          if (backCover) handleDragStart(e, 'back');
                        }}
                        className={`relative h-full flex items-center justify-center border-r border-dashed border-slate-350 dark:border-slate-800 cursor-pointer transition-all ${
                          isCropPreviewBack ? 'overflow-visible z-25 ring-2 ring-amber-400' : 'overflow-hidden'
                        } ${
                          selectedElement === 'back' && !isCropPreviewBack ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                        }`}
                        style={{ width: `${coverPagePxWidth}px` }}
                      >
                        {/* Image Layer */}
                        {backCover ? (
                          <PreviewImage
                            src={backCover.preview}
                            xScale={isCropPreviewBack ? cropPreview.currentScale : backCover.xScale}
                            yScale={isCropPreviewBack ? cropPreview.currentScale : backCover.yScale}
                            xOffset={isCropPreviewBack ? cropPreview.xOffset : backCover.xOffset}
                            yOffset={isCropPreviewBack ? cropPreview.yOffset : backCover.yOffset}
                            containerWidth={coverPagePxWidth}
                            containerHeight={coverCanvasPxHeight}
                            isDragging={dragState.isDragging && (selectedElement === 'back' || isCropPreviewBack)}
                            isSelected={selectedElement === 'back' && !isCropPreviewBack}
                            onResizeStart={(ev, hnd, iw, ih) => handleResizeStart(ev, hnd, iw, ih, 'back')}
                            onAspectRatioLoaded={(r, w, h) => handleAspectRatioLoaded('back', r, w, h)}
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Задняя часть</span>
                        )}

                        {/* Crop Overlay for Back Cover */}
                        {isCropPreviewBack && (
                          <div className="absolute inset-0 pointer-events-none z-30 border-2 border-dashed border-amber-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                            <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded shadow flex items-center gap-1">
                              <Crop className="w-3 h-3" />
                              <span>{t('aspectRatio.cropOverlayLabel', 'Зона сохранения (Trim)')}</span>
                            </div>
                          </div>
                        )}

                        {/* Guides Layer for Back Cover */}
                        {showGuides && (
                          <div className="absolute inset-0 pointer-events-none z-20">
                            {bindingType === 'hardcover' ? (
                              <>
                                <div className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-red-500" style={{ height: `${0.591 * pxPerInchCover}px`, ...guideStyles.bleed }} />
                                <div className="absolute bottom-0 left-0 right-0 border-t-2 border-dashed border-red-500" style={{ height: `${0.591 * pxPerInchCover}px`, ...guideStyles.bleed }} />
                                <div className="absolute top-0 bottom-0 left-0 border-r-2 border-dashed border-red-500" style={{ width: `${0.591 * pxPerInchCover}px`, ...guideStyles.bleed }} />
                                <div className="absolute top-0 bottom-0 right-0 border-l-2 border-dashed border-sky-600" style={{ width: `${0.394 * pxPerInchCover}px`, ...guideStyles.gutter }} />
                                <div className="absolute border-2 border-dashed border-indigo-500" style={{
                                  top: `${(0.591 + 0.375) * pxPerInchCover}px`,
                                  bottom: `${(0.591 + 0.375) * pxPerInchCover}px`,
                                  left: `${(0.591 + 0.375) * pxPerInchCover}px`,
                                  right: `${(0.394 + 0.375) * pxPerInchCover}px`,
                                  ...guideStyles.safe
                                }} />
                              </>
                            ) : (
                              <>
                                {hasBleed && (
                                  <div className="absolute border-t-2 border-b-2 border-l-2 border-dashed border-red-500" style={{
                                    top: `${0.125 * pxPerInchCover}px`,
                                    bottom: `${0.125 * pxPerInchCover}px`,
                                    left: `${0.125 * pxPerInchCover}px`,
                                    right: 0,
                                    ...guideStyles.bleed
                                  }} />
                                )}
                                <div className="absolute border-2 border-dashed border-indigo-500" style={{
                                  top: `${(hasBleed ? 0.375 : 0.25) * pxPerInchCover}px`,
                                  bottom: `${(hasBleed ? 0.375 : 0.25) * pxPerInchCover}px`,
                                  left: `${(hasBleed ? 0.375 : 0.25) * pxPerInchCover}px`,
                                  right: `${0.25 * pxPerInchCover}px`,
                                  ...guideStyles.safe
                                }} />
                              </>
                            )}

                            {/* Barcode Guide Zone on Back Cover (Parts) */}
                            <div
                              className="absolute border-2 border-dashed border-amber-500 bg-amber-400/10 flex flex-col items-center justify-center pointer-events-none rounded-sm"
                              style={{
                                width: `${2.0 * pxPerInchCover}px`,
                                height: `${1.2 * pxPerInchCover}px`,
                                right: `${(bindingType === 'hardcover' ? (0.394 + 0.25) : (0.25 + (hasBleed ? 0.125 : 0))) * pxPerInchCover}px`,
                                bottom: `${(bindingType === 'hardcover' ? (0.591 + 0.25) : (0.25 + (hasBleed ? 0.125 : 0))) * pxPerInchCover}px`,
                                ...guideStyles.barcode
                              }}
                            >
                              <span className="text-[8px] font-extrabold uppercase tracking-tight text-amber-500 drop-shadow">
                                KDP Barcode
                              </span>
                              <span className="text-[7px] text-amber-500/90 font-mono">
                                2.0" × 1.2"
                              </span>
                            </div>

                            {renderSmartGuides('back')}
                          </div>
                        )}
                      </div>

                      {/* Dynamic Spine Block */}
                      <div
                        onMouseDown={(e) => {
                          setSelectedElement('spine');
                          if (spineImage && pageCount >= 79) handleDragStart(e, 'spine');
                        }}
                        className={`relative h-full flex items-center justify-center cursor-pointer transition-all ${
                          isCropPreviewSpine ? 'overflow-visible z-25 ring-2 ring-amber-400' : 'overflow-hidden'
                        } ${
                          selectedElement === 'spine' && !isCropPreviewSpine ? 'ring-2 ring-indigo-500 ring-inset' : ''
                        }`}
                        style={{
                          backgroundColor: spineColor,
                          width: `${spinePxWidth}px`
                        }}
                      >
                        {/* Image / Text Layer */}
                        {spineImage && pageCount >= 79 ? (
                          <PreviewImage
                            src={spineImage.preview}
                            xScale={isCropPreviewSpine ? cropPreview.currentScale : spineImage.xScale}
                            yScale={isCropPreviewSpine ? cropPreview.currentScale : spineImage.yScale}
                            xOffset={isCropPreviewSpine ? cropPreview.xOffset : spineImage.xOffset}
                            yOffset={isCropPreviewSpine ? cropPreview.yOffset : spineImage.yOffset}
                            containerWidth={spinePxWidth}
                            containerHeight={coverCanvasPxHeight}
                            isDragging={dragState.isDragging && (selectedElement === 'spine' || isCropPreviewSpine)}
                            isSelected={selectedElement === 'spine' && !isCropPreviewSpine}
                            onResizeStart={(ev, hnd, iw, ih) => handleResizeStart(ev, hnd, iw, ih, 'spine')}
                            onAspectRatioLoaded={(r, w, h) => handleAspectRatioLoaded('spine', r, w, h)}
                          />
                        ) : spineText && pageCount >= 79 ? (
                          <span
                            className="whitespace-nowrap font-bold uppercase tracking-widest select-none pointer-events-none z-5"
                            style={{
                              color: spineTextColor,
                              transform: `rotate(${spineTextDirection === 'bottom-to-top' ? -90 : 90}deg)`,
                              fontSize: `${Math.min(12, Math.max(4, (spineWidth - 0.125) * pxPerInchCover))}px`
                            }}
                          >
                            {spineText}
                          </span>
                        ) : null}

                        {/* Crop Overlay for Spine */}
                        {isCropPreviewSpine && (
                          <div className="absolute inset-0 pointer-events-none z-30 border-2 border-dashed border-amber-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]" />
                        )}

                        {/* Guides Layer for Spine */}
                        {showGuides && (
                          <div className="absolute inset-0 pointer-events-none z-20">
                            {bindingType === 'hardcover' ? (
                              <>
                                <div className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-red-500" style={{ height: `${0.591 * pxPerInchCover}px`, ...guideStyles.bleed }} />
                                <div className="absolute bottom-0 left-0 right-0 border-t-2 border-dashed border-red-500" style={{ height: `${0.591 * pxPerInchCover}px`, ...guideStyles.bleed }} />
                              </>
                            ) : (
                              selectedElement === 'spine' && (
                                <div
                                  className="absolute border-2 border-dashed border-red-500"
                                  style={{
                                    left: `${0.0625 * pxPerInchCover}px`,
                                    right: `${0.0625 * pxPerInchCover}px`,
                                    top: `${0.25 * pxPerInchCover}px`,
                                    bottom: `${0.25 * pxPerInchCover}px`,
                                    ...guideStyles.bleed
                                  }}
                                />
                              )
                            )}
                            {renderSmartGuides('spine')}
                          </div>
                        )}
                      </div>

                      {/* Front Cover Block */}
                      <div 
                        onMouseDown={(e) => {
                          setSelectedElement('front');
                          if (frontCover) handleDragStart(e, 'front');
                        }}
                        className={`relative h-full flex items-center justify-center cursor-pointer transition-all ${
                          isCropPreviewFront ? 'overflow-visible z-25 ring-2 ring-amber-400' : 'overflow-hidden'
                        } ${
                          selectedElement === 'front' && !isCropPreviewFront ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                        }`}
                        style={{ width: `${coverPagePxWidth}px` }}
                      >
                        {/* Image Layer */}
                        {frontCover ? (
                          <PreviewImage
                            src={frontCover.preview}
                            xScale={isCropPreviewFront ? cropPreview.currentScale : frontCover.xScale}
                            yScale={isCropPreviewFront ? cropPreview.currentScale : frontCover.yScale}
                            xOffset={isCropPreviewFront ? cropPreview.xOffset : frontCover.xOffset}
                            yOffset={isCropPreviewFront ? cropPreview.yOffset : frontCover.yOffset}
                            containerWidth={coverPagePxWidth}
                            containerHeight={coverCanvasPxHeight}
                            isDragging={dragState.isDragging && (selectedElement === 'front' || isCropPreviewFront)}
                            isSelected={selectedElement === 'front' && !isCropPreviewFront}
                            onResizeStart={(ev, hnd, iw, ih) => handleResizeStart(ev, hnd, iw, ih, 'front')}
                            onAspectRatioLoaded={(r, w, h) => handleAspectRatioLoaded('front', r, w, h)}
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Передняя часть</span>
                        )}

                        {/* Crop Overlay for Front Cover */}
                        {isCropPreviewFront && (
                          <div className="absolute inset-0 pointer-events-none z-30 border-2 border-dashed border-amber-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                            <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded shadow flex items-center gap-1">
                              <Crop className="w-3 h-3" />
                              <span>{t('aspectRatio.cropOverlayLabel', 'Зона сохранения (Trim)')}</span>
                            </div>
                          </div>
                        )}

                        {/* Guides Layer for Front Cover */}
                        {showGuides && (
                          <div className="absolute inset-0 pointer-events-none z-20">
                            {bindingType === 'hardcover' ? (
                              <>
                                <div className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-red-500" style={{ height: `${0.591 * pxPerInchCover}px`, ...guideStyles.bleed }} />
                                <div className="absolute bottom-0 left-0 right-0 border-t-2 border-dashed border-red-500" style={{ height: `${0.591 * pxPerInchCover}px`, ...guideStyles.bleed }} />
                                <div className="absolute top-0 bottom-0 right-0 border-l-2 border-dashed border-red-500" style={{ width: `${0.591 * pxPerInchCover}px`, ...guideStyles.bleed }} />
                                <div className="absolute top-0 bottom-0 left-0 border-r-2 border-dashed border-sky-600" style={{ width: `${0.394 * pxPerInchCover}px`, ...guideStyles.gutter }} />
                                <div className="absolute border-2 border-dashed border-indigo-500" style={{
                                  top: `${(0.591 + 0.375) * pxPerInchCover}px`,
                                  bottom: `${(0.591 + 0.375) * pxPerInchCover}px`,
                                  right: `${(0.591 + 0.375) * pxPerInchCover}px`,
                                  left: `${(0.394 + 0.375) * pxPerInchCover}px`,
                                  ...guideStyles.safe
                                }} />
                              </>
                            ) : (
                              <>
                                {hasBleed && (
                                  <div className="absolute border-t-2 border-b-2 border-r-2 border-dashed border-red-500" style={{
                                    top: `${0.125 * pxPerInchCover}px`,
                                    bottom: `${0.125 * pxPerInchCover}px`,
                                    right: `${0.125 * pxPerInchCover}px`,
                                    left: 0,
                                    ...guideStyles.bleed
                                  }} />
                                )}
                                <div className="absolute border-2 border-dashed border-indigo-500" style={{
                                  top: `${(hasBleed ? 0.375 : 0.25) * pxPerInchCover}px`,
                                  bottom: `${(hasBleed ? 0.375 : 0.25) * pxPerInchCover}px`,
                                  right: `${(hasBleed ? 0.375 : 0.25) * pxPerInchCover}px`,
                                  left: `${0.25 * pxPerInchCover}px`,
                                  ...guideStyles.safe
                                }} />
                              </>
                            )}
                            {renderSmartGuides('front')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )
            )}

            {/* Tab 2: 2D Interior Page Spread Editor */}
            {activeTab === 'interior2d' && (
              <div className="flex flex-col items-center gap-4 animate-fade-in max-w-full">
                {spreads.length > 0 ? (
                  (() => {
                    const currentSpread = spreads[activeSpreadIndex] || spreads[0];
                    const leftPage = currentSpread.left;
                    const rightPage = currentSpread.right;
                    const isCropPreviewLeft = cropPreview.isActive && leftPage && cropPreview.pageId === leftPage.id;
                    const isCropPreviewRight = cropPreview.isActive && rightPage && cropPreview.pageId === rightPage.id;

                    return (
                      <div className="flex flex-col items-center gap-4">
                        {/* 2D Spread Side-by-Side Pages */}
                        <div 
                          className="relative flex border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg"
                          style={{
                            width: `${interiorSpreadPxWidth}px`,
                            height: `${interiorPreviewHeight}px`
                          }}
                        >
                          {/* Left page container */}
                          <div
                            onClick={() => leftPage && setSelectedPageId(leftPage.id)}
                            onMouseDown={(e) => {
                              if (leftPage && !leftPage.isBlank) {
                                setSelectedPageId(leftPage.id);
                                handleDragStart(e, null, leftPage.id);
                              }
                            }}
                            className={`relative h-full border-r border-dashed border-slate-300 dark:border-slate-800 ${
                              isCropPreviewLeft ? 'overflow-visible' : 'overflow-hidden'
                            } cursor-pointer flex items-center justify-center transition-all ${
                              leftPage && selectedPageId === leftPage.id && !isCropPreviewLeft ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                            }`}
                            style={{
                              width: `${interiorPagePxWidth}px`
                            }}
                          >
                            {/* Image Layer */}
                            {leftPage ? (
                              leftPage.isBlank ? (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 bg-slate-100/40">
                                  <BookOpen className="w-8 h-8 mb-2 opacity-35" />
                                  <span className="text-[10px] font-bold uppercase">Пустой лист</span>
                                </div>
                              ) : (
                                <PreviewImage
                                  src={leftPage.preview}
                                  xScale={isCropPreviewLeft ? cropPreview.currentScale : leftPage.xScale}
                                  yScale={isCropPreviewLeft ? cropPreview.currentScale : leftPage.yScale}
                                  xOffset={isCropPreviewLeft ? cropPreview.xOffset : leftPage.xOffset}
                                  yOffset={isCropPreviewLeft ? cropPreview.yOffset : leftPage.yOffset}
                                  containerWidth={interiorPagePxWidth}
                                  containerHeight={interiorPreviewHeight}
                                  isDragging={dragState.isDragging && (selectedPageId === leftPage.id || isCropPreviewLeft)}
                                  isSelected={selectedPageId === leftPage.id && !isCropPreviewLeft}
                                  onResizeStart={(ev, hnd, iw, ih) => handleResizeStart(ev, hnd, iw, ih, null, leftPage.id)}
                                  onAspectRatioLoaded={(r, w, h) => handleAspectRatioLoaded(leftPage.id, r, w, h)}
                                />
                              )
                            ) : null}

                            {/* Crop Overlay for Left Page */}
                            {isCropPreviewLeft && (
                              <div className="absolute inset-0 pointer-events-none z-30 border-2 border-dashed border-amber-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                                <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded shadow flex items-center gap-1">
                                  <Crop className="w-3 h-3" />
                                  <span>{t('aspectRatio.cropOverlayLabel', 'Зона сохранения (Trim)')}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Guides Layer for Left Page (Fixed to Left Page Canvas) */}
                            {showGuides && (
                              <div className="absolute inset-0 pointer-events-none z-20">
                                {hasBleed && (
                                  <div
                                    className="absolute border-t-2 border-b-2 border-l-2 border-dashed border-red-500"
                                    style={{
                                      top: `${0.125 * pxPerInchInterior}px`,
                                      bottom: `${0.125 * pxPerInchInterior}px`,
                                      left: `${0.125 * pxPerInchInterior}px`,
                                      right: 0,
                                      ...guideStyles.bleed
                                    }}
                                  />
                                )}
                                {/* Safe Margins & Gutter (Left page: Gutter on Right / Spine edge) */}
                                <div
                                  className="absolute border-2 border-dashed border-indigo-500"
                                  style={{
                                    top: `${(hasBleed ? 0.375 : 0.25) * pxPerInchInterior}px`,
                                    bottom: `${(hasBleed ? 0.375 : 0.25) * pxPerInchInterior}px`,
                                    left: `${(hasBleed ? 0.375 : 0.25) * pxPerInchInterior}px`,
                                    right: `${0.375 * pxPerInchInterior}px`,
                                    ...guideStyles.safe
                                  }}
                                />
                                {leftPage && !leftPage.isBlank && renderSmartGuides(null, leftPage.id)}
                              </div>
                            )}
                          </div>

                          {/* Right page container */}
                          <div
                            onClick={() => rightPage && setSelectedPageId(rightPage.id)}
                            onMouseDown={(e) => {
                              if (rightPage && !rightPage.isBlank) {
                                setSelectedPageId(rightPage.id);
                                handleDragStart(e, null, rightPage.id);
                              }
                            }}
                            className={`relative h-full ${
                              isCropPreviewRight ? 'overflow-visible' : 'overflow-hidden'
                            } cursor-pointer flex items-center justify-center transition-all ${
                              rightPage && selectedPageId === rightPage.id && !isCropPreviewRight ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                            }`}
                            style={{
                              width: `${interiorPagePxWidth}px`
                            }}
                          >
                            {/* Image Layer */}
                            {rightPage ? (
                              rightPage.isBlank ? (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 bg-slate-100/40">
                                  <BookOpen className="w-8 h-8 mb-2 opacity-35" />
                                  <span className="text-[10px] font-bold uppercase">Пустой лист</span>
                                </div>
                              ) : (
                                <PreviewImage
                                  src={rightPage.preview}
                                  xScale={isCropPreviewRight ? cropPreview.currentScale : rightPage.xScale}
                                  yScale={isCropPreviewRight ? cropPreview.currentScale : rightPage.yScale}
                                  xOffset={isCropPreviewRight ? cropPreview.xOffset : rightPage.xOffset}
                                  yOffset={isCropPreviewRight ? cropPreview.yOffset : rightPage.yOffset}
                                  containerWidth={interiorPagePxWidth}
                                  containerHeight={interiorPreviewHeight}
                                  isDragging={dragState.isDragging && (selectedPageId === rightPage.id || isCropPreviewRight)}
                                  isSelected={selectedPageId === rightPage.id && !isCropPreviewRight}
                                  onResizeStart={(ev, hnd, iw, ih) => handleResizeStart(ev, hnd, iw, ih, null, rightPage.id)}
                                  onAspectRatioLoaded={(r, w, h) => handleAspectRatioLoaded(rightPage.id, r, w, h)}
                                />
                              )
                            ) : null}

                            {/* Crop Overlay for Right Page */}
                            {isCropPreviewRight && (
                              <div className="absolute inset-0 pointer-events-none z-30 border-2 border-dashed border-amber-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                                <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded shadow flex items-center gap-1">
                                  <Crop className="w-3 h-3" />
                                  <span>{t('aspectRatio.cropOverlayLabel', 'Зона сохранения (Trim)')}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Guides Layer for Right Page (Gutter on Left / Spine edge) */}
                            {showGuides && (
                              <div className="absolute inset-0 pointer-events-none z-20">
                                {hasBleed && (
                                  <div
                                    className="absolute border-t-2 border-b-2 border-r-2 border-dashed border-red-500"
                                    style={{
                                      top: `${0.125 * pxPerInchInterior}px`,
                                      bottom: `${0.125 * pxPerInchInterior}px`,
                                      right: `${0.125 * pxPerInchInterior}px`,
                                      left: 0,
                                      ...guideStyles.bleed
                                    }}
                                  />
                                )}
                                <div
                                  className="absolute border-2 border-dashed border-indigo-500"
                                  style={{
                                    top: `${(hasBleed ? 0.375 : 0.25) * pxPerInchInterior}px`,
                                    bottom: `${(hasBleed ? 0.375 : 0.25) * pxPerInchInterior}px`,
                                    right: `${(hasBleed ? 0.375 : 0.25) * pxPerInchInterior}px`,
                                    left: `${0.375 * pxPerInchInterior}px`,
                                    ...guideStyles.safe
                                  }}
                                />
                                {rightPage && !rightPage.isBlank && renderSmartGuides(null, rightPage.id)}
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Spread Navigation Bar */}
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <button
                            onClick={() => setActiveSpreadIndex(prev => Math.max(0, prev - 1))}
                            disabled={activeSpreadIndex === 0}
                            type="button"
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer"
                          >
                            ◀ Назад
                          </button>
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                            Разворот {activeSpreadIndex + 1} из {spreads.length}
                          </span>
                          <button
                            onClick={() => setActiveSpreadIndex(prev => Math.min(spreads.length - 1, prev + 1))}
                            disabled={activeSpreadIndex === spreads.length - 1}
                            type="button"
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer"
                          >
                            Далее ▶
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center p-8 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850">
                    <BookOpen className="w-12 h-12 text-slate-350 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Загрузите страницы книги для просмотра разворотов</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: HTMLFlipBook 3D Preview (spread-by-spread closed book simulation) */}
            {activeTab === 'interior3d' && (
              <div className="flex justify-center items-center py-2 max-w-full overflow-hidden">
                <HTMLFlipBook
                  key={`3d-${bindingType}-${coverType}-${trimSizeId}-${interiorPages.length}-${zoom}`}
                  width={previewWidth}
                  height={previewHeight}
                  size="fixed"
                  minWidth={200}
                  maxWidth={600}
                  minHeight={250}
                  maxHeight={600}
                  showCover={true}
                  usePortrait={false}
                  display="double"
                  flippingTime={600}
                  className="shadow-2xl border border-slate-100 dark:border-slate-850 rounded-lg bg-slate-50"
                  ref={flipBookRef}
                >
                  {/* Page 1 (Front Cover) */}
                  {coverType === 'full' && fullCover ? (() => {
                    // For 3D mode, the full cover image shows its right half (front cover)
                    // Container is the FlipBook page size (previewWidth x previewHeight)
                    const singleCoverWidthIn = activeTrimSize.width + (bindingType === 'hardcover' ? (0.591 + 0.394) : 0.125);
                    const coverWidthInches = (singleCoverWidthIn * 2) + spineWidth;
                    const coverHeightIn = bindingType === 'hardcover' 
                      ? activeTrimSize.height + (0.591 * 2) 
                      : activeTrimSize.height + 0.25;

                    const scaleFactor = previewHeight / coverHeightIn;
                    const fullCoverPxWidth = coverWidthInches * scaleFactor;
                    const fullCoverPxHeight = previewHeight;
                    const backCoverPxWidth = singleCoverWidthIn * scaleFactor;
                    const spinePx = spineWidth * scaleFactor;
                    
                    // Shift left by back cover width + spine width so front cover starts at container x=0
                    const shiftX = -(backCoverPxWidth + spinePx);
                    const userOffsetX = ((fullCover.xOffset || 0) / 72) * scaleFactor;
                    const userOffsetY = ((fullCover.yOffset || 0) / 72) * scaleFactor;
                    const xScale = fullCover.xScale || 1.0;
                    const yScale = fullCover.yScale || 1.0;

                    return (
                      <div className="bg-white relative h-full w-full overflow-hidden border border-slate-200">
                        <img
                          src={fullCover.preview}
                          alt="Front Cover"
                          style={{
                            position: 'absolute',
                            left: `${shiftX + userOffsetX}px`,
                            top: `${userOffsetY}px`,
                            width: `${fullCoverPxWidth}px`,
                            height: `${fullCoverPxHeight}px`,
                            maxWidth: 'none',
                            maxHeight: 'none',
                            pointerEvents: 'none',
                            objectFit: 'contain',
                            transform: `scale(${xScale}, ${yScale})`,
                            transformOrigin: `${backCoverPxWidth + spinePx + (backCoverPxWidth / 2)}px center`
                          }}
                        />
                      </div>
                    );
                  })() : frontCover ? (
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

                  {/* Inside Front Cover Blank Page to align layout */}
                  <div className="bg-slate-50 relative h-full w-full overflow-hidden border border-slate-200">
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                      <BookOpen className="w-8 h-8 mb-2 opacity-35" />
                      <span className="text-[10px] font-extrabold uppercase">Inside Cover</span>
                    </div>
                  </div>

                  {/* Interior pages list */}
                  {compiledPages.map((page, idx) => (
                    <div key={page.id || idx} className="bg-white relative h-full w-full overflow-hidden border border-slate-200">
                      {page.isBlank ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-100/50 text-slate-400">
                          <BookOpen className="w-12 h-12 mb-2 opacity-35" />
                          <span className="text-xs font-extrabold uppercase">Пустой лист</span>
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

                  {/* Inside Back Cover Blank Page */}
                  <div className="bg-slate-50 relative h-full w-full overflow-hidden border border-slate-200">
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                      <BookOpen className="w-8 h-8 mb-2 opacity-35" />
                      <span className="text-[10px] font-extrabold uppercase">Inside Cover</span>
                    </div>
                  </div>

                  {/* Page N (Back Cover) */}
                  {coverType === 'full' && fullCover ? (() => {
                    // Show the left portion (back cover) of the full cover image
                    const singleCoverWidthIn = activeTrimSize.width + (bindingType === 'hardcover' ? (0.591 + 0.394) : 0.125);
                    const coverWidthInches = (singleCoverWidthIn * 2) + spineWidth;
                    const coverHeightIn = bindingType === 'hardcover' 
                      ? activeTrimSize.height + (0.591 * 2) 
                      : activeTrimSize.height + 0.25;

                    const scaleFactor = previewHeight / coverHeightIn;
                    const fullCoverPxWidth = coverWidthInches * scaleFactor;
                    const fullCoverPxHeight = previewHeight;
                    const backCoverPxWidth = singleCoverWidthIn * scaleFactor;

                    const userOffsetX = ((fullCover.xOffset || 0) / 72) * scaleFactor;
                    const userOffsetY = ((fullCover.yOffset || 0) / 72) * scaleFactor;
                    const xScale = fullCover.xScale || 1.0;
                    const yScale = fullCover.yScale || 1.0;

                    // Back cover starts at image left=0 and aligns with the container left edge (x=0)
                    return (
                      <div className="bg-white relative h-full w-full overflow-hidden border border-slate-200">
                        <img
                          src={fullCover.preview}
                          alt="Back Cover"
                          style={{
                            position: 'absolute',
                            left: `${userOffsetX}px`,
                            top: `${userOffsetY}px`,
                            width: `${fullCoverPxWidth}px`,
                            height: `${fullCoverPxHeight}px`,
                            maxWidth: 'none',
                            maxHeight: 'none',
                            pointerEvents: 'none',
                            objectFit: 'contain',
                            transform: `scale(${xScale}, ${yScale})`,
                            transformOrigin: `${backCoverPxWidth / 2}px center`
                          }}
                        />
                      </div>
                    );
                  })() : backCover ? (
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
                        <span className="text-xs font-extrabold uppercase">Задняя часть обложки</span>
                      </div>
                    </div>
                  )}
                </HTMLFlipBook>
              </div>
            )}

          </div>

          </div>

        </div>

        {/* Control Panel: Transforms, Scale, Offsets */}
        {activeTab !== 'interior3d' && (
          <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 mt-6 rounded-2xl shadow-2xs space-y-4 max-w-4xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Инструменты коррекции ({activeTab === 'cover' ? `Элемент: ${coverType === 'full' ? 'весь разворот' : selectedElement}` : 'Активная страница'})
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/50 dark:bg-slate-850 px-2 py-0.5 rounded font-mono">
                  {getActivePhysicalDimensions()}
                </span>
                <button
                  onClick={resetActiveTransform}
                  type="button"
                  className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 hover:text-indigo-650 cursor-pointer transition-all bg-transparent border-0"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Сбросить сдвиг</span>
                </button>
              </div>
            </div>
            
            {/* Aspect Ratio Engine & Mode Switcher */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-left shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Режимы масштабирования (Aspect Ratio Engine)
                    </span>
                    {isRatioMismatch ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{t('aspectRatio.mismatchAlert', 'Соотношение сторон изображения и холста не совпадает')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Check className="w-3 h-3 flex-shrink-0" />
                        <span>Пропорции совпадают</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Холст: {containerRatio.toFixed(3)} ({baseW.toFixed(2)}" × {baseH.toFixed(2)}")
                    {imgRatio && (
                      <span> • Изображение: {imgRatio.toFixed(3)} (Δ: {ratioDiff.toFixed(3)})</span>
                    )}
                  </div>
                </div>

                {/* Mode Selector Buttons */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleSetContain}
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeFitMode === 'contain' && !cropPreview.isActive
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>{t('aspectRatio.containMode', 'Вписать (Contain)')}</span>
                  </button>

                  <button
                    onClick={handleStartCoverPreview}
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeFitMode === 'cover' || cropPreview.isActive
                        ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{t('aspectRatio.coverMode', 'Заполнить (Cover)')}</span>
                  </button>
                </div>
              </div>

              {/* Mode Descriptions & Live Preview Action Bar */}
              {cropPreview.isActive ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Crop className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
                    <div className="text-left">
                      <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        {t('aspectRatio.previewActive', 'Режим превью: Заполнить (Cover)')}
                      </div>
                      <div className="text-[10px] text-amber-600/90 dark:text-amber-400/90">
                        {t('aspectRatio.previewHint', 'Перетаскивайте изображение мышью, чтобы выбрать идеальную область кропа')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={handleCancelCrop}
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      {t('aspectRatio.cancelBtn', 'Отмена')}
                    </button>
                    <button
                      onClick={handleApplyCrop}
                      type="button"
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('aspectRatio.applyBtn', 'Применить')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>
                    {activeFitMode === 'cover'
                      ? t('aspectRatio.coverDesc', 'Масштаб по меньшей стороне: белые полосы скрыты, применяется обрезка без изменения оригинала.')
                      : t('aspectRatio.containDesc', 'Масштаб по большей стороне: всё изображение видно целиком, могут оставаться белые поля.')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Control 1: Width Scale */}
              <div className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-855 p-3 rounded-xl text-left">
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
                <div className="text-[9px] text-slate-450 font-semibold">
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
              <div className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-855 p-3 rounded-xl text-left">
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
                <div className="text-[9px] text-slate-450 font-semibold">
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
              <div className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-855 p-3 rounded-xl text-left">
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
                <div className="text-[9px] text-slate-450 font-semibold">
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
              <div className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-855 p-3 rounded-xl text-left">
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
                <div className="text-[9px] text-slate-450 font-semibold">
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
