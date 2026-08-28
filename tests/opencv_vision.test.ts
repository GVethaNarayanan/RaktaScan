import { computeLaplacianVariance, computeSpecularGlare, analyzeCanvasOpenCV5Quality, extractCanvasPallorFeatures, aggregateVideoSequence } from '../frontend/src/utils/opencv5Vision'

console.log('--- Testing OpenCV 5 Substantive Vision Module ---')

// Mock Canvas with high-contrast realistic texture
class MockContext2D {
  width: number
  height: number
  constructor(w: number, h: number) {
    this.width = w
    this.height = h
  }
  getImageData(x: number, y: number, w: number, h: number) {
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < data.length; i += 4) {
      const val = (i % 250)
      data[i] = val         // R (high variance 0-250)
      data[i + 1] = val / 2 // G
      data[i + 2] = val / 3 // B
      data[i + 3] = 255     // A
    }
    return { data, width: w, height: h }
  }
}

class MockCanvas {
  width: number
  height: number
  ctx: MockContext2D
  constructor(w: number, h: number) {
    this.width = w
    this.height = h
    this.ctx = new MockContext2D(w, h)
  }
  getContext(type: string) {
    return this.ctx
  }
}

const testCanvas = new MockCanvas(640, 480) as any

const quality = analyzeCanvasOpenCV5Quality(testCanvas)
console.log('1. Quality Analysis:', quality)

const pallor = extractCanvasPallorFeatures(testCanvas)
console.log('2. Pallor Features:', pallor)

const temporal = aggregateVideoSequence([testCanvas, testCanvas, testCanvas])
console.log('3. Temporal Aggregation:', temporal)

if (quality.passed && pallor.valid && temporal.validFrames === 3) {
  console.log('✓ OpenCV 5 Vision Module Unit Test PASSED')
} else {
  console.error('✗ OpenCV 5 Vision Test FAILED')
  process.exit(1)
}
