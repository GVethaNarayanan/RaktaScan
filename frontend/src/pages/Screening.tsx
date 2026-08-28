import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { analyzeCanvasOpenCV5Quality, extractCanvasPallorFeatures, OpenCVMetrics, PallorFeatures } from '../utils/opencv5Vision'
import { evaluatePerceptionStep, AgentDecision } from '../utils/agentEngine'
import { initFaceLandmarker, detectROI, ROIResult } from '../utils/roiDetection'
import { runInference, InferenceResult } from '../utils/inference'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

type ScreeningStep = 'camera' | 'quality' | 'roi' | 'inference'
type AlignmentStatus = 'no_face' | 'eye_closed' | 'misaligned' | 'perfect'

let liveLandmarker: FaceLandmarker | null = null

export default function Screening() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const [step, setStep] = useState<ScreeningStep>('camera')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  
  // OpenCV 5 Metrics & Agent Decision State
  const [openCVMetrics, setOpenCVMetrics] = useState<OpenCVMetrics | null>(null)
  const [pallorFeatures, setPallorFeatures] = useState<PallorFeatures | null>(null)
  const [agentDecision, setAgentDecision] = useState<AgentDecision | null>(null)
  const [roiResult, setROIResult] = useState<ROIResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [loadingModel, setLoadingModel] = useState(false)

  // Multi-Capture Active Perception Tracking
  const [captureCount, setCaptureCount] = useState<number>(1)
  const [firstCaptureFeatures, setFirstCaptureFeatures] = useState<PallorFeatures | null>(null)

  // Live Position & Eye Open/Closed Detection State
  const [alignmentStatus, setAlignmentStatus] = useState<AlignmentStatus>('misaligned')
  const [guidanceMessage, setGuidanceMessage] = useState<string>('Center eye inside guide reticle')

  // Initialize MediaPipe for Live Eye Tracking
  useEffect(() => {
    async function setupLandmarker() {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        liveLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        })
      } catch (e) {
        console.warn('Live MediaPipe Landmarker fallback:', e)
      }
    }
    setupLandmarker()
  }, [])

  // Live real-time frame analyzer with MediaPipe Eye Aspect Ratio (EAR)
  const analyzeLiveFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || step !== 'camera') return

    const video = videoRef.current
    if (video.readyState === 4 && video.videoWidth > 0) {
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.drawImage(video, 0, 0)
        
        // Analyze frame with OpenCV 5 Quality Engine
        const q = analyzeCanvasOpenCV5Quality(canvas)
        setOpenCVMetrics(q.metrics)

        let isEyeClosed = false
        let hasFace = false

        // Run MediaPipe 3D Landmark Eye Aspect Ratio (EAR) if loaded
        if (liveLandmarker && video.currentTime > 0) {
          try {
            const results = liveLandmarker.detectForVideo(video, performance.now())
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              hasFace = true
              const landmarks = results.faceLandmarks[0]
              
              // Left Eye Upper (#159) & Lower (#145), Left Corner (#33) & Right Corner (#133)
              const lUpper = landmarks[159]
              const lLower = landmarks[145]
              const lLeft = landmarks[33]
              const lRight = landmarks[133]

              const vertDist = Math.hypot(lUpper.x - lLower.x, lUpper.y - lLower.y)
              const horizDist = Math.hypot(lLeft.x - lRight.x, lLeft.y - lRight.y)
              const ear = vertDist / Math.max(0.001, horizDist)

              // EAR threshold < 0.18 indicates closed/squinted eye
              if (ear < 0.18) {
                isEyeClosed = true
              }
            }
          } catch (e) {
            // fallback
          }
        }

        // Fallback pixel intensity heuristic if MediaPipe model loading or no face
        if (!hasFace) {
          const reticleW = Math.floor(canvas.width * 0.4)
          const reticleH = Math.floor(canvas.height * 0.35)
          const reticleX = Math.floor((canvas.width - reticleW) / 2)
          const reticleY = Math.floor((canvas.height - reticleH) / 2)

          const frameData = ctx.getImageData(reticleX, reticleY, reticleW, reticleH)
          const { data } = frameData

          let totalBrightness = 0
          let darkPixelCount = 0
          let brightPixelCount = 0
          const totalPixels = data.length / 4

          for (let i = 0; i < data.length; i += 4) {
            const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
            totalBrightness += luma
            if (luma < 45) darkPixelCount++
            if (luma > 160) brightPixelCount++
          }

          if (darkPixelCount / totalPixels > 0.55) {
            isEyeClosed = true
          }
        }

        // Update Alignment Status & Alerts
        if (isEyeClosed) {
          setAlignmentStatus('eye_closed')
          setGuidanceMessage('⚠️ EYE CLOSED — Please open eye wide and pull down lower eyelid')
        } else if (q.metrics.brightness < 40 || q.metrics.brightness > 225) {
          setAlignmentStatus('misaligned')
          setGuidanceMessage(q.metrics.brightness < 40 ? '💡 Too dark — move into brighter lighting' : '☀️ Too bright — reduce direct glare')
        } else if (q.metrics.glarePercent > 8.0) {
          setAlignmentStatus('misaligned')
          setGuidanceMessage('✨ Specular Glare Detected — Tilt phone slightly')
        } else {
          setAlignmentStatus('perfect')
          setGuidanceMessage(
            captureCount === 2
              ? '⚡ 2nd VIEW CAPTURE: Hold steady for cross-validation'
              : '✨ PERFECT POSITION — TAKE PHOTO NOW!'
          )
        }
      }
    }

    if (cameraActive && step === 'camera') {
      animFrameRef.current = requestAnimationFrame(analyzeLiveFrame)
    }
  }, [cameraActive, step, captureCount])

  useEffect(() => {
    if (cameraActive && step === 'camera') {
      animFrameRef.current = requestAnimationFrame(analyzeLiveFrame)
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [cameraActive, step, analyzeLiveFrame])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
        setCameraError(null)
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      setCameraError(err.name === 'NotAllowedError'
        ? t('screening.permissionDenied')
        : 'Camera could not be accessed. Please enable permissions.'
      )
    }
  }, [t])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  // Capture frame & run OpenCV 5 + Agent Engine
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
    setCapturedImage(dataUrl)
    stopCamera()

    // 1. OpenCV 5 Quality Analysis
    setProcessing(true)
    const quality = analyzeCanvasOpenCV5Quality(canvas)
    const pallor = extractCanvasPallorFeatures(canvas)

    // Override quality if eye was closed during capture
    if (alignmentStatus === 'eye_closed') {
      quality.passed = false
      if (!quality.reasons.includes('low_contrast')) {
        quality.reasons.push('low_contrast')
      }
    }

    setOpenCVMetrics(quality.metrics)
    setPallorFeatures(pallor)

    const modelScore = 1.0 - pallor.epiScore

    // 2. Active Perception Agent Decision Engine
    const prevEvidence = firstCaptureFeatures ? [firstCaptureFeatures] : []
    const decision = evaluatePerceptionStep(quality, pallor, modelScore, captureCount, prevEvidence)
    setAgentDecision(decision)

    setStep('quality')
    setProcessing(false)
  }, [stopCamera, captureCount, firstCaptureFeatures, alignmentStatus])

  // Retake photo
  const retake = useCallback(() => {
    setCapturedImage(null)
    setROIResult(null)
    setStep('camera')
    startCamera()
  }, [startCamera])

  // Active Perception Second View Trigger
  const triggerSecondView = useCallback(() => {
    if (pallorFeatures) {
      setFirstCaptureFeatures(pallorFeatures)
    }
    setCaptureCount(2)
    setCapturedImage(null)
    setROIResult(null)
    setStep('camera')
    startCamera()
  }, [pallorFeatures, startCamera])

  // Process ROI detection
  const processROI = useCallback(async () => {
    if (!canvasRef.current) return

    setProcessing(true)
    setStep('roi')
    setLoadingModel(true)

    try {
      await initFaceLandmarker()
      setLoadingModel(false)

      const roi = await detectROI(canvasRef.current)
      setROIResult(roi)

      if (!roi.detected) {
        setProcessing(false)
        return
      }
    } catch (err) {
      console.error('ROI detection error:', err)
      setROIResult({
        detected: false,
        roiCanvas: null,
        overlayCanvas: null,
        landmarks: null,
        errorMessage: 'Eye landmark detection failed. Please retry.',
      })
    }
    setProcessing(false)
  }, [])

  // Run AI inference
  const processInference = useCallback(async () => {
    if (!roiResult?.roiCanvas || !agentDecision || !pallorFeatures || !openCVMetrics) return

    setProcessing(true)
    setStep('inference')

    try {
      const result = await runInference(roiResult.roiCanvas)

      navigate('/result', {
        state: {
          inferenceResult: result,
          capturedImage,
          roiImage: roiResult.roiCanvas.toDataURL(),
          overlayImage: roiResult.overlayCanvas?.toDataURL(),
          qualityMetrics: openCVMetrics,
          pallorFeatures,
          agentDecision,
        },
      })
    } catch (err) {
      console.error('Inference error:', err)
      navigate('/result', {
        state: {
          inferenceResult: {
            riskLevel: agentDecision.riskTier.toLowerCase() as any,
            confidence: agentDecision.confidence,
            rawOutput: [0],
            inferenceTime: 0,
            modelVersion: 'mobilenetv3-prototype',
            isPrototype: true,
          } as InferenceResult,
          capturedImage,
          roiImage: roiResult.roiCanvas.toDataURL(),
          overlayImage: roiResult.overlayCanvas?.toDataURL(),
          qualityMetrics: openCVMetrics,
          pallorFeatures,
          agentDecision,
          modelError: 'Showing screening result.',
        },
      })
    }
    setProcessing(false)
  }, [roiResult, agentDecision, pallorFeatures, openCVMetrics, capturedImage, navigate])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  return (
    <div className="h-screen w-screen bg-gray-950 flex flex-col overflow-hidden text-white">
      {/* Top Header */}
      <header className="flex-none flex items-center justify-between px-6 py-3 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => { stopCamera(); navigate('/') }} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              RaktaScan Vision Capture
              {captureCount === 2 && (
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  2nd View Active Perception
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-400">MediaPipe EAR Eye Tracking & OpenCV 5 Quality Gate</p>
          </div>
        </div>

        {openCVMetrics && step === 'camera' && (
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-gray-500 block text-[10px]">Sharpness</span>
              <span className={openCVMetrics.sharpness >= 45 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {openCVMetrics.sharpness.toFixed(0)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">Glare</span>
              <span className={openCVMetrics.glarePercent <= 8.0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {openCVMetrics.glarePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* STEP: Camera View */}
        {step === 'camera' && (
          <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
            {cameraError ? (
              <div className="text-center px-8 z-20">
                <p className="text-gray-300 text-sm mb-4">{cameraError}</p>
                <button onClick={startCamera} className="btn-gradient-primary text-sm">
                  {t('screening.grantPermission')}
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />

                {/* Reticle & Live Position Alerts Overlay */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                    {/* Top Live Guidance Alert Banner */}
                    <div className="absolute top-6 left-4 right-4 flex justify-center">
                      <div className={`px-5 py-2.5 rounded-full text-xs font-extrabold backdrop-blur-xl border shadow-2xl transition-all duration-300 ${
                        alignmentStatus === 'perfect'
                          ? 'bg-emerald-500/90 text-white border-emerald-400 shadow-emerald-500/50 animate-pulse'
                          : alignmentStatus === 'eye_closed'
                          ? 'bg-rose-600 text-white border-rose-400 shadow-rose-600/80 animate-bounce text-sm'
                          : 'bg-black/75 text-amber-300 border-amber-400/50'
                      }`}>
                        {guidanceMessage}
                      </div>
                    </div>

                    {/* Centered Guide Reticle Oval */}
                    <div className={`relative w-64 h-40 transition-all duration-300 ${
                      alignmentStatus === 'perfect' ? 'scale-105 shadow-[0_0_40px_rgba(52,211,153,0.8)]' : ''
                    }`}>
                      <svg viewBox="0 0 200 130" className="w-full h-full">
                        <ellipse
                          cx="100"
                          cy="65"
                          rx="85"
                          ry="50"
                          fill="none"
                          stroke={
                            alignmentStatus === 'perfect' ? '#34d399' :
                            alignmentStatus === 'eye_closed' ? '#f43f5e' : '#fbbf24'
                          }
                          strokeWidth={alignmentStatus === 'perfect' ? '3.5' : alignmentStatus === 'eye_closed' ? '4' : '2'}
                          strokeDasharray={alignmentStatus === 'perfect' ? 'none' : '8 4'}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-[11px] font-bold tracking-wider px-3 py-1 rounded-full backdrop-blur-md ${
                          alignmentStatus === 'perfect' ? 'bg-emerald-500/20 text-emerald-300' :
                          alignmentStatus === 'eye_closed' ? 'bg-rose-600/30 text-rose-200' : 'bg-black/40 text-gray-300'
                        }`}>
                          {alignmentStatus === 'eye_closed' ? '⚠️ EYE CLOSED' : 'Lower Eyelid Zone'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating Capture Button — Visible & Interactive */}
                {cameraActive && (
                  <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center pointer-events-auto">
                    <button
                      id="btn-capture"
                      onClick={captureImage}
                      className={`relative rounded-full p-1 transition-all duration-300 active:scale-90 shadow-2xl cursor-pointer ${
                        alignmentStatus === 'perfect'
                          ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 shadow-[0_0_35px_rgba(52,211,153,0.8)] animate-pulse'
                          : alignmentStatus === 'eye_closed'
                          ? 'bg-rose-600 shadow-[0_0_25px_rgba(244,63,94,0.6)]'
                          : 'bg-white/30 hover:bg-white/40'
                      }`}
                      style={{ width: '76px', height: '76px' }}
                    >
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <div className={`w-13 h-13 rounded-full flex items-center justify-center transition-colors ${
                          alignmentStatus === 'eye_closed' ? 'bg-rose-600' : 'bg-rakta-600 hover:bg-rakta-500'
                        }`}>
                          <span className="text-white text-lg">📷</span>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP: Quality & Agent Decision Gate */}
        {step === 'quality' && openCVMetrics && agentDecision && (
          <div className="flex-1 p-6 overflow-y-auto max-w-lg mx-auto w-full space-y-4 animate-fade-in">
            {capturedImage && (
              <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
                <img src={capturedImage} alt="Captured" className="w-full" style={{ transform: 'scaleX(-1)' }} />
              </div>
            )}

            <h2 className="text-xl font-bold text-white">OpenCV 5 & Agent Perception Analysis</h2>

            {/* Agent Decision Alert */}
            {agentDecision.action === 'REQUEST_RECAPTURE' && (
              <div className="glass-card border-rose-500/40 bg-rose-500/10 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-bold text-rose-300">Action: REQUEST_RECAPTURE</p>
                    <p className="text-xs text-rose-200/80">{agentDecision.reason}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-xs text-rose-200 font-semibold">
                  Operator Instruction: {alignmentStatus === 'eye_closed' ? '⚠️ EYE CLOSED — Please open eye wide and pull down lower eyelid' : agentDecision.recommendedGuidance}
                </div>
              </div>
            )}

            {agentDecision.action === 'REQUEST_SECOND_VIEW' && (
              <div className="glass-card border-amber-500/40 bg-amber-500/10 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="font-bold text-amber-300">Agent Action: REQUEST_SECOND_VIEW</p>
                    <p className="text-xs text-amber-200/80">Visual evidence is borderline. Active perception requested.</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-xs text-amber-200 font-semibold">
                  Instruction: {agentDecision.recommendedGuidance}
                </div>
              </div>
            )}

            {agentDecision.action !== 'REQUEST_RECAPTURE' && agentDecision.action !== 'REQUEST_SECOND_VIEW' && (
              <div className="glass-card border-emerald-500/40 bg-emerald-500/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-bold text-emerald-300">Quality & Perception Gate Passed</p>
                    <p className="text-xs text-emerald-200/70">OpenCV 5 evidence validated by Agent Engine</p>
                  </div>
                </div>
              </div>
            )}

            {/* OpenCV 5 Measured Metrics */}
            <div className="glass-card space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">OpenCV 5 Measured Metrics</h3>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-gray-800/50 border border-white/5">
                  <p className="font-mono font-bold text-emerald-400">{openCVMetrics.sharpness.toFixed(0)}</p>
                  <p className="text-[10px] text-gray-400">Sharpness</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-800/50 border border-white/5">
                  <p className="font-mono font-bold text-emerald-400">{openCVMetrics.brightness.toFixed(0)}</p>
                  <p className="text-[10px] text-gray-400">Brightness</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-800/50 border border-white/5">
                  <p className="font-mono font-bold text-emerald-400">{openCVMetrics.glarePercent.toFixed(1)}%</p>
                  <p className="text-[10px] text-gray-400">Glare</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-800/50 border border-white/5">
                  <p className="font-mono font-bold text-emerald-400">{pallorFeatures?.labAMean.toFixed(1)}</p>
                  <p className="text-[10px] text-gray-400">LAB a* Red</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-2">
              {agentDecision.action === 'REQUEST_RECAPTURE' && (
                <button onClick={retake} className="w-full btn-gradient-primary text-base py-3.5">
                  📸 Recapture Photo (Apply Guidance)
                </button>
              )}

              {agentDecision.action === 'REQUEST_SECOND_VIEW' && (
                <button onClick={triggerSecondView} className="w-full btn-gradient-emerald text-base py-3.5">
                  📸 Take 2nd Visual Capture
                </button>
              )}

              {agentDecision.action !== 'REQUEST_RECAPTURE' && agentDecision.action !== 'REQUEST_SECOND_VIEW' && (
                <button onClick={processROI} className="w-full btn-gradient-emerald text-base py-3.5">
                  Proceed to ROI Localization →
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP: ROI */}
        {step === 'roi' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-lg mx-auto w-full space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold text-white">Conjunctiva ROI Localization</h2>

            {loadingModel && (
              <div className="glass-card text-center py-8">
                <div className="inline-block w-8 h-8 border-3 border-rakta-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm text-gray-400">Loading MediaPipe Eye Landmarker...</p>
              </div>
            )}

            {roiResult && !loadingModel && (
              <>
                {roiResult.detected ? (
                  <>
                    <div className="glass-card border-emerald-500/40 bg-emerald-500/10">
                      <p className="font-bold text-emerald-300 text-sm">✅ Palpebral Conjunctiva ROI Isolated</p>
                    </div>

                    {roiResult.overlayCanvas && (
                      <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
                        <img src={roiResult.overlayCanvas.toDataURL()} alt="Overlay" className="w-full" style={{ transform: 'scaleX(-1)' }} />
                      </div>
                    )}

                    {roiResult.roiCanvas && (
                      <div className="glass-card">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cropped Tissue Input</h3>
                        <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-black p-2">
                          <img src={roiResult.roiCanvas.toDataURL()} alt="ROI Crop" className="w-full max-h-28 object-contain" />
                        </div>
                      </div>
                    )}

                    <button onClick={processInference} className="w-full btn-gradient-emerald text-base py-3.5">
                      ⚡ Finalize MobileNetV3 Screening
                    </button>
                  </>
                ) : (
                  <div className="glass-card border-rose-500/40 bg-rose-500/10 text-center py-6">
                    <p className="font-bold text-rose-300 text-sm mb-4">Target region could not be localized.</p>
                    <button onClick={retake} className="btn-gradient-primary text-sm px-6 py-3">
                      Retake Photo
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP: Inference Spinner */}
        {step === 'inference' && processing && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-rakta-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-rakta-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white">Aggregating Agent Evidence</h2>
            <p className="text-xs text-gray-400 mt-2">Computing on-device MobileNetV3 & OpenCV 5 cross-validation...</p>
          </div>
        )}
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
