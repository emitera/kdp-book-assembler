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
   * @param {File|Blob} params.frontCover - Front Cover image file
   * @param {File|Blob} params.backCover - Back Cover image file
   * @param {Object} params.trimSize - Active trim size object
   * @param {Object} params.paperType - Active paper type object
   * @param {number} params.pageCount - Total number of pages
   * @param {string} params.spineColor - Spine background color (Hex string)
   * @param {string} params.spineText - Spine vertical text
   * @param {string} params.spineTextColor - Spine text color (Hex string)
   * @returns {Promise<Uint8Array>} The generated PDF bytes
   */
  static async generate({
    frontCover,
    backCover,
    trimSize,
    paperType,
    pageCount,
    spineColor,
    spineText,
    spineTextColor,
    spineImage
  }) {
    const frontCoverFile = frontCover?.file || frontCover;
    const backCoverFile = backCover?.file || backCover;

    if (!frontCoverFile || !backCoverFile) {
      throw new Error('Both Front Cover and Back Cover files are required to generate the cover PDF.');
    }

    // 1. Initialize pdf-lib Document
    const pdfDoc = await PDFDocument.create();

    // 2. Flatten cover images to JPEG using canvas to strip transparency layers
    const flattenedFrontBlob = await flattenImageToJPEG(frontCoverFile);
    const flattenedBackBlob = await flattenImageToJPEG(backCoverFile);

    const frontArrayBuffer = await flattenedFrontBlob.arrayBuffer();
    const backArrayBuffer = await flattenedBackBlob.arrayBuffer();

    // 3. Embed JPEG files into the PDF document
    const embeddedFront = await pdfDoc.embedJpg(frontArrayBuffer);
    const embeddedBack = await pdfDoc.embedJpg(backArrayBuffer);

    // 3.1. Embed spine background image if provided
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

    // 4. Calculate KDP dimensions
    const spineWidth = calculateSpineWidth(pageCount, paperType.multiplier);
    const coverDims = calculateCoverDimensions(trimSize.width, trimSize.height, spineWidth);

    const wPoints = inchesToPoints(coverDims.width);
    const hPoints = inchesToPoints(coverDims.height);

    const bleedPoints = inchesToPoints(0.125);
    const trimWidthPoints = inchesToPoints(trimSize.width);
    const spineWidthPoints = inchesToPoints(spineWidth);

    // 5. Add Cover page
    const page = pdfDoc.addPage([wPoints, hPoints]);

    // Helper to parse Hex color to RGB
    const parseHexToRgb = (hex) => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
      const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
      const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
      return rgb(r, g, b);
    };

    // 6. Draw spine color as page background (to cover full spread safely)
    const spineRgb = parseHexToRgb(spineColor || '#FFFFFF');
    page.drawRectangle({
      x: 0,
      y: 0,
      width: wPoints,
      height: hPoints,
      color: spineRgb
    });

    const backWidthPoints = trimWidthPoints + bleedPoints;

    // 6.1. Draw spine background image if provided
    if (embeddedSpine) {
      const spineXScale = spineImage?.xScale || 1.0;
      const spineYScale = spineImage?.yScale || 1.0;
      const spineXOffset = spineImage?.xOffset || 0;
      const spineYOffset = spineImage?.yOffset || 0;

      const drawSpineWidth = spineWidthPoints * spineXScale;
      const drawSpineHeight = hPoints * spineYScale;
      const spineCenterX = (spineWidthPoints - drawSpineWidth) / 2;
      const spineCenterY = (hPoints - drawSpineHeight) / 2;

      page.drawImage(embeddedSpine, {
        x: backWidthPoints + spineCenterX + spineXOffset,
        y: spineCenterY - spineYOffset,
        width: drawSpineWidth,
        height: drawSpineHeight
      });
    }

    // 7. Draw Back Cover image (Left Side)
    // Back Cover covers: x from 0 to (TrimWidth + Bleed)
    const backXScale = backCover?.xScale || 1.0;
    const backYScale = backCover?.yScale || 1.0;
    const backXOffset = backCover?.xOffset || 0;
    const backYOffset = backCover?.yOffset || 0;

    const drawBackWidth = backWidthPoints * backXScale;
    const drawBackHeight = hPoints * backYScale;
    const backCenterX = (backWidthPoints - drawBackWidth) / 2;
    const backCenterY = (hPoints - drawBackHeight) / 2;

    page.drawImage(embeddedBack, {
      x: backCenterX + backXOffset,
      y: backCenterY - backYOffset,
      width: drawBackWidth,
      height: drawBackHeight
    });

    // 8. Draw Front Cover image (Right Side)
    // Front Cover covers: x from (TrimWidth + Bleed + SpineWidth) to total width
    const frontXPoints = backWidthPoints + spineWidthPoints;
    const frontWidthPoints = trimWidthPoints + bleedPoints;

    const frontXScale = frontCover?.xScale || 1.0;
    const frontYScale = frontCover?.yScale || 1.0;
    const frontXOffset = frontCover?.xOffset || 0;
    const frontYOffset = frontCover?.yOffset || 0;

    const drawFrontWidth = frontWidthPoints * frontXScale;
    const drawFrontHeight = hPoints * frontYScale;
    const frontCenterX = (frontWidthPoints - drawFrontWidth) / 2;
    const frontCenterY = (hPoints - drawFrontHeight) / 2;

    page.drawImage(embeddedFront, {
      x: frontXPoints + frontCenterX + frontXOffset,
      y: frontCenterY - frontYOffset,
      width: drawFrontWidth,
      height: drawFrontHeight
    });

    // 9. Draw Spine Text if page count is eligible
    if (pageCount >= 79 && spineText && spineText.trim() !== '') {
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Calculate font size that safely fits the spine width with safety margins
      // KDP requires at least 0.0625" (4.5 pt) safety margin on both sides of spine text
      const safetyMargin = inchesToPoints(0.0625);
      const maxTextHeight = spineWidthPoints - (safetyMargin * 2);
      
      if (maxTextHeight > 0) {
        // Cap font size between 6pt and 10pt depending on spine width
        const fontSize = Math.min(10, Math.max(6, maxTextHeight));
        
        const cleanText = spineText.toUpperCase().trim();
        const textWidth = font.widthOfTextAtSize(cleanText, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        // Center spine X: middle of spine area
        const spineCenterX = backWidthPoints + (spineWidthPoints / 2);
        
        // With -90 degree rotation (clockwise):
        // Bounding box: X extends to the left from starting x. Y extends downwards from starting y.
        // We align baseline so that starting x is (spineCenterX + textHeight / 2)
        const startX = spineCenterX + (textHeight / 2.5);
        // Center vertically on page:
        const startY = (hPoints / 2) + (textWidth / 2);

        // Ensure text length does not exceed page height (minus margins)
        if (textWidth < hPoints - inchesToPoints(0.5)) {
          const textRgb = parseHexToRgb(spineTextColor || '#000000');
          page.drawText(cleanText, {
            x: startX,
            y: startY,
            size: fontSize,
            font: font,
            color: textRgb,
            rotate: degrees(-90)
          });
        }
      }
    }

    // 10. Save and return PDF bytes
    return await pdfDoc.save();
  }
}
