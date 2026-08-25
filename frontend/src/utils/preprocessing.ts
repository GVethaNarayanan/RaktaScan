// Image Preprocessing Pipeline for Model Inference

export interface PreprocessedImage {
  tensor: Float32Array
  width: number
  height: number
  channels: number
}

const MODEL_INPUT_SIZE = 224

/**
 * Preprocess an image canvas for MobileNetV3 inference.
 * - Resize to 224x224
 * - Convert to RGB
 * - Normalize to [0, 1] then apply ImageNet mean/std
 * - Convert to CHW Float32Array tensor
 */
export function preprocessImage(canvas: HTMLCanvasElement): PreprocessedImage {
  // Resize to model input size
  const resizedCanvas = document.createElement('canvas')
  resizedCanvas.width = MODEL_INPUT_SIZE
  resizedCanvas.height = MODEL_INPUT_SIZE
  const ctx = resizedCanvas.getContext('2d')!
  ctx.drawImage(canvas, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE)

  const imageData = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE)
  const { data } = imageData

  // ImageNet normalization constants
  const mean = [0.485, 0.456, 0.406]
  const std = [0.229, 0.224, 0.225]

  // Create CHW tensor (Channels, Height, Width)
  const size = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE
  const tensor = new Float32Array(3 * size)

  for (let i = 0; i < size; i++) {
    const pixelIdx = i * 4
    // Normalize to [0,1] then apply ImageNet mean/std
    tensor[i] = (data[pixelIdx] / 255 - mean[0]) / std[0]           // R channel
    tensor[size + i] = (data[pixelIdx + 1] / 255 - mean[1]) / std[1] // G channel
    tensor[2 * size + i] = (data[pixelIdx + 2] / 255 - mean[2]) / std[2] // B channel
  }

  return {
    tensor,
    width: MODEL_INPUT_SIZE,
    height: MODEL_INPUT_SIZE,
    channels: 3,
  }
}

/**
 * Convert a data URL or image element to a canvas for processing.
 */
export function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  return canvas
}
