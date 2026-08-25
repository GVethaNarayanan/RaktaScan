// ONNX Runtime Web Inference for MobileNetV3
import * as ort from 'onnxruntime-web'
import { preprocessImage } from './preprocessing'

export type RiskLevel = 'low' | 'moderate' | 'high'

export interface InferenceResult {
  riskLevel: RiskLevel
  confidence: number
  rawOutput: number[]
  inferenceTime: number
  modelVersion: string
  isPrototype: boolean
}

let session: ort.InferenceSession | null = null

/**
 * Initialize the ONNX Runtime inference session.
 */
export async function initModel(): Promise<void> {
  if (session) return

  // Configure ONNX Runtime Web
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.3/dist/'

  try {
    session = await ort.InferenceSession.create('/models/raktascan_mobilenetv3.onnx', {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    })
    console.log('ONNX model loaded successfully')
    console.log('Input names:', session.inputNames)
    console.log('Output names:', session.outputNames)
  } catch (err) {
    console.error('Failed to load ONNX model:', err)
    throw err
  }
}

/**
 * Map raw model output to risk level.
 * For binary classification: output is probability of anemia risk.
 */
function mapToRiskLevel(probability: number): RiskLevel {
  if (probability < 0.3) return 'low'
  if (probability < 0.7) return 'moderate'
  return 'high'
}

/**
 * Run inference on a preprocessed image canvas.
 */
export async function runInference(imageCanvas: HTMLCanvasElement): Promise<InferenceResult> {
  if (!session) {
    await initModel()
  }

  const preprocessed = preprocessImage(imageCanvas)

  // Create input tensor: [1, 3, 224, 224]
  const inputTensor = new ort.Tensor('float32', preprocessed.tensor, [1, 3, 224, 224])

  const startTime = performance.now()

  const results = await session!.run({
    [session!.inputNames[0]]: inputTensor,
  })

  const inferenceTime = performance.now() - startTime

  // Get output — expecting sigmoid probability or logits
  const outputData = results[session!.outputNames[0]].data as Float32Array
  const rawOutput = Array.from(outputData)

  // Apply sigmoid if output is logits (single value)
  let probability: number
  if (rawOutput.length === 1) {
    probability = 1 / (1 + Math.exp(-rawOutput[0]))
  } else if (rawOutput.length === 2) {
    // Softmax for 2-class
    const maxVal = Math.max(rawOutput[0], rawOutput[1])
    const exp0 = Math.exp(rawOutput[0] - maxVal)
    const exp1 = Math.exp(rawOutput[1] - maxVal)
    probability = exp1 / (exp0 + exp1)
  } else {
    probability = rawOutput[0]
  }

  return {
    riskLevel: mapToRiskLevel(probability),
    confidence: probability,
    rawOutput,
    inferenceTime,
    modelVersion: 'mobilenetv3-prototype-v0.1',
    isPrototype: true,
  }
}

/**
 * Check if model is loaded
 */
export function isModelLoaded(): boolean {
  return session !== null
}
