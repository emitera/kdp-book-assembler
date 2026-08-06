import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { flattenImageToJPEG } from '../utils/canvasHelper';
import {
  calculateSpineWidth,
  calculateCoverDimensions,
  inchesToPoints
} from '../utils/kdpMath';

export class CoverGenerator {
  /**
   * Generates a KDP-compliant Cover spread PDF.
   * @param {Object} params
   * @param {Object} params.frontCover - Front Cover image transform state
   * @param {Object} params.backCover - Back Cover image transform state
   * @param {Object} params.fullCover - Full Cover image transform state
   * @param {string} params.coverType - 'parts' | 'full'
   * @param {string} params.bindingType - 'paperback' | 'hardcover'
   * @param {Object} params.trimSize - Active trim size object
   * @param {Object} params.paperType - Active paper type object
   * @param {number} params.pageCount - Total number of pages
   * @param {string} params.spineColor - Spine background color (Hex string)
   * @param {string} params.spineText - Spine vertical text
   * @param {string} params.spineTextColor - Spine text color (Hex string)
   * @param {string} params.spineTextDirection - 'top-to-bottom' | 'bottom-to-top'
   * @param {Object} params.spineImage - Spine image transform state
   * @param {boolean} params.hasBleed - Whether pages have bleed (paperback)
   * @returns {Promise<Uint8Array>} The generated PDF bytes
   */
  static async generate({
    frontCover,
    backCover,
    fullCover,
    coverType = 'parts',
    bindingType = 'paperback',
    trimSize,
    paperType,
    pageCount,
    spineColor,
    spineText,
    spineTextColor,
    spineTextDirection,
    spineImage,
    hasBleed = true
  }) {
    const isFullCover = coverType === 'full';

    // 1. Initialize pdf-lib Document
    const pdfDoc = await PDFDocument.create();

    // Helper to parse Hex color to RGB
    const parseHexToRgb = (hex) => {
      const cleanHex = hex?.replace('#', '') || 'FFFFFF';
      const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
      const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
      const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
      return rgb(r, g, b);
    };

    // Calculate KDP dimensions
    const spineWidth = calculateSpineWidth(pageCount, paperType.multiplier);
    const coverDims = calculateCoverDimensions(trimSize.width, trimSize.height, spineWidth, hasBleed, bindingType);

    const wPoints = inchesToPoints(coverDims.width);
    const hPoints = inchesToPoints(coverDims.height);

    const trimWidthPoints = inchesToPoints(trimSize.width);
    const spineWidthPoints = inchesToPoints(spineWidth);

    // Add Cover page
    const page = pdfDoc.addPage([wPoints, hPoints]);

    // Draw spine color as background first
    const spineRgb = parseHexToRgb(spineColor || '#FFFFFF');
    page.drawRectangle({
      x: 0,
      y: 0,
      width: wPoints,
      height: hPoints,
      color: spineRgb
    });

    if (isFullCover) {
      const fullCoverFile = fullCover?.file || fullCover;
      if (!fullCoverFile) {
        throw new Error('Full Cover spread file is required in full layout mode.');
      }

      // Flatten and embed full cover
      const flattenedFullBlob = await flattenImageToJPEG(fullCoverFile);
      const fullArrayBuffer = await flattenedFullBlob.arrayBuffer();
      const embeddedFull = await pdfDoc.embedJpg(fullArrayBuffer);

      const fullXScale = fullCover?.xScale || 1.0;
      const fullYScale = fullCover?.yScale || 1.0;
      const fullXOffset = fullCover?.xOffset || 0;
      const fullYOffset = fullCover?.yOffset || 0;

      const { width: imgW, height: imgH } = embeddedFull;
      const imgRatio = imgW / imgH;
      const containerRatio = wPoints / hPoints;

      let baseDrawW, baseDrawH;
      if (imgRatio > containerRatio) {
        baseDrawW = wPoints;
        baseDrawH = wPoints / imgRatio;
      } else {
        baseDrawH = hPoints;
        baseDrawW = hPoints * imgRatio;
      }

      const drawW = baseDrawW * fullXScale;
      const drawH = baseDrawH * fullYScale;
      const centerX = (wPoints - drawW) / 2;
      const centerY = (hPoints - drawH) / 2;

      page.drawImage(embeddedFull, {
        x: centerX + fullXOffset,
        y: centerY - fullYOffset,
        width: drawW,
        height: drawH
      });
    } else {
      const frontCoverFile = frontCover?.file || frontCover;
      const backCoverFile = backCover?.file || backCover;

      if (!frontCoverFile || !backCoverFile) {
        throw new Error('Both Front Cover and Back Cover files are required to generate the cover PDF.');
      }

      // Flatten and embed Front and Back covers
      const flattenedFrontBlob = await flattenImageToJPEG(frontCoverFile);
      const flattenedBackBlob = await flattenImageToJPEG(backCoverFile);

      const frontArrayBuffer = await flattenedFrontBlob.arrayBuffer();
      const backArrayBuffer = await flattenedBackBlob.arrayBuffer();

      const embeddedFront = await pdfDoc.embedJpg(frontArrayBuffer);
      const embeddedBack = await pdfDoc.embedJpg(backArrayBuffer);

      // Width segments
      let backWidthPoints, frontWidthPoints;
      if (bindingType === 'hardcover') {
        const wrapPoints = inchesToPoints(0.591);
        const hingePoints = inchesToPoints(0.394);
        backWidthPoints = trimWidthPoints + wrapPoints + hingePoints;
        frontWidthPoints = trimWidthPoints + wrapPoints + hingePoints;
      } else {
        const bleedPoints = inchesToPoints(hasBleed ? 0.125 : 0);
        backWidthPoints = trimWidthPoints + bleedPoints;
        frontWidthPoints = trimWidthPoints + bleedPoints;
      }

      // 1. Draw Back Cover image (Left Side)
      const backXScale = backCover?.xScale || 1.0;
      const backYScale = backCover?.yScale || 1.0;
      const backXOffset = backCover?.xOffset || 0;
      const backYOffset = backCover?.yOffset || 0;

      const { width: backImgW, height: backImgH } = embeddedBack;
      const backImgRatio = backImgW / backImgH;
      const backContainerRatio = backWidthPoints / hPoints;

      let baseBackDrawW, baseBackDrawH;
      if (backImgRatio > backContainerRatio) {
        baseBackDrawW = backWidthPoints;
        baseBackDrawH = backWidthPoints / backImgRatio;
      } else {
        baseBackDrawH = hPoints;
        baseBackDrawW = hPoints * backImgRatio;
      }

      const drawBackWidth = baseBackDrawW * backXScale;
      const drawBackHeight = baseBackDrawH * backYScale;
      const backCenterX = (backWidthPoints - drawBackWidth) / 2;
      const backCenterY = (hPoints - drawBackHeight) / 2;

      page.drawImage(embeddedBack, {
        x: backCenterX + backXOffset,
        y: backCenterY - backYOffset,
        width: drawBackWidth,
        height: drawBackHeight
      });

      // 2. Draw Spine background image if provided (Middle Segment)
      let embeddedSpine = null;
      const spineImageFile = spineImage?.file || spineImage;
      if (spineImageFile && (spineImageFile instanceof Blob || spineImageFile instanceof File)) {
        try {
          const flattenedSpineBlob = await flattenImageToJPEG(spineImageFile);
          const spineArrayBuffer = await flattenedSpineBlob.arrayBuffer();
          embeddedSpine = await pdfDoc.embedJpg(spineArrayBuffer);
        } catch (err) {
          console.error('Failed to embed spine image:', err);
        }
      }

      if (embeddedSpine) {
        const spineXScale = spineImage?.xScale || 1.0;
        const spineYScale = spineImage?.yScale || 1.0;
        const spineXOffset = spineImage?.xOffset || 0;
        const spineYOffset = spineImage?.yOffset || 0;

        const { width: imgW, height: imgH } = embeddedSpine;
        const imgRatio = imgW / imgH;
        const containerRatio = spineWidthPoints / hPoints;

        let baseDrawW, baseDrawH;
        if (imgRatio > containerRatio) {
          baseDrawW = spineWidthPoints;
          baseDrawH = spineWidthPoints / imgRatio;
        } else {
          baseDrawH = hPoints;
          baseDrawW = hPoints * imgRatio;
        }

        const drawSpineWidth = baseDrawW * spineXScale;
        const drawSpineHeight = baseDrawH * spineYScale;
        const spineCenterX = (spineWidthPoints - drawSpineWidth) / 2;
        const spineCenterY = (hPoints - drawSpineHeight) / 2;

        page.drawImage(embeddedSpine, {
          x: backWidthPoints + spineCenterX + spineXOffset,
          y: spineCenterY - spineYOffset,
          width: drawSpineWidth,
          height: drawSpineHeight
        });
      }

      // 3. Draw Front Cover image (Right Side)
      const frontXPoints = backWidthPoints + spineWidthPoints;
      const frontXScale = frontCover?.xScale || 1.0;
      const frontYScale = frontCover?.yScale || 1.0;
      const frontXOffset = frontCover?.xOffset || 0;
      const frontYOffset = frontCover?.yOffset || 0;

      const { width: frontImgW, height: frontImgH } = embeddedFront;
      const frontImgRatio = frontImgW / frontImgH;
      const frontContainerRatio = frontWidthPoints / hPoints;

      let baseFrontDrawW, baseFrontDrawH;
      if (frontImgRatio > frontContainerRatio) {
        baseFrontDrawW = frontWidthPoints;
        baseFrontDrawH = frontWidthPoints / frontImgRatio;
      } else {
        baseFrontDrawH = hPoints;
        baseFrontDrawW = hPoints * frontImgRatio;
      }

      const drawFrontWidth = baseFrontDrawW * frontXScale;
      const drawFrontHeight = baseFrontDrawH * frontYScale;
      const frontCenterX = (frontWidthPoints - drawFrontWidth) / 2;
      const frontCenterY = (hPoints - drawFrontHeight) / 2;

      page.drawImage(embeddedFront, {
        x: frontXPoints + frontCenterX + frontXOffset,
        y: frontCenterY - frontYOffset,
        width: drawFrontWidth,
        height: drawFrontHeight
      });
    }

    // 9. Draw Spine Text if page count is eligible
    if (pageCount >= 79 && spineText && spineText.trim() !== '') {
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const safetyMargin = inchesToPoints(0.0625);
      const maxTextHeight = spineWidthPoints - (safetyMargin * 2);
      
      if (maxTextHeight > 0) {
        const fontSize = Math.min(10, Math.max(6, maxTextHeight));
        const cleanText = spineText.toUpperCase().trim();
        const textWidth = font.widthOfTextAtSize(cleanText, fontSize);
        const capHeight = fontSize * 0.7; // Helvetica Bold cap height estimation
        
        let backWidthPoints;
        if (bindingType === 'hardcover') {
          backWidthPoints = trimWidthPoints + inchesToPoints(0.591) + inchesToPoints(0.394);
        } else {
          backWidthPoints = trimWidthPoints + inchesToPoints(hasBleed ? 0.125 : 0);
        }

        const spineCenterX = backWidthPoints + (spineWidthPoints / 2);
        
        let startX, startY, rotateAngle;
        
        if (spineTextDirection === 'bottom-to-top') {
          rotateAngle = degrees(90);
          startX = spineCenterX + (capHeight / 2);
          startY = (hPoints / 2) - (textWidth / 2);
        } else {
          rotateAngle = degrees(-90);
          startX = spineCenterX - (capHeight / 2);
          startY = (hPoints / 2) + (textWidth / 2);
        }

        // Ensure text length does not exceed page height minus safety margins
        const maxAllowedLength = hPoints - inchesToPoints(0.5);
        if (textWidth <= maxAllowedLength) {
          const textRgb = parseHexToRgb(spineTextColor || '#000000');
          page.drawText(cleanText, {
            x: startX,
            y: startY,
            size: fontSize,
            font: font,
            color: textRgb,
            rotate: rotateAngle
          });
        }
      }
    }

    // Save and return PDF bytes
    return await pdfDoc.save();
  }
}
