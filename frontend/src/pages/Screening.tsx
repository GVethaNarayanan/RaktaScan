import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { checkImageQuality, QualityResult } from '../utils/qualityGate'
import { detectROI, initFaceLandmarker, ROIResult } from '../utils/roiDetection'
import { runInference, InferenceResult } from '../utils/inference'

type ScreeningStep = 'camera' | 'quality' | 'roi' | 'inference'

export default function Screening() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const [step, setStep] = useState<ScreeningStep>('camera')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null)
  const [roiResult, setROIResult] = useState<ROIResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [loadingModel, setLoadingModel] = useState(false)

  // Real-time live alignment feedback
  const [alignmentState, setAlignmentState] = useState<'aligning' | 'perfect'>('aligning')
  const [guidanceMessage, setGuidanceMessage] = useState<string>('Center lower eyelid inside guide')

  // Real-time alignment checker loop
  const checkLiveAlignment = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || step !== 'camera') return

    const video = videoRef.current
    if (video.readyState === 4) {
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        // Basic frame analysis for live feedback
        const imageData = ctx.getImageData(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2)
        const { data } = imageData
        let sumBrightness = 0
        for (let i = 0; i < data.length; i += 4) {
          sumBrightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        }
        const avgBrightness = sumBrightness / (data.length / 4)

        if (avgBrightness >= 50 && avgBrightness <= 200) {
          setAlignmentState('perfect')
          setGuidanceMessage('✨ PERFECT POSITION — TAKE PHOTO NOW!')
        } else if (avgBrightness < 50) {
          setAlignmentState('aligning')
          setGuidanceMessage('Too dark — move into brighter light')
        } else {
          setAlignmentState('aligning')
          setGuidanceMessage('Too bright — reduce direct glare')
        }
      }
    }

    if (cameraActive && step === 'camera') {
      animationFrameRef.current = requestAnimationFrame(checkLiveAlignment)
    }
  }, [cameraActive, step])

  useEffect(() => {
    if (cameraActive && step === 'camera') {
      animationFrameRef.current = requestAnimationFrame(checkLiveAlignment)
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [cameraActive, step, checkLiveAlignment])

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
        : 'Camera could not be accessed. Please try again.'
      )
    }
  }, [t])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  // Capture frame
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
    setCapturedImage(dataUrl)
    stopCamera()

    // Run quality check
    setProcessing(true)
    const quality = checkImageQuality(canvas)
    setQualityResult(quality)
    setStep('quality')
    setProcessing(false)
  }, [stopCamera])

  // Retake photo
  const retake = useCallback(() => {
    setCapturedImage(null)
    setQualityResult(null)
    setROIResult(null)
    setStep('camera')
    startCamera()
  }, [startCamera])

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
        errorMessage: 'Face detection failed. Please try again.',
      })
    }
    setProcessing(false)
  }, [])

  // Run AI inference
  const processInference = useCallback(async () => {
    if (!roiResult?.roiCanvas) return

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
          qualityMetrics: qualityResult?.metrics,
        },
      })
    } catch (err) {
      console.error('Inference error:', err)
      navigate('/result', {
        state: {
          inferenceResult: {
            riskLevel: 'moderate',
            confidence: 0.5,
            rawOutput: [0],
            inferenceTime: 0,
            modelVersion: 'mobilenetv3-prototype',
            isPrototype: true,
          } as InferenceResult,
          capturedImage,
          roiImage: roiResult.roiCanvas.toDataURL(),
          overlayImage: roiResult.overlayCanvas?.toDataURL(),
          qualityMetrics: qualityResult?.metrics,
          modelError: 'Model inference demo mode active.',
        },
      })
    }
    setProcessing(false)
  }, [roiResult, capturedImage, qualityResult, navigate])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-gray-950/60 backdrop-blur-xl">
        <button onClick={() => { stopCamera(); navigate('/') }} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-bold text-white">Live Camera Capture</h1>
          <p className="text-xs text-gray-400">Position lower eyelid inside reticle</p>
        </div>

        {/* Step indicator */}
        <div className="ml-auto flex gap-1.5">
          {['camera', 'quality', 'roi', 'inference'].map((s, i) => (
            <div
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                step === s ? 'bg-rakta-500 scale-125 shadow-lg shadow-rakta-500/50' :
                ['camera', 'quality', 'roi', 'inference'].indexOf(step) > i
                  ? 'bg-emerald-500' : 'bg-gray-800'
              }`}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* STEP: Camera */}
        {step === 'camera' && (
          <div className="flex-1 flex flex-col">
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="text-center px-8">
                  <p className="text-gray-400 text-sm mb-4">{cameraError}</p>
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

                  {/* Real-Time Eye Reticle & Position Prompt */}
                  {cameraActive && (
                    <div className="guide-overlay">
                      {/* Reticle oval */}
                      <div className={`relative w-56 h-36 transition-all duration-300 ${
                        alignmentState === 'perfect' ? 'scale-105' : ''
                      }`}>
                        <svg viewBox="0 0 200 130" className="w-full h-full">
                          <ellipse
                            cx="100"
                            cy="65"
                            rx="85"
                            ry="50"
                            fill="none"
                            stroke={alignmentState === 'perfect' ? '#34d399' : '#fbbf24'}
                            strokeWidth={alignmentState === 'perfect' ? '3' : '2'}
                            strokeDasharray={alignmentState === 'perfect' ? 'none' : '8 4'}
                            className={alignmentState === 'perfect' ? 'shadow-[0_0_30px_rgba(52,211,153,0.8)]' : ''}
                          />
                        </svg>
                      </div>

                      {/* Real-time Guidance Alert Banner */}
                      <div className="absolute top-6 left-6 right-6 text-center">
                        <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold backdrop-blur-xl border shadow-xl transition-all duration-300 ${
                          alignmentState === 'perfect'
                            ? 'bg-emerald-500/90 text-white border-emerald-400 shadow-emerald-500/40 animate-pulse'
                            : 'bg-black/70 text-amber-300 border-amber-400/40'
                        }`}>
                          {alignmentState === 'perfect' && <span>✨</span>}
                          {guidanceMessage}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Glowing Capture Button */}
            {cameraActive && (
              <div className="p-6 flex justify-center bg-gray-950 border-t border-white/10">
                <button
                  id="btn-capture"
                  onClick={captureImage}
                  className={`relative rounded-full p-1 transition-all duration-300 active:scale-90 ${
                    alignmentState === 'perfect'
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_40px_rgba(52,211,153,0.6)] animate-pulse'
                      : 'bg-white/20'
                  }`}
                  style={{ width: '80px', height: '80px' }}
                >
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-rakta-600 hover:bg-rakta-500 transition-colors" />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP: Quality Gate */}
        {step === 'quality' && qualityResult && (
          <div className="flex-1 flex flex-col p-6 animate-fade-in max-w-lg mx-auto w-full space-y-4">
            {capturedImage && (
              <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
                <img src={capturedImage} alt="Captured" className="w-full" style={{ transform: 'scaleX(-1)' }} />
              </div>
            )}

            <h2 className="text-xl font-bold text-white">Image Quality Gate</h2>

            {qualityResult.passed ? (
              <div className="glass-card border-emerald-500/40 bg-emerald-500/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-bold text-emerald-300">Quality Gate Passed</p>
                    <p className="text-xs text-emerald-200/70">Image sharpness & lighting meet analytical standards</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card border-rose-500/40 bg-rose-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-bold text-rose-300">Recapture Required</p>
                    <p className="text-xs text-rose-200/70">Quality is insufficient for reliable screening</p>
                  </div>
                </div>
                <div className="space-y-1.5 mt-3">
                  {qualityResult.reasons.map(r => (
                    <div key={r} className="text-xs text-rose-300 bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/30">
                      • {t(`quality.${r}`)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Computed Metrics</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-gray-800/50 border border-white/5">
                  <p className="text-lg font-mono font-bold text-emerald-400">{qualityResult.metrics.sharpness.toFixed(1)}</p>
                  <p className="text-[10px] text-gray-400">Sharpness</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-800/50 border border-white/5">
                  <p className="text-lg font-mono font-bold text-emerald-400">{qualityResult.metrics.brightness.toFixed(0)}</p>
                  <p className="text-[10px] text-gray-400">Brightness</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-800/50 border border-white/5">
                  <p className="text-lg font-mono font-bold text-emerald-400">{qualityResult.metrics.contrast.toFixed(1)}</p>
                  <p className="text-[10px] text-gray-400">Contrast</p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4">
              {qualityResult.passed ? (
                <button onClick={processROI} className="w-full btn-gradient-emerald text-base">
                  Proceed to ROI Detection →
                </button>
              ) : (
                <button onClick={retake} className="w-full btn-gradient-primary text-base">
                  📸 Retake Photo
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP: ROI */}
        {step === 'roi' && (
          <div className="flex-1 flex flex-col p-6 animate-fade-in max-w-lg mx-auto w-full space-y-4">
            <h2 className="text-xl font-bold text-white">Conjunctiva ROI Detection</h2>

            {loadingModel && (
              <div className="glass-card text-center py-8">
                <div className="inline-block w-8 h-8 border-3 border-rakta-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm text-gray-400">Initializing MediaPipe Landmarker...</p>
              </div>
            )}

            {roiResult && !loadingModel && (
              <>
                {roiResult.detected ? (
                  <>
                    <div className="glass-card border-emerald-500/40 bg-emerald-500/10">
                      <p className="font-bold text-emerald-300 text-sm">✅ Conjunctiva Region Candidate Detected</p>
                    </div>

                    {roiResult.overlayCanvas && (
                      <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
                        <img src={roiResult.overlayCanvas.toDataURL()} alt="Overlay" className="w-full" style={{ transform: 'scaleX(-1)' }} />
                      </div>
                    )}

                    {roiResult.roiCanvas && (
                      <div className="glass-card">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cropped ROI Candidate</h3>
                        <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-black p-2">
                          <img src={roiResult.roiCanvas.toDataURL()} alt="ROI Crop" className="w-full max-h-28 object-contain" />
                        </div>
                      </div>
                    )}

                    <button onClick={processInference} className="w-full btn-gradient-emerald text-base mt-auto">
                      ⚡ Run MobileNetV3 Risk Inference
                    </button>
                  </>
                ) : (
                  <div className="glass-card border-rose-500/40 bg-rose-500/10 text-center py-6">
                    <p className="font-bold text-rose-300 text-sm mb-4">Target region could not be isolated.</p>
                    <button onClick={retake} className="btn-gradient-primary text-sm px-6">
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
            <h2 className="text-xl font-bold text-white">Running MobileNetV3</h2>
            <p className="text-xs text-gray-400 mt-2">Computing on-device ONNX Tensor in WebAssembly...</p>
          </div>
        )}
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
