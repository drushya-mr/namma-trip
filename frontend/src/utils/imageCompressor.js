/**
 * Image compressor and EXIF/GPS metadata stripper
 * Draws the image to an offscreen HTML5 canvas, which completely purges EXIF, GPS,
 * and camera hardware identifiers to guarantee user privacy.
 */
export async function processAndStripImage(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = {}) {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed / ಕೇವಲ JPEG, PNG, WebP ಚಿತ್ರಗಳಿಗೆ ಮಾತ್ರ ಅವಕಾಶ');
  }

  // Validate size <= 5 MB
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Image size must be less than 5 MB / ಚಿತ್ರದ ಗಾತ್ರ 5 MB ಗಿಂತ ಕಡಿಮೆ ಇರಬೇಕು');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Clean white background for transparency fallback
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Drawing onto canvas strips EXIF, GPS and all camera metadata
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed clean JPEG data URL
        const cleanDataUrl = canvas.toDataURL('image/jpeg', quality);

        resolve({
          dataUrl: cleanDataUrl,
          width,
          height,
          originalName: file.name
        });
      };

      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
