/**
 * Instagram Stories Share Card Generator (9:16 format - 1080x1920)
 * Uses native HTML5 Canvas to render a high-resolution story card
 */
export async function generateStoryShareCard({
  type = 'story', // 'story' | 'plan'
  title = '',
  placeNameKn = '',
  placeNameEn = '',
  district = '',
  rating = 5,
  spend = '',
  author = '',
  notes = '',
  imageUrl = null
}) {
  const width = 1080;
  const height = 1920;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Background gradient (Karnataka flag inspired: Rich Crimson & Sandalwood Gold)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#1E1B18');
  bgGrad.addColorStop(0.4, '#2D1B17');
  bgGrad.addColorStop(1, '#0C0A09');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Decorative Golden Border / Glow
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 12;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // 3. Top Branding Header
  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 56px "Noto Sans Kannada", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ನಮ್ಮ ಟ್ರಿಪ್ • NAMMA TRIP', width / 2, 140);

  ctx.fillStyle = '#E5E7EB';
  ctx.font = '36px "Noto Sans Kannada", sans-serif';
  ctx.fillText('ಕರ್ನಾಟಕ ಪ್ರವಾಸ ದರ್ಶನ | Explore Karnataka', width / 2, 200);

  // 4. Main Card Background
  ctx.fillStyle = '#1C1917';
  ctx.beginPath();
  ctx.roundRect(80, 260, width - 160, 1380, 40);
  ctx.fill();
  ctx.strokeStyle = '#44403C';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 5. Draw Photo if available
  let contentStartY = 320;
  if (imageUrl) {
    try {
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null); // graceful fallback
        image.src = imageUrl;
      });

      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(110, 290, width - 220, 680, 30);
        ctx.clip();
        ctx.drawImage(img, 110, 290, width - 220, 680);
        ctx.restore();
        contentStartY = 1030;
      }
    } catch (e) {
      // Continue without photo
    }
  }

  // 6. Place & Title Information
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FBBF24';
  ctx.font = 'bold 58px "Noto Sans Kannada", sans-serif';
  ctx.fillText(placeNameKn || title, 130, contentStartY + 60);

  if (placeNameEn) {
    ctx.fillStyle = '#A8A29E';
    ctx.font = '40px "Noto Sans Kannada", sans-serif';
    ctx.fillText(`${placeNameEn} • ${district}`, 130, contentStartY + 120);
  }

  // 7. Rating Stars
  if (rating) {
    ctx.fillStyle = '#F59E0B';
    ctx.font = '44px sans-serif';
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    ctx.fillText(stars, 130, contentStartY + 185);
  }

  // 8. Review or Plan Description
  ctx.fillStyle = '#FAFAF9';
  ctx.font = '36px "Noto Sans Kannada", sans-serif';
  const textToDraw = notes || title;
  const words = textToDraw.split(' ');
  let line = '';
  let lineY = contentStartY + 270;
  const maxLineWidth = width - 260;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxLineWidth && n > 0) {
      ctx.fillText(line, 130, lineY);
      line = words[n] + ' ';
      lineY += 56;
      if (lineY > 1520) break; // prevent overflow
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 130, lineY);

  // 9. Spend Badge if provided
  if (spend) {
    ctx.fillStyle = '#065F46';
    ctx.beginPath();
    ctx.roundRect(130, 1530, 320, 70, 16);
    ctx.fill();
    ctx.fillStyle = '#A7F3D0';
    ctx.font = 'bold 34px "Noto Sans Kannada", sans-serif';
    ctx.fillText(`ವೆಚ್ಚ / Spend: ₹${spend}`, 155, 1578);
  }

  // 10. Footer Watermark
  ctx.textAlign = 'center';
  ctx.fillStyle = '#D97706';
  ctx.font = 'bold 44px "Noto Sans Kannada", sans-serif';
  ctx.fillText('💛❤️ ಕನ್ನಡ ಡಿಜಿಟಲ್ ಇನ್ನೋವೇಶನ್ ಹ್ಯಾಕಥಾನ್ 2026 ❤️💛', width / 2, 1720);

  ctx.fillStyle = '#78716C';
  ctx.font = '32px sans-serif';
  ctx.fillText('Created with Namma Trip — AI Travel Planner for Karnataka', width / 2, 1775);

  return canvas.toDataURL('image/png');
}

/**
 * Triggers native Web Share API with fallback to image download
 */
export async function shareOrDownloadStory(cardDataUrl, title = 'Namma Trip Story') {
  try {
    if (navigator.share && navigator.canShare) {
      const res = await fetch(cardDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'namma-trip-story.png', { type: 'image/png' });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: 'ನನ್ನ ಕರ್ನಾಟಕ ಪ್ರವಾಸದ ಅನುಭವವನ್ನು ನಮ್ಮ ಟ್ರಿಪ್ ಮೂಲಕ ಹಂಚಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ! / Sharing my Karnataka travel story via Namma Trip.'
        });
        return { shared: true };
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Web Share failed, falling back to download:', err);
    } else {
      return { cancelled: true };
    }
  }

  // Fallback: direct download link
  const link = document.createElement('a');
  link.download = `namma-trip-story-${Date.now()}.png`;
  link.href = cardDataUrl;
  link.click();
  return { downloaded: true };
}
