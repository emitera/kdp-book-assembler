/**
 * Helper utilities for HTML5 Canvas image flattening and color extraction.
 */

/**
 * Flattens an image (PNG/JPG) onto a white background canvas and exports it as a JPEG Blob.
 * This removes transparent layers which are forbidden by Amazon KDP.
 * @param {File|Blob} file - The uploaded image file
 * @returns {Promise<Blob>} A promise resolving to a flattened JPEG Blob
 */
export function flattenImageToJPEG(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // Fill background with solid white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image on top
        ctx.drawImage(img, 0, 0);

        // Export to JPEG with maximum quality (1.0)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas export failed'));
            }
          },
          'image/jpeg',
          1.0
        );
      };
      img.onerror = () => reject(new Error('Failed to load image into element'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts the Hex color of the leftmost middle pixel of the image.
 * This is used to dynamically set the spine color.
 * @param {File|Blob} file - The uploaded front cover image
 * @returns {Promise<string>} Hex color code (e.g., "#aa3bff")
 */
export function extractLeftmostPixelColor(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // We only need a tiny canvas or standard sampling to read pixel color
        canvas.width = 10;
        canvas.height = 10;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // Draw the image scaled down or just draw a slice
        // To get the exact pixel at x=0, y=middle, we can draw the leftmost 1px column
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, 10, 10);

        // Sample pixel at (0, 5) which is in the middle of our scaled down leftmost column
        const pixelData = ctx.getImageData(0, 5, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        // Convert RGB to Hex
        const hex = rgbToHex(r, g, b);
        resolve(hex);
      };
      img.onerror = () => reject(new Error('Failed to load cover image for color extraction'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read cover file'));
    reader.readAsDataURL(file);
  });
}

function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}
