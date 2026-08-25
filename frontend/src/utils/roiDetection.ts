// Conjunctiva ROI Detection using MediaPipe Face Landmarker
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'

let faceLandmarker: FaceLandmarker | null = null

export interface ROIResult {
  detected: boolean
  roiCanvas: HTMLCanvasElement | null
  overlayCanvas: HTMLCanvasElement | null
  landmarks: number[][] | null
  errorMessage?: string
}

// Lower eyelid landmark indices from MediaPipe Face Mesh (468 landmarks)
// These correspond to the inner lower eyelid region
const LEFT_EYE_LOWER_INNER = [33, 7, 163, 144, 145, 153, 154, 155, 133]
const RIGHT_EYE_LOWER_INNER = [362, 382, 381, 380, 374, 373, 390, 249, 263]
// Inner lower eyelid (conjunctiva area candidates)
const LEFT_LOWER_EYELID = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7]
const RIGHT_LOWER_EYELID = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382]

/**
 * Initialize MediaPipe Face Landmarker
 */
export async function initFaceLandmarker(): Promise<void> {
  if (faceLandmarker) return

  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )

  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
    numFaces: 1,
    outputFacialTransformationMatrixes: false,
    outputFaceBlendshapes: false,
  })
}

/**
 * Detect face landmarks and extract conjunctiva ROI
 */
export async function detectROI(imageCanvas: HTMLCanvasElement): Promise<ROIResult> {
  if (!faceLandmarker) {
    try {
      await initFaceLandmarker()
    } catch {
      return {
        detected: false,
        roiCanvas: null,
        overlayCanvas: null,
        landmarks: null,
        errorMessage: 'Failed to initialize face detection model.',
      }
    }
  }

  const results = faceLandmarker!.detect(imageCanvas)

  if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
    return {
      detected: false,
      roiCanvas: null,
      overlayCanvas: null,
      landmarks: null,
      errorMessage: 'noFace',
    }
  }

  const landmarks = results.faceLandmarks[0]
  const width = imageCanvas.width
  const height = imageCanvas.height

  // Get both eye lower eyelid regions
  const allEyePoints = [...LEFT_LOWER_EYELID, ...RIGHT_LOWER_EYELID].map(idx => ({
    x: landmarks[idx].x * width,
    y: landmarks[idx].y * height,
  }))

  // Use left eye for primary ROI (typically better for right-handed capture)
  const leftEyePoints = LEFT_LOWER_EYELID.map(idx => ({
    x: landmarks[idx].x * width,
    y: landmarks[idx].y * height,
  }))

  // Compute bounding box with padding
  const padding = 15
  const minX = Math.max(0, Math.min(...leftEyePoints.map(p => p.x)) - padding)
  const maxX = Math.min(width, Math.max(...leftEyePoints.map(p => p.x)) + padding)
  const minY = Math.max(0, Math.min(...leftEyePoints.map(p => p.y)) - padding)
  const maxY = Math.min(height, Math.max(...leftEyePoints.map(p => p.y)) + padding)

  const roiWidth = maxX - minX
  const roiHeight = maxY - minY

  if (roiWidth < 20 || roiHeight < 10) {
    return {
      detected: false,
      roiCanvas: null,
      overlayCanvas: null,
      landmarks: null,
      errorMessage: 'noEye',
    }
  }

  // Create ROI crop
  const roiCanvas = document.createElement('canvas')
  roiCanvas.width = roiWidth
  roiCanvas.height = roiHeight
  const roiCtx = roiCanvas.getContext('2d')!
  roiCtx.drawImage(imageCanvas, minX, minY, roiWidth, roiHeight, 0, 0, roiWidth, roiHeight)

  // Create overlay visualization
  const overlayCanvas = document.createElement('canvas')
  overlayCanvas.width = width
  overlayCanvas.height = height
  const overlayCtx = overlayCanvas.getContext('2d')!
  overlayCtx.drawImage(imageCanvas, 0, 0)

  // Draw ROI rectangle
  overlayCtx.strokeStyle = '#22c55e'
  overlayCtx.lineWidth = 2
  overlayCtx.strokeRect(minX, minY, roiWidth, roiHeight)

  // Draw landmark points
  overlayCtx.fillStyle = '#22c55e'
  leftEyePoints.forEach(p => {
    overlayCtx.beginPath()
    overlayCtx.arc(p.x, p.y, 2, 0, Math.PI * 2)
    overlayCtx.fill()
  })

  // Draw label
  overlayCtx.fillStyle = '#22c55e'
  overlayCtx.font = '12px Inter, sans-serif'
  overlayCtx.fillText('Candidate Conjunctiva ROI', minX, minY - 5)

  // Also draw right eye landmarks for completeness
  const rightEyePoints = RIGHT_LOWER_EYELID.map(idx => ({
    x: landmarks[idx].x * width,
    y: landmarks[idx].y * height,
  }))
  overlayCtx.strokeStyle = '#22c55e44'
  overlayCtx.lineWidth = 1
  rightEyePoints.forEach(p => {
    overlayCtx.beginPath()
    overlayCtx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
    overlayCtx.fill()
  })

  return {
    detected: true,
    roiCanvas,
    overlayCanvas,
    landmarks: leftEyePoints.map(p => [p.x, p.y]),
  }
}
