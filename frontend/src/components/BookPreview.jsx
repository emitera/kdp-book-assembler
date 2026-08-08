import React, { useState, useRef, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { calculateSpineWidth, calculateCoverDimensions } from '../utils/kdpMath';
import { Eye, BookOpen, AlertTriangle, Layers, Book, Move, Sliders, Check, Lock, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

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
  xScale,
  yScale,
  xOffset,
  yOffset,
  containerWidth,
  containerHeight,
  isBleedEnabled = false,
  isCover = false,
  isOdd = false,
  aspectRatio,
  onResizeStart
}) => {
  if (!aspectRatio) return null;

  const { activeTrimSize } = useApp();
  let targetW = containerWidth;
  let targetH = containerHeight;
  let targetXOffset = 0;
  let targetYOffset = 0;

  if (!isCover && !isBleedEnabled) {
    const scaleFactor = containerWidth / activeTrimSize.width;
    const marginGutter = 0.375 * scaleFactor;
    const marginOutside = 0.25 * scaleFactor;
    const marginTop = 0.25 * (containerHeight / activeTrimSize.height);
    const marginBottom = 0.25 * (containerHeight / activeTrimSize.height);

    targetW = containerWidth - (marginGutter + marginOutside);
    targetH = containerHeight - (marginTop + marginBottom);

    const marginLeft = isOdd ? marginGutter : marginOutside;
    targetXOffset = marginLeft - (containerWidth - targetW) / 2;
    targetYOffset = marginBottom - (containerHeight - targetH) / 2;
  }

  const containerRatio = targetW / targetH;
  let imgWidth, imgHeight;
  if (aspectRatio > containerRatio) {
    imgWidth = targetW;
    imgHeight = targetW / aspectRatio;
  } else {
    imgHeight = targetH;
    imgWidth = targetH * aspectRatio;
  }

  const w_box = imgWidth * xScale;
  const h_box = imgHeight * yScale;
  const cx = containerWidth / 2 + targetXOffset + (xOffset / 2);
  const cy = containerHeight / 2 + targetYOffset + (yOffset / 2);

  const left = cx - w_box / 2;
  const top = cy - h_box / 2;

  return (
    <div 
      className="absolute border-2 border-indigo-500/80 border-dashed pointer-events-none z-30"
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
  isBleedEnabled = false,
  isCover = false,
  isOdd = false,
  isSelected = false,
  onResizeStart = null
}) => {
  const { activeTrimSize } = useApp();
  const [aspectRatio, setAspectRatio] = useState(null);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

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

  let targetW = containerWidth;
  let targetH = containerHeight;
  let targetXOffset = 0;
  let targetYOffset = 0;

  if (!isCover && !isBleedEnabled) {
    const scaleFactor = containerWidth / activeTrimSize.width;
    const marginGutter = 0.375 * scaleFactor;
    const marginOutside = 0.25 * scaleFactor;
    const marginTop = 0.25 * (containerHeight / activeTrimSize.height);
    const marginBottom = 0.25 * (containerHeight / activeTrimSize.height);

    targetW = containerWidth - (marginGutter + marginOutside);
    targetH = containerHeight - (marginTop + marginBottom);

    const marginLeft = isOdd ? marginGutter : marginOutside;
    targetXOffset = marginLeft - (containerWidth - targetW) / 2;
    targetYOffset = marginBottom - (containerHeight - targetH) / 2;
  }

  const containerRatio = targetW / targetH;
  
  let imgWidth, imgHeight;
  if (aspectRatio > containerRatio) {
    imgWidth = targetW;
    imgHeight = targetW / aspectRatio;
  } else {
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
          isBleedEnabled={isBleedEnabled}
          isCover={isCover}
          isOdd={isOdd}
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

  // Real-time aspect-ratio fit pxPerInch math
  const totalCoverWidthInches = coverType === 'full' 
    ? baseW 
    : ((activeTrimSize.width + (bindingType === 'hardcover' ? (0.591 + 0.394) : 0.125)) * 2 + spineWidth);
  const coverHeightInches = bindingType === 'hardcover' 
    ? activeTrimSize.height + (0.591 * 2) 
    : activeTrimSize.height + 0.25;

  const pxPerInchCover = (workspaceWidth / totalCoverWidthInches) * zoom;
  const coverPagePxWidth = Math.round((activeTrimSize.width + (bindingType === 'hardcover' ? (0.591 + 0.394) : 0.125)) * pxPerInchCover);
  const spinePxWidth = Math.max(16, Math.round(spineWidth * pxPerInchCover));
  const coverPreviewHeight = coverHeightInches * pxPerInchCover;

  const interiorWidthInches = activeTrimSize.width + (hasBleed ? 0.125 : 0);
  const interiorHeightInches = activeTrimSize.height + (hasBleed ? 0.25 : 0);
  const totalInteriorWidthInches = interiorWidthInches * 2;

  const pxPerInchInterior = (workspaceWidth / totalInteriorWidthInches) * zoom;
  const interiorPagePxWidth = Math.round(interiorWidthInches * pxPerInchInterior);
  const interiorPreviewHeight = interiorHeightInches * pxPerInchInterior;

  // Active preview dimensions depending on tab
  const previewHeight = activeTab === 'cover' ? coverPreviewHeight : interiorPreviewHeight;
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

      if (pageId) {
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

    const containerElement = e.target.closest('.relative.flex.overflow-hidden, .relative.h-full.w-full, .bg-white.relative, .relative.flex-1');
    if (!containerElement) return;

    const rect = containerElement.getBoundingClientRect();

    let targetW = rect.width;
    let targetH = rect.height;
    let targetXOffset = 0;
    let targetYOffset = 0;

    const isCover = elementKey !== null;
    const isBleedEnabled = isCover ? true : hasBleed;

    if (!isCover && !isBleedEnabled) {
      const scaleFactor = rect.width / activeTrimSize.width;
      const marginGutter = 0.375 * scaleFactor;
      const marginOutside = 0.25 * scaleFactor;
      const marginTop = 0.25 * (rect.height / activeTrimSize.height);
      const marginBottom = 0.25 * (rect.height / activeTrimSize.height);

      targetW = rect.width - (marginGutter + marginOutside);
      targetH = rect.height - (marginTop + marginBottom);

      const isOdd = pageId ? (interiorPages.findIndex(p => p.id === pageId) % 2 !== 0) : false;
      const marginLeft = isOdd ? marginGutter : marginOutside;
      targetXOffset = marginLeft - (rect.width - targetW) / 2;
      targetYOffset = marginBottom - (rect.height - targetH) / 2;
    }

    const cx = rect.width / 2 + targetXOffset + (currentXOffset / 2);
    const cy = rect.height / 2 + targetYOffset + (currentYOffset / 2);
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

        {/* Scrollable CAD-like Flex Workspace */}
        <div ref={workspaceRef} className="w-full overflow-x-auto p-6 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-2xl flex justify-center">
          <div className="flex flex-row items-center gap-6 justify-center max-w-full">
          
          {/* Main Drawing Area Column */}
          <div className="flex flex-col items-center gap-4">
            
            {/* Tab 1: Cover Spread Editor */}
            {activeTab === 'cover' && (
              coverType === 'full' ? (
                /* Full Cover layout */
                <div
                  className="relative flex border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden shadow-lg transition-all max-w-full"
                  style={{
                    height: `${coverPreviewHeight}px`,
                    width: `${coverPagePxWidth * 2 + spinePxWidth}px`
                  }}
                  ref={canvasRef}
                >
                  <div
                    onMouseDown={(e) => {
                      setSelectedElement('full');
                      if (fullCover) handleDragStart(e, 'full');
                    }}
                    className={`relative flex-1 h-full cursor-pointer overflow-hidden transition-all ${
                      selectedElement === 'full' ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                    }`}
                  >
                    {fullCover ? (
                      <PreviewImage
                        src={fullCover.preview}
                        xScale={fullCover.xScale}
                        yScale={fullCover.yScale}
                        xOffset={fullCover.xOffset}
                        yOffset={fullCover.yOffset}
                        containerWidth={coverPagePxWidth * 2 + spinePxWidth}
                        containerHeight={coverPreviewHeight}
                        isDragging={dragState.isDragging && selectedElement === 'full'}
                        isBleedEnabled={true}
                        isCover={true}
                        isSelected={selectedElement === 'full'}
                        onResizeStart={(ev, hnd, iw, ih) => handleResizeStart(ev, hnd, iw, ih, 'full')}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                        <BookOpen className="w-12 h-12 mb-2 opacity-35" />
                        <span className="text-[10px] font-bold uppercase">Загрузите полный разворот обложки</span>
                      </div>
                    )}

                    {/* Spine boundary guides inside full cover */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l border-r border-dashed border-indigo-500/30 bg-indigo-50/5 pointer-events-none" style={{ width: `${spinePxWidth}px` }} />

                    {/* Hardcover channels and wrap zones */}
                    {bindingType === 'hardcover' && (
                      <>
                        {/* Wrap areas */}
                        <div className="absolute top-0 left-0 right-0 bg-slate-900/10 border-b border-dashed border-red-500/40 pointer-events-none z-10" style={{ height: `${0.591 * pxPerInchCover}px` }} />
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/10 border-t border-dashed border-red-500/40 pointer-events-none z-10" style={{ height: `${0.591 * pxPerInchCover}px` }} />
                        <div className="absolute top-0 bottom-0 left-0 bg-slate-900/10 border-r border-dashed border-red-500/40 pointer-events-none z-10" style={{ width: `${0.591 * pxPerInchCover}px` }} />
                        <div className="absolute top-0 bottom-0 right-0 bg-slate-900/10 border-l border-dashed border-red-500/40 pointer-events-none z-10" style={{ width: `${0.591 * pxPerInchCover}px` }} />

                        {/* Hinge channels */}
                        <div className="absolute top-0 bottom-0 bg-slate-900/10 border-l border-r border-dashed border-blue-500/40 pointer-events-none z-10" style={{
                          left: `${(0.591 + activeTrimSize.width) * pxPerInchCover}px`,
                          width: `${0.394 * pxPerInchCover}px`
                        }} />
                        <div className="absolute top-0 bottom-0 bg-slate-900/10 border-l border-r border-dashed border-blue-500/40 pointer-events-none z-10" style={{
                          left: `${(0.591 + activeTrimSize.width + 0.394 + spineWidth) * pxPerInchCover}px`,
                          width: `${0.394 * pxPerInchCover}px`
                        }} />
                      </>
                    )}

                    {/* Standard safety and bleed labels */}
                    {bindingType !== 'hardcover' && (
                      <>
                        <div className="absolute inset-1 border border-red-500/25 border-dashed pointer-events-none" />
                        <div className="absolute inset-3 border border-indigo-500/15 pointer-events-none" />
                      </>
                    )}

                    {renderSmartGuides('full')}
                  </div>
                </div>
              ) : (
                /* Parts Layout: Back, Spine, Front Cover */
                <div 
                  className="relative flex border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden shadow-lg transition-all max-w-full"
                  style={{ height: `${coverPreviewHeight}px` }}
                  ref={canvasRef}
                >
                  {/* Back Cover Block */}
                  <div 
                    onMouseDown={(e) => {
                      setSelectedElement('back');
                      if (backCover) handleDragStart(e, 'back');
                    }}
                    className={`relative flex items-center justify-center border-r border-dashed border-slate-350 dark:border-slate-800 cursor-pointer overflow-hidden transition-all ${
                      selectedElement === 'back' ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                    }`}
                    style={{ width: `${coverPagePxWidth}px` }}
                  >
                    {backCover ? (
                      <PreviewImage
                        src={backCover.preview}
                        xScale={backCover.xScale}
                        yScale={backCover.yScale}
                        xOffset={backCover.xOffset}
                        yOffset={backCover.yOffset}
                        containerWidth={coverPagePxWidth}
                        containerHeight={coverPreviewHeight}
                        isDragging={dragState.isDragging && selectedElement === 'back'}
                        isBleedEnabled={true}
                        isCover={true}
                        isSelected={selectedElement === 'back'}
                        onResizeStart={(ev, hnd, iw, ih) => handleResizeStart(ev, hnd, iw, ih, 'back')}
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Задняя часть</span>
                    )}

                    {/* Hardcover Guidelines */}
                    {bindingType === 'hardcover' ? (
                      <>
                        <div className="absolute top-0 left-0 right-0 bg-slate-900/10 border-b border-dashed border-red-500/40 pointer-events-none z-10" style={{ height: `${0.591 * pxPerInchCover}px` }} />
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/10 border-t border-dashed border-red-500/40 pointer-events-none z-10" style={{ height: `${0.591 * pxPerInchCover}px` }} />
                        <div className="absolute top-0 bottom-0 left-0 bg-slate-900/10 border-r border-dashed border-red-500/40 pointer-events-none z-10" style={{ width: `${0.591 * pxPerInchCover}px` }} />
                        <div className="absolute top-0 bottom-0 right-0 bg-slate-900/10 border-l border-dashed border-blue-500/40 pointer-events-none z-10" style={{ width: `${0.394 * pxPerInchCover}px` }} />
                        
                        <div className="absolute border border-indigo-500/30 pointer-events-none z-10" style={{
                          top: `${(0.591 + 0.375) * pxPerInchCover}px`,
                          bottom: `${(0.591 + 0.375) * pxPerInchCover}px`,
                          left: `${(0.591 + 0.375) * pxPerInchCover}px`,
                          right: `${(0.394 + 0.375) * pxPerInchCover}px`
                        }} />
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-1 border border-red-500/30 border-dashed pointer-events-none" />
                        <div className="absolute inset-3 border border-indigo-500/20 pointer-events-none" />
                      </>
                    )}
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
                        containerHeight={coverPreviewHeight}
                        isDragging={dragState.isDragging && selectedElement === 'spine'}
                        isBleedEnabled={true}
                        isCover={true}
                        isSelected={selectedElement === 'spine'}
                        onResizeStart={(ev, hnd, iw, ih) => handleResizeStart(ev, hnd, iw, ih, 'spine')}
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

                    {bindingType === 'hardcover' ? (
                      <>
                        <div className="absolute top-0 left-0 right-0 bg-slate-900/10 border-b border-dashed border-red-500/40 pointer-events-none z-10" style={{ height: `${0.591 * pxPerInchCover}px` }} />
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/10 border-t border-dashed border-red-500/40 pointer-events-none z-10" style={{ height: `${0.591 * pxPerInchCover}px` }} />
                      </>
                    ) : (
                      selectedElement === 'spine' && (
                        <div
                          className="absolute border border-dashed border-red-500/60 pointer-events-none z-10"
                          style={{
                            left: `${0.0625 * pxPerInchCover}px`,
                            right: `${0.0625 * pxPerInchCover}px`,
                            top: `${0.25 * pxPerInchCover}px`,
                            bottom: `${0.25 * pxPerInchCover}px`
                          }}
                        />
                      )
                    )}
                    {renderSmartGuides('spine')}
                  </div>

                  {/* Front Cover Block */}
                  <div 
                    onMouseDown={(e) => {
                      setSelectedElement('front');
                      if (frontCover) handleDragStart(e, 'front');
                    }}
                    className={`relative flex items-center justify-center cursor-pointer overflow-hidden transition-all ${
                      selectedElement === 'front' ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                    }`}
                    style={{ width: `${coverPagePxWidth}px` }}
                  >
                    {frontCover ? (
                      <PreviewImage
                        src={frontCover.preview}
                        xScale={frontCover.xScale}
                        yScale={frontCover.yScale}
                        xOffset={frontCover.xOffset}
                        yOffset={frontCover.yOffset}
                        containerWidth={coverPagePxWidth}
                        containerHeight={coverPreviewHeight}
                        isDragging={dragState.isDragging && selectedElement === 'front'}
                        isBleedEnabled={true}
                        isCover={true}
                        isSelected={selectedElement === 'front'}
                        onResizeStart={(ev, hnd, iw, ih) => handleResizeStart(ev, hnd, iw, ih, 'front')}
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Передняя часть</span>
                    )}

                    {/* Hardcover Guidelines */}
                    {bindingType === 'hardcover' ? (
                      <>
                        <div className="absolute top-0 left-0 right-0 bg-slate-900/10 border-b border-dashed border-red-500/40 pointer-events-none z-10" style={{ height: `${0.591 * pxPerInchCover}px` }} />
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/10 border-t border-dashed border-red-500/40 pointer-events-none z-10" style={{ height: `${0.591 * pxPerInchCover}px` }} />
                        <div className="absolute top-0 bottom-0 right-0 bg-slate-900/10 border-l border-dashed border-red-500/40 pointer-events-none z-10" style={{ width: `${0.591 * pxPerInchCover}px` }} />
                        <div className="absolute top-0 bottom-0 left-0 bg-slate-900/10 border-r border-dashed border-blue-500/40 pointer-events-none z-10" style={{ width: `${0.394 * pxPerInchCover}px` }} />
                        
                        <div className="absolute border border-indigo-500/30 pointer-events-none z-10" style={{
                          top: `${(0.591 + 0.375) * pxPerInchCover}px`,
                          bottom: `${(0.591 + 0.375) * pxPerInchCover}px`,
                          right: `${(0.591 + 0.375) * pxPerInchCover}px`,
                          left: `${(0.394 + 0.375) * pxPerInchCover}px`
                        }} />
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-1 border border-red-500/30 border-dashed pointer-events-none" />
                        <div className="absolute inset-3 border border-indigo-500/20 pointer-events-none" />
                      </>
                    )}
                    {renderSmartGuides('front')}
                  </div>
                </div>
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

                    return (
                      <div className="flex flex-col items-center gap-4">
                        {/* 2D Spread Side-by-Side Pages */}
                        <div className="flex border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden shadow-lg">
                          
                          {/* Left page container */}
                          <div
                            onClick={() => leftPage && setSelectedPageId(leftPage.id)}
                            onMouseDown={(e) => {
                              if (leftPage && !leftPage.isBlank) {
                                setSelectedPageId(leftPage.id);
                                handleDragStart(e, null, leftPage.id);
                              }
                            }}
                            className={`relative border-r border-dashed border-slate-300 dark:border-slate-800 overflow-hidden cursor-pointer flex items-center justify-center transition-all ${
                              leftPage && selectedPageId === leftPage.id ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                            }`}
                            style={{
                              width: `${interiorPagePxWidth}px`,
                              height: `${interiorPreviewHeight}px`
                            }}
                          >
                            {leftPage ? (
                              leftPage.isBlank ? (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 bg-slate-100/40">
                                  <BookOpen className="w-8 h-8 mb-2 opacity-35" />
                                  <span className="text-[10px] font-bold uppercase">Пустой лист</span>
                                </div>
                              ) : (
                                <PreviewImage
                                  src={leftPage.preview}
                                  xScale={leftPage.xScale}
                                  yScale={leftPage.yScale}
                                  xOffset={leftPage.xOffset}
                                  yOffset={leftPage.yOffset}
                                  containerWidth={interiorPagePxWidth}
                                  containerHeight={interiorPreviewHeight}
                                  isDragging={dragState.isDragging && selectedPageId === leftPage.id}
                                  isBleedEnabled={hasBleed}
                                  isCover={false}
                                  isOdd={false}
                                  isSelected={selectedPageId === leftPage.id}
                                  onResizeStart={(ev, hnd, iw, ih) => handleResizeStart(ev, hnd, iw, ih, null, leftPage.id)}
                                />
                              )
                            ) : null}
                            
                            <div className="absolute inset-1 border border-red-500/20 border-dashed pointer-events-none" />
                            <div className="absolute inset-3 border border-indigo-500/10 pointer-events-none" />
                            {leftPage && !leftPage.isBlank && renderSmartGuides(null, leftPage.id)}
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
                            className={`relative overflow-hidden cursor-pointer flex items-center justify-center transition-all ${
                              rightPage && selectedPageId === rightPage.id ? 'ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-100/50'
                            }`}
                            style={{
                              width: `${interiorPagePxWidth}px`,
                              height: `${interiorPreviewHeight}px`
                            }}
                          >
                            {rightPage ? (
                              rightPage.isBlank ? (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 bg-slate-100/40">
                                  <BookOpen className="w-8 h-8 mb-2 opacity-35" />
                                  <span className="text-[10px] font-bold uppercase">Пустой лист</span>
                                </div>
                              ) : (
                                <PreviewImage
                                  src={rightPage.preview}
                                  xScale={rightPage.xScale}
                                  yScale={rightPage.yScale}
                                  xOffset={rightPage.xOffset}
                                  yOffset={rightPage.yOffset}
                                  containerWidth={interiorPagePxWidth}
                                  containerHeight={interiorPreviewHeight}
                                  isDragging={dragState.isDragging && selectedPageId === rightPage.id}
                                  isBleedEnabled={hasBleed}
                                  isCover={false}
                                  isOdd={true}
                                  isSelected={selectedPageId === rightPage.id}
                                  onResizeStart={(ev, hnd, iw, ih) => handleResizeStart(ev, hnd, iw, ih, null, rightPage.id)}
                                />
                              )
                            ) : null}
                            
                            <div className="absolute inset-1 border border-red-500/20 border-dashed pointer-events-none" />
                            <div className="absolute inset-3 border border-indigo-500/10 pointer-events-none" />
                            {rightPage && !rightPage.isBlank && renderSmartGuides(null, rightPage.id)}
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
                  {coverType === 'full' && fullCover ? (
                    <div className="bg-white relative h-full w-full overflow-hidden border border-slate-200">
                      {/* Left align image but translate by front-cover offset */}
                      <PreviewImage
                        src={fullCover.preview}
                        xScale={fullCover.xScale}
                        yScale={fullCover.yScale}
                        xOffset={fullCover.xOffset - (activeTrimSize.width + spineWidth + (bindingType === 'hardcover' ? (0.591 + 0.394) : 0.125)) * 2 * 72}
                        yOffset={fullCover.yOffset}
                        containerWidth={coverPagePxWidth * 2 + spinePxWidth}
                        containerHeight={coverPreviewHeight}
                        isDragging={false}
                        isBleedEnabled={true}
                        isCover={true}
                      />
                    </div>
                  ) : frontCover ? (
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
                  {coverType === 'full' && fullCover ? (
                    <div className="bg-white relative h-full w-full overflow-hidden border border-slate-200">
                      {/* Left align image (shows back cover half naturally) */}
                      <PreviewImage
                        src={fullCover.preview}
                        xScale={fullCover.xScale}
                        yScale={fullCover.yScale}
                        xOffset={fullCover.xOffset}
                        yOffset={fullCover.yOffset}
                        containerWidth={coverPagePxWidth * 2 + spinePxWidth}
                        containerHeight={coverPreviewHeight}
                        isDragging={false}
                        isBleedEnabled={true}
                        isCover={true}
                      />
                    </div>
                  ) : backCover ? (
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
