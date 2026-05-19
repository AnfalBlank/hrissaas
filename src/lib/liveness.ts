/**
 * Liveness Detection — Challenge-Response berbasis frame analysis.
 *
 * Teknik:
 * 1. Ambil beberapa frame dari video stream.
 * 2. Hitung brightness rata-rata di region "mata" (center-upper area frame).
 * 3. Deteksi perubahan signifikan (blink = brightness drop singkat di eye region).
 * 4. Deteksi gerakan (head turn = pixel shift antar frame).
 *
 * Bukan AI neural network, tapi cukup efektif melawan:
 * - Foto statis (tidak ada motion)
 * - Screenshot/layar (tidak ada blink)
 *
 * Return confidence 0.0 - 1.0 berdasarkan:
 * - Motion detected: +0.3
 * - Blink detected: +0.4
 * - Face-like region brightness variance: +0.3
 */

export type LivenessResult = {
  passed: boolean;
  confidence: number;
  motionDetected: boolean;
  blinkDetected: boolean;
  framesCaptured: number;
};

type FrameData = {
  brightness: number;
  eyeRegionBrightness: number;
  pixelDiff: number; // vs previous frame
};

/**
 * Run liveness detection on a video element.
 * Captures frames over `durationMs` (default 3 seconds).
 * User harus kedipkan mata selama proses ini.
 *
 * @returns LivenessResult
 */
export function runLivenessDetection(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  opts?: { durationMs?: number; onProgress?: (pct: number) => void }
): Promise<LivenessResult> {
  const duration = opts?.durationMs ?? 3000;
  const frameInterval = 150; // capture setiap 150ms
  const totalFrames = Math.floor(duration / frameInterval);

  return new Promise((resolve) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || !video.videoWidth) {
      resolve({
        passed: false,
        confidence: 0,
        motionDetected: false,
        blinkDetected: false,
        framesCaptured: 0,
      });
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const frames: FrameData[] = [];
    let prevPixels: Uint8ClampedArray | null = null;
    let captured = 0;

    const interval = setInterval(() => {
      if (captured >= totalFrames) {
        clearInterval(interval);
        const result = analyzeFrames(frames);
        resolve(result);
        return;
      }

      ctx.drawImage(video, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;

      // Full-frame brightness
      const brightness = avgBrightness(pixels, 0, pixels.length);

      // Eye region: center-upper 40% width, 20-40% height (approximate eye area)
      const eyeY1 = Math.floor(canvas.height * 0.2);
      const eyeY2 = Math.floor(canvas.height * 0.4);
      const eyeX1 = Math.floor(canvas.width * 0.3);
      const eyeX2 = Math.floor(canvas.width * 0.7);
      const eyeRegionBrightness = regionBrightness(
        pixels,
        canvas.width,
        eyeX1,
        eyeY1,
        eyeX2,
        eyeY2
      );

      // Pixel diff vs previous frame (motion detection)
      let pixelDiff = 0;
      if (prevPixels) {
        pixelDiff = frameDifference(prevPixels, pixels);
      }
      prevPixels = new Uint8ClampedArray(pixels);

      frames.push({ brightness, eyeRegionBrightness, pixelDiff });
      captured++;

      opts?.onProgress?.(Math.round((captured / totalFrames) * 100));
    }, frameInterval);
  });
}

function avgBrightness(
  pixels: Uint8ClampedArray,
  start: number,
  end: number
): number {
  let sum = 0;
  let count = 0;
  for (let i = start; i < end; i += 4) {
    // Luminance: 0.299R + 0.587G + 0.114B
    sum += pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
    count++;
  }
  return count ? sum / count : 0;
}

function regionBrightness(
  pixels: Uint8ClampedArray,
  imgWidth: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  let sum = 0;
  let count = 0;
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const i = (y * imgWidth + x) * 4;
      sum += pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
      count++;
    }
  }
  return count ? sum / count : 0;
}

function frameDifference(
  prev: Uint8ClampedArray,
  curr: Uint8ClampedArray
): number {
  let diff = 0;
  const sampleStep = 16; // sample setiap 16 piksel untuk performa
  let count = 0;
  for (let i = 0; i < prev.length; i += 4 * sampleStep) {
    const pL = prev[i] * 0.299 + prev[i + 1] * 0.587 + prev[i + 2] * 0.114;
    const cL = curr[i] * 0.299 + curr[i + 1] * 0.587 + curr[i + 2] * 0.114;
    diff += Math.abs(pL - cL);
    count++;
  }
  return count ? diff / count : 0;
}

function analyzeFrames(frames: FrameData[]): LivenessResult {
  if (frames.length < 5) {
    return {
      passed: false,
      confidence: 0,
      motionDetected: false,
      blinkDetected: false,
      framesCaptured: frames.length,
    };
  }

  // Motion detection: average pixel diff > threshold (foto statis ≈ 0-1, orang hidup ≈ 3-15+)
  const avgMotion =
    frames.slice(1).reduce((s, f) => s + f.pixelDiff, 0) / (frames.length - 1);
  const motionDetected = avgMotion > 2.0;

  // Blink detection: cari dip signifikan di eye region brightness.
  // Blink = brightness drop ≥ 5 unit untuk 1-3 frame lalu naik lagi.
  const eyeBr = frames.map((f) => f.eyeRegionBrightness);
  let blinkDetected = false;
  const avgEyeBr = eyeBr.reduce((s, v) => s + v, 0) / eyeBr.length;

  for (let i = 1; i < eyeBr.length - 1; i++) {
    const dip = avgEyeBr - eyeBr[i];
    const recovery = eyeBr[i + 1] - eyeBr[i];
    // Blink: drop minimal 3 unit dari average, lalu recovery minimal 2
    if (dip > 3 && recovery > 2) {
      blinkDetected = true;
      break;
    }
  }

  // Variasi brightness (foto statis = variasi sangat rendah ≈ < 0.5)
  const brStd = standardDeviation(frames.map((f) => f.brightness));
  const hasVariance = brStd > 0.8;

  // Confidence score
  let confidence = 0;
  if (motionDetected) confidence += 0.35;
  if (blinkDetected) confidence += 0.40;
  if (hasVariance) confidence += 0.25;

  // Cap dan round
  confidence = Math.min(1, Math.round(confidence * 1000) / 1000);

  // Passed jika minimal motion + (blink OR variance)
  const passed = motionDetected && (blinkDetected || hasVariance) && confidence >= 0.6;

  return {
    passed,
    confidence,
    motionDetected,
    blinkDetected,
    framesCaptured: frames.length,
  };
}

function standardDeviation(arr: number[]): number {
  const n = arr.length;
  if (n === 0) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / n;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  return Math.sqrt(variance);
}
