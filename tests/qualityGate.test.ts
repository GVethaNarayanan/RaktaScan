import { checkImageQuality } from '../frontend/src/utils/qualityGate'

console.log('--- Testing Quality Gate Logic ---')

// Mock Canvas for testing quality gate math
class MockContext2D {
  width: number
  height: number
  constructor(w: number, h: number) {
    this.width = w
    this.height = h
  }
  getImageData(x: number, y: number, w: number, h: number) {
    const data = new Uint8ClampedArray(w * h * 4)
    // fill with dummy values (gradient/noise)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = (i % 255)     // R
      data[i + 1] = (i % 200) // G
      data[i + 2] = (i % 150) // B
      data[i + 3] = 255       // A
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

const testCanvasGood = new MockCanvas(640, 480) as any
const resGood = checkImageQuality(testCanvasGood)
console.log('Sample Image Quality Result:', resGood)

if (typeof resGood.passed === 'boolean' && resGood.metrics) {
  console.log('✓ Quality Gate unit test PASSED')
} else {
  console.error('✗ Quality Gate test FAILED')
  process.exit(1)
}
