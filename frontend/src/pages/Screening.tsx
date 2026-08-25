import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { checkImageQuality, QualityResult } from '../utils/qualityGate'
import { detectROI, initFaceLandmarker, ROIResult } from '../utils/roiDetection'
import { runInference, InferenceResult } from '../utils/inference'

type ScreeningStep = 'camera' | 'quality' | 'roi' | 'inference'
type AlignmentStatus = 'no_face' | 'eye_closed' | 'misaligned' | 'perfect'

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
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null)
  const [roiResult, setROIResult] = useState<ROIResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [loadingModel, setLoadingModel] = useState(false)

  // Live Position & Eye Open/Closed Detection State
  const [alignmentStatus, setAlignmentStatus] = useState<AlignmentStatus>('misaligned')
  const [guidanceMessage, setGuidanceMessage] = useState<string>('Center eye inside guide reticle')

  // Live real-time frame analyzer for Eye Open/Closed & Position
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
        
        // Analyze central reticle zone for Eye Features & Open/Closed Status
        const reticleW = Math.floor(canvas.width * 0.4)
        const reticleH = Math.floor(canvas.height * 0.35)
        const reticleX = Math.floor((canvas.width - reticleW) / 2)
        const reticleY = Math.floor((canvas.height - reticleH) / 2)

        const frameData = ctx.getImageData(reticleX, reticleY, reticleW, reticleH)
        const { data } = frameData

        let totalBrightness = 0
        let darkPixelCount = 0 // Eyelash / Pupil / Shadow features
        let brightPixelCount = 0 // Sclera / Skin features
        const totalPixels = data.length / 4

        for (let i = 0; i < data.length; i += 4) {
          const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          totalBrightness += luma
          if (luma < 50) darkPixelCount++
          if (luma > 160) brightPixelCount++
        }

        const avgBrightness = totalBrightness / totalPixels
        const contrastRatio = (brightPixelCount - darkPixelCount) / totalPixels

        // Heuristic detection: Eye Open vs Closed vs Position
        if (avgBrightness < 35 || avgBrightness > 225) {
          setAlignmentStatus('misaligned')
          setGuidanceMessage(avgBrightness < 35 ? '💡 Too dark — move into lighting' : '☀️ Too bright — reduce direct glare')
        } else if (darkPixelCount / totalPixels > 0.45 && brightPixelCount / totalPixels < 0.05) {
          // Eyelid closed / dark shadow covering eye
          setAlignmentStatus('eye_closed')
          setGuidanceMessage('⚠️ EYE CLOSED — Please open eye wide and pull down lower eyelid')
        } else if (avgBrightness >= 45 && avgBrightness <= 210) {
          setAlignmentStatus('perfect')
          setGuidanceMessage('✨ PERFECT POSITION — TAKE PHOTO NOW!')
        } else {
          setAlignmentStatus('misaligned')
          setGuidanceMessage('👁️ Center your eye inside the reticle')
        }
      }
    }

    if (cameraActive && step === 'camera') {
      animFrameRef.current = requestAnimationFrame(analyzeLiveFrame)
    }
  }, [cameraActive, step])

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

  // Capture frame
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

    // Quality check
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
        errorMessage: 'Eye landmark detection failed. Please retry.',
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
          modelError: 'Showing prototype screening result.',
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
    <div className="h-screen w-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="flex-none flex items-center justify-between px-6 py-3 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => { stopCamera(); navigate('/') }} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">RaktaScan Camera</h1>
            <p className="text-xs text-gray-400">Position lower eyelid inside green guide</p>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex gap-1.5">
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
                {/* Live Video Feed - Properly Centered */}
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
                          ? 'bg-rose-600/90 text-white border-rose-400 shadow-rose-600/50 animate-bounce'
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
                          strokeWidth={alignmentStatus === 'perfect' ? '3.5' : '2'}
                          strokeDasharray={alignmentStatus === 'perfect' ? 'none' : '8 4'}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-[11px] font-bold tracking-wider px-3 py-1 rounded-full backdrop-blur-md ${
                          alignmentStatus === 'perfect' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-black/40 text-gray-300'
                        }`}>
                          Lower Eyelid Zone
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating Capture Button — ALWAYS Visible Inside Viewport */}
                {cameraActive && (
                  <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center pointer-events-auto">
                    <button
                      id="btn-capture"
                      onClick={captureImage}
                      className={`relative rounded-full p-1 transition-all duration-300 active:scale-90 shadow-2xl cursor-pointer ${
                        alignmentStatus === 'perfect'
                          ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 shadow-[0_0_35px_rgba(52,211,153,0.8)] animate-pulse'
                          : 'bg-white/30 hover:bg-white/40'
                      }`}
                      style={{ width: '76px', height: '76px' }}
                    >
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <div className="w-13 h-13 rounded-full bg-rakta-600 hover:bg-rakta-500 transition-colors flex items-center justify-center">
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

        {/* STEP: Quality Gate */}
        {step === 'quality' && qualityResult && (
          <div className="flex-1 p-6 overflow-y-auto max-w-lg mx-auto w-full space-y-4 animate-fade-in">
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
                    <p className="font-bold text-emerald-300">Quality Requirements Passed</p>
                    <p className="text-xs text-emerald-200/70">Image sharpness & lighting are optimal</p>
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

            <div className="pt-4">
              {qualityResult.passed ? (
                <button onClick={processROI} className="w-full btn-gradient-emerald text-base py-3.5">
                  Proceed to ROI Detection →
                </button>
              ) : (
                <button onClick={retake} className="w-full btn-gradient-primary text-base py-3.5">
                  📸 Retake Photo
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP: ROI Detection */}
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
                      <p className="font-bold text-emerald-300 text-sm">✅ Conjunctiva Lower Eyelid ROI Isolated</p>
                    </div>

                    {roiResult.overlayCanvas && (
                      <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
                        <img src={roiResult.overlayCanvas.toDataURL()} alt="Overlay" className="w-full" style={{ transform: 'scaleX(-1)' }} />
                      </div>
                    )}

                    {roiResult.roiCanvas && (
                      <div className="glass-card">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cropped ROI Input</h3>
                        <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-black p-2">
                          <img src={roiResult.roiCanvas.toDataURL()} alt="ROI Crop" className="w-full max-h-28 object-contain" />
                        </div>
                      </div>
                    )}

                    <button onClick={processInference} className="w-full btn-gradient-emerald text-base py-3.5">
                      ⚡ Run MobileNetV3 Anemia Risk Model
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
            <h2 className="text-xl font-bold text-white">Detecting Anemia Risk</h2>
            <p className="text-xs text-gray-400 mt-2">Computing on-device MobileNetV3 inference in WASM...</p>
          </div>
        )}
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
