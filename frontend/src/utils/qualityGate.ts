// Image Quality Gate — Real implementation
// Checks: blur, brightness, contrast, size

export interface QualityResult {
  passed: boolean
  reasons: string[]
  metrics: {
    sharpness: number
    brightness: number
    contrast: number
    width: number
    height: number
  }
}

/**
 * Compute the variance of Laplacian as a sharpness metric.
 * Higher values = sharper image.
 */
function computeSharpness(imageData: ImageData): number {
  const { data, width, height } = imageData
  // Convert to grayscale
  const gray = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
  }

  // Apply Laplacian kernel: [0,1,0; 1,-4,1; 0,1,0]
  let sum = 0
  let sumSq = 0
  let count = 0

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const lap =
        gray[idx - width] +
        gray[idx - 1] +
        (-4) * gray[idx] +
        gray[idx + 1] +
        gray[idx + width]
      sum += lap
      sumSq += lap * lap
      count++
    }
  }

  const mean = sum / count
  const variance = sumSq / count - mean * mean
  return variance
}

/**
 * Compute mean brightness (0-255) of the image.
 */
function computeBrightness(imageData: ImageData): number {
  const { data } = imageData
  let sum = 0
  const pixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }

  return sum / pixelCount
}

/**
 * Compute standard deviation of pixel intensities as contrast metric.
 */
function computeContrast(imageData: ImageData): number {
  const { data } = imageData
  const pixelCount = data.length / 4
  let sum = 0
  let sumSq = 0

  for (let i = 0; i < data.length; i += 4) {
    const intensity = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    sum += intensity
    sumSq += intensity * intensity
  }

  const mean = sum / pixelCount
  const variance = sumSq / pixelCount - mean * mean
  return Math.sqrt(Math.max(0, variance))
}

// Thresholds
const SHARPNESS_THRESHOLD = 50      // Variance of Laplacian
const BRIGHTNESS_MIN = 40           // Too dark
const BRIGHTNESS_MAX = 220          // Too bright
const CONTRAST_THRESHOLD = 20       // Minimum std dev
const MIN_WIDTH = 200
const MIN_HEIGHT = 200

/**
 * Run all quality checks on a captured image.
 */
export function checkImageQuality(canvas: HTMLCanvasElement): QualityResult {
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const sharpness = computeSharpness(imageData)
  const brightness = computeBrightness(imageData)
  const contrast = computeContrast(imageData)
  const width = canvas.width
  const height = canvas.height

  const reasons: string[] = []

  if (sharpness < SHARPNESS_THRESHOLD) {
    reasons.push('tooBlurry')
  }
  if (brightness < BRIGHTNESS_MIN) {
    reasons.push('tooDark')
  }
  if (brightness > BRIGHTNESS_MAX) {
    reasons.push('tooBright')
  }
  if (contrast < CONTRAST_THRESHOLD) {
    reasons.push('lowContrast')
  }
  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    reasons.push('tooSmall')
  }

  return {
    passed: reasons.length === 0,
    reasons,
    metrics: { sharpness, brightness, contrast, width, height },
  }
}
