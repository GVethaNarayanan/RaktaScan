import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { checkImageQuality, QualityResult } from '../utils/qualityGate'
import { detectROI, initFaceLandmarker, ROIResult } from '../utils/roiDetection'
import { runInference, InferenceResult } from '../utils/inference'

type ScreeningStep = 'camera' | 'quality' | 'roi' | 'inference' | 'error'

export default function Screening() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [step, setStep] = useState<ScreeningStep>('camera')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null)
  const [roiResult, setROIResult] = useState<ROIResult | null>(null)
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [loadingModel, setLoadingModel] = useState(false)

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
    setInferenceResult(null)
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
      setInferenceResult(result)

      // Navigate to result page with data
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
      // Still navigate but with prototype flag
      navigate('/result', {
        state: {
          inferenceResult: {
            riskLevel: 'moderate',
            confidence: 0.5,
            rawOutput: [0],
            inferenceTime: 0,
            modelVersion: 'prototype-demo',
            isPrototype: true,
          } as InferenceResult,
          capturedImage,
          roiImage: roiResult.roiCanvas.toDataURL(),
          overlayImage: roiResult.overlayCanvas?.toDataURL(),
          qualityMetrics: qualityResult?.metrics,
          modelError: 'Model file not available. Showing prototype demo result.',
        },
      })
    }
    setProcessing(false)
  }, [roiResult, capturedImage, qualityResult, navigate])

  // Auto-start camera
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <button onClick={() => { stopCamera(); navigate('/') }} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">{t('screening.title')}</h1>

        {/* Step indicator */}
        <div className="ml-auto flex gap-1.5">
          {['camera', 'quality', 'roi', 'inference'].map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                step === s ? 'bg-rakta-500' :
                ['camera', 'quality', 'roi', 'inference'].indexOf(step) > i
                  ? 'bg-medical-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* STEP: Camera */}
        {step === 'camera' && (
          <div className="flex-1 flex flex-col">
            {/* Camera View */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="text-center px-8">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <p className="text-gray-400 text-sm mb-4">{cameraError}</p>
                  <button onClick={startCamera} className="btn-primary text-sm">
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

                  {/* Guided Capture Overlay */}
                  {cameraActive && (
                    <div className="guide-overlay">
                      {/* Eye positioning guide */}
                      <div className="relative w-48 h-32">
                        <svg viewBox="0 0 200 130" className="w-full h-full viewfinder-guide">
                          {/* Oval eye guide */}
                          <ellipse cx="100" cy="65" rx="85" ry="50" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="8 4" />
                          {/* Center crosshair */}
                          <line x1="90" y1="65" x2="110" y2="65" stroke="#22c55e" strokeWidth="1" opacity="0.6" />
                          <line x1="100" y1="55" x2="100" y2="75" stroke="#22c55e" strokeWidth="1" opacity="0.6" />
                          {/* Corner brackets */}
                          <path d="M 20 25 L 20 15 L 30 15" fill="none" stroke="#22c55e" strokeWidth="2" />
                          <path d="M 170 15 L 180 15 L 180 25" fill="none" stroke="#22c55e" strokeWidth="2" />
                          <path d="M 180 105 L 180 115 L 170 115" fill="none" stroke="#22c55e" strokeWidth="2" />
                          <path d="M 30 115 L 20 115 L 20 105" fill="none" stroke="#22c55e" strokeWidth="2" />
                        </svg>
                      </div>

                      {/* Instructions */}
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <div className="inline-flex flex-col gap-1 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3">
                          <p className="text-sm text-green-400 font-medium">
                            {t('screening.instruction2')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {t('screening.instruction3')} · {t('screening.instruction4')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Capture Button */}
            {cameraActive && (
              <div className="p-6 flex justify-center bg-gray-950">
                <button
                  id="btn-capture"
                  onClick={captureImage}
                  className="w-18 h-18 rounded-full bg-white border-4 border-gray-300 
                           hover:border-rakta-400 transition-colors active:scale-90
                           flex items-center justify-center shadow-xl"
                  style={{ width: '72px', height: '72px' }}
                >
                  <div className="w-14 h-14 rounded-full bg-white hover:bg-gray-100 transition-colors" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP: Quality Check */}
        {step === 'quality' && qualityResult && (
          <div className="flex-1 flex flex-col p-6 animate-fade-in">
            {/* Preview */}
            {capturedImage && (
              <div className="rounded-xl overflow-hidden mb-6 border border-gray-800">
                <img src={capturedImage} alt="Captured" className="w-full" style={{ transform: 'scaleX(-1)' }} />
              </div>
            )}

            <h2 className="text-xl font-bold mb-4">{t('quality.title')}</h2>

            {qualityResult.passed ? (
              <div className="card border-emerald-500/30 bg-emerald-500/5 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-400">{t('quality.passed')}</p>
                    <p className="text-xs text-gray-400">Image meets quality requirements</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card border-red-500/30 bg-red-500/5 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-red-400">{t('quality.failed')}</p>
                    <p className="text-xs text-gray-400">{t('quality.failedMessage')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {qualityResult.reasons.map(reason => (
                    <div key={reason} className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg">
                      <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <span className="text-sm text-red-300">
                        {t(`quality.${reason}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Metrics */}
            <div className="card mb-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Metrics</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t('quality.sharpness'), value: qualityResult.metrics.sharpness.toFixed(1), good: qualityResult.metrics.sharpness >= 50 },
                  { label: t('quality.brightness'), value: qualityResult.metrics.brightness.toFixed(0), good: qualityResult.metrics.brightness >= 40 && qualityResult.metrics.brightness <= 220 },
                  { label: t('quality.contrast'), value: qualityResult.metrics.contrast.toFixed(1), good: qualityResult.metrics.contrast >= 20 },
                ].map(({ label, value, good }) => (
                  <div key={label} className="text-center p-3 rounded-lg bg-gray-800/50">
                    <p className={`text-lg font-bold ${good ? 'text-emerald-400' : 'text-red-400'}`}>{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 mt-auto">
              {qualityResult.passed ? (
                <button onClick={processROI} className="w-full btn-success py-4 text-lg">
                  {processing ? t('screening.processing') : 'Proceed to ROI Detection'}
                </button>
              ) : (
                <button onClick={retake} className="w-full btn-primary py-4 text-lg">
                  {t('quality.retakePhoto')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP: ROI Detection */}
        {step === 'roi' && (
          <div className="flex-1 flex flex-col p-6 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">{t('roi.title')}</h2>

            {loadingModel && (
              <div className="card flex items-center gap-3 mb-4">
                <div className="w-6 h-6 border-2 border-medical-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading face detection model...</p>
              </div>
            )}

            {processing && !loadingModel && (
              <div className="card flex items-center gap-3 mb-4">
                <div className="w-6 h-6 border-2 border-medical-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Detecting conjunctiva region...</p>
              </div>
            )}

            {roiResult && !processing && (
              <>
                {roiResult.detected ? (
                  <>
                    <div className="card border-emerald-500/30 bg-emerald-500/5 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-400">{t('roi.detected')}</p>
                          <p className="text-xs text-gray-400">{t('roi.label')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Overlay Image */}
                    {roiResult.overlayCanvas && (
                      <div className="rounded-xl overflow-hidden mb-4 border border-gray-800">
                        <img
                          src={roiResult.overlayCanvas.toDataURL()}
                          alt="ROI Detection"
                          className="w-full"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                      </div>
                    )}

                    {/* Cropped ROI */}
                    {roiResult.roiCanvas && (
                      <div className="card mb-4">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Detected ROI</h3>
                        <div className="rounded-lg overflow-hidden border border-gray-700 bg-black">
                          <img
                            src={roiResult.roiCanvas.toDataURL()}
                            alt="Conjunctiva ROI"
                            className="w-full max-h-32 object-contain"
                          />
                        </div>
                      </div>
                    )}

                    <button onClick={processInference} className="w-full btn-success py-4 text-lg mt-auto" disabled={processing}>
                      {processing ? t('screening.analyzing') : t('roi.proceed')}
                    </button>
                  </>
                ) : (
                  <div className="card border-red-500/30 bg-red-500/5 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-red-400">
                          {roiResult.errorMessage ? t(`quality.${roiResult.errorMessage}`, roiResult.errorMessage) : t('roi.notDetected')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!roiResult.detected && (
                  <button onClick={retake} className="w-full btn-primary py-4 text-lg mt-auto">
                    {t('quality.retakePhoto')}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP: Inference (loading state) */}
        {step === 'inference' && processing && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-rakta-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-rakta-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-lg font-semibold text-white">{t('screening.analyzing')}</p>
            <p className="text-sm text-gray-400 mt-2">Running MobileNetV3 inference...</p>
          </div>
        )}
      </main>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
