/**
 * Image Validator & Auto-Resize Canvas Engine
 * Validates image resolution against 300 DPI KDP specifications and provides object-fit: cover auto-resizing.
 */

/**
 * Inspects pixel width and height of an image file
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

/**
 * Calculates exact required 300 DPI dimensions in inches & pixels
 */
export function calculateRequiredDimensions(trimWidth, trimHeight, hasBleed, isCover = false, spineWidth = 0) {
  let widthInches = trimWidth;
  let heightInches = trimHeight;

  if (isCover) {
    // Cover spread = Back Cover + Spine + Front Cover + Bleed (0.125" top, bottom, left, right)
    widthInches = trimWidth * 2 + spineWidth + 0.25;
    heightInches = trimHeight + 0.25;
  } else {
    // Interior Page
    if (hasBleed) {
      widthInches = trimWidth + 0.125; // Bleed on outer edge
      heightInches = trimHeight + 0.25; // Bleed top & bottom
    }
  }

  const widthPx = Math.round(widthInches * 300);
  const heightPx = Math.round(heightInches * 300);

  return {
    widthInches: parseFloat(widthInches.toFixed(3)),
    heightInches: parseFloat(heightInches.toFixed(3)),
    widthPx,
    heightPx
  };
}

/**
 * Resizes an image file onto a 300 DPI canvas using object-fit: cover logic and white background
 */
export function resizeImageToFit(file, targetWidthPx, targetHeightPx) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidthPx;
      canvas.height = targetHeightPx;
      const ctx = canvas.getContext('2d');

      // 1. Fill background with white (KDP standard)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);

      // 2. Compute object-fit: contain scale and center offsets
      const scale = Math.min(targetWidthPx / img.naturalWidth, targetHeightPx / img.naturalHeight);
      const drawWidth = img.naturalWidth * scale;
      const drawHeight = img.naturalHeight * scale;
      const offsetX = (targetWidthPx - drawWidth) / 2;
      const offsetY = (targetHeightPx - drawHeight) / 2;

      // 3. Draw image centered
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // 4. Export to Blob as JPEG (high quality)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas blob generation failed'));
            return;
          }
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(resizedFile);
        },
        'image/jpeg',
        0.95
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}
