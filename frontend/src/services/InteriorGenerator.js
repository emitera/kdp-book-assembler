import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { flattenImageToJPEG } from '../utils/canvasHelper';
import {
  calculateInteriorDimensions,
  inchesToPoints
} from '../utils/kdpMath';

export class InteriorGenerator {
  /**
   * Generates a KDP-compliant Interior PDF.
   * @param {Object} params
   * @param {Array} params.interiorPages - Array of interior page objects { id, file, preview }
   * @param {Object} params.trimSize - Active trim size object
   * @param {boolean} params.hasBleed - Whether the interior pages have bleed
   * @param {boolean} params.isDemoMode - If true, restricts to 10 pages and adds watermark
   * @param {Function} [params.onProgress] - Callback to report percentage progress (0 to 100)
   * @returns {Promise<Uint8Array>} The generated PDF bytes
   */
  static async generate({
    interiorPages,
    trimSize,
    hasBleed,
    isSingleSided,
    addBlankAtStart,
    isDemoMode,
    onProgress
  }) {
    if (!interiorPages || interiorPages.length === 0) {
      throw new Error('No interior pages provided for PDF assembly.');
    }

    const totalUploaded = interiorPages.length;

    // 1. Determine which pages to compile
    let pagesToCompile = [];
    
    // Add initial blank page if checked
    if (addBlankAtStart) {
      pagesToCompile.push(null);
    }

    // Add user pages and optional single-sided blank backings
    for (let i = 0; i < totalUploaded; i++) {
      pagesToCompile.push(interiorPages[i]);
      if (isSingleSided) {
        pagesToCompile.push(null);
      }
    }

    // Enforce even page count parity for KDP print books
    if (pagesToCompile.length % 2 !== 0) {
      pagesToCompile.push(null);
    }

    if (isDemoMode) {
      // Demo Mode: Truncate/cycle to exactly 10 pages
      const basePages = [...pagesToCompile];
      pagesToCompile = [];
      for (let i = 0; i < 10; i++) {
        pagesToCompile.push(basePages[i % basePages.length]);
      }
    }

    // 2. Initialize PDF Document
    const pdfDoc = await PDFDocument.create();
    const pageDims = calculateInteriorDimensions(trimSize.width, trimSize.height, hasBleed);

    const wPoints = inchesToPoints(pageDims.width);
    const hPoints = inchesToPoints(pageDims.height);
    const gutterShiftPoints = inchesToPoints(0.125); // Standard shift (9 points)

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 3. Sequential Page Processing to minimize browser memory usage
    for (let i = 0; i < pagesToCompile.length; i++) {
      if (onProgress) {
        onProgress(Math.round((i / pagesToCompile.length) * 100));
      }

      const currentPage = pdfDoc.addPage([wPoints, hPoints]);
      const pageData = pagesToCompile[i];
      const pageNumber = i + 1; // 1-indexed

      const isOdd = pageNumber % 2 !== 0;

      if (pageData !== null) {
        // Embed & Draw Image
        try {
          // Flatten page to JPEG (replaces transparency with solid white background)
          const flattenedBlob = await flattenImageToJPEG(pageData.file);
          const arrayBuffer = await flattenedBlob.arrayBuffer();
          const embeddedImage = await pdfDoc.embedJpg(arrayBuffer);

          // Determine target drawing rectangle based on Bleed status
          let targetW, targetH, baseX, baseY;
          if (hasBleed) {
            // Bleed is ON: Full physical canvas
            targetW = wPoints;
            targetH = hPoints;
            baseX = 0;
            baseY = 0;
          } else {
            // Bleed is OFF: KDP Safe Zone
            const marginLeft = isOdd ? inchesToPoints(0.375) : inchesToPoints(0.25);
            const marginRight = isOdd ? inchesToPoints(0.25) : inchesToPoints(0.375);
            const marginTop = inchesToPoints(0.25);
            const marginBottom = inchesToPoints(0.25);

            targetW = wPoints - (marginLeft + marginRight);
            targetH = hPoints - (marginTop + marginBottom);
            baseX = marginLeft;
            baseY = marginBottom;
          }

          // Retrieve user transform parameters
          const userX = pageData.xOffset || 0;
          const userY = pageData.yOffset || 0;
          const userScaleX = pageData.xScale || 1.0;
          const userScaleY = pageData.yScale || 1.0;

          // Compute aspect ratio contain dimensions
          const { width: imgW, height: imgH } = embeddedImage;
          const imgRatio = imgW / imgH;
          const containerRatio = targetW / targetH;

          let baseDrawW, baseDrawH;
          if (imgRatio > containerRatio) {
            baseDrawW = targetW;
            baseDrawH = targetW / imgRatio;
          } else {
            baseDrawH = targetH;
            baseDrawW = targetH * imgRatio;
          }

          const drawW = baseDrawW * userScaleX;
          const drawH = baseDrawH * userScaleY;

          // Align center within target rectangle
          const centerX = (targetW - drawW) / 2;
          const centerY = (targetH - drawH) / 2;

          currentPage.drawImage(embeddedImage, {
            x: baseX + centerX + userX,
            y: baseY + centerY - userY,
            width: drawW,
            height: drawH
          });
        } catch (err) {
          console.error(`Failed to process page ${pageNumber}:`, err);
          // Fallback: leave page blank (draw white) and add a warning text
          currentPage.drawText(`[Failed to render page image ${pageNumber}]`, {
            x: 50,
            y: hPoints / 2,
            size: 12,
            font: font,
            color: rgb(0.8, 0.2, 0.2)
          });
        }
      } else {
        // Null pageData represents a pure white page (intentionally left blank). Do nothing.
      }

      // 4. Apply Watermark in Demo Mode
      if (isDemoMode) {
        const watermarkText = 'DEMO MODE';
        const fontSize = 54;
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        // Center calculations for diagonal rotated text
        const rad = Math.PI / 4; // 45 degrees
        const centerX = wPoints / 2;
        const centerY = hPoints / 2;
        
        // Offset starting coordinates to center the rotated text bounding box
        const drawX = centerX - (textWidth / 2) * Math.cos(rad) + (textHeight / 2) * Math.sin(rad);
        const drawY = centerY - (textWidth / 2) * Math.sin(rad) - (textHeight / 2) * Math.cos(rad);

        currentPage.drawText(watermarkText, {
          x: drawX,
          y: drawY,
          size: fontSize,
          font: font,
          color: rgb(0.85, 0.2, 0.2), // Reddish
          opacity: 0.14,              // Semi-transparent
          rotate: degrees(45)
        });
      }
    }

    if (onProgress) {
      onProgress(100);
    }

    // 5. Save and return PDF bytes
    return await pdfDoc.save();
  }
}
