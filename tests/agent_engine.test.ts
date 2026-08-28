import { evaluatePerceptionStep } from '../frontend/src/utils/agentEngine'

console.log('--- Testing Active Perception Agent Decision Engine ---')

// Test 1: Quality Gate Failure -> REQUEST_RECAPTURE
const qFail = { passed: false, reasons: ['too_blurry'], metrics: { sharpness: 10, brightness: 100, contrast: 30, glarePercent: 1, width: 640, height: 480 } }
const pDummy = { valid: true, labAMean: 125, rgRatio: 1.1, hsvSaturation: 100, epiScore: 0.5, evidence: 'test' }
const d1 = evaluatePerceptionStep(qFail, pDummy, 0.5, 1)

console.log('Test 1 Action:', d1.action)
if (d1.action !== 'REQUEST_RECAPTURE') {
  console.error('✗ Test 1 FAILED: Expected REQUEST_RECAPTURE')
  process.exit(1)
}

// Test 2: Borderline Visual Evidence -> REQUEST_SECOND_VIEW
const qPass = { passed: true, reasons: [], metrics: { sharpness: 120, brightness: 110, contrast: 45, glarePercent: 1, width: 640, height: 480 } }
const pBorderline = { valid: true, labAMean: 126, rgRatio: 1.18, hsvSaturation: 110, epiScore: 0.52, evidence: 'borderline' }
const d2 = evaluatePerceptionStep(qPass, pBorderline, 0.48, 1)

console.log('Test 2 Action:', d2.action)
if (d2.action !== 'REQUEST_SECOND_VIEW') {
  console.error('✗ Test 2 FAILED: Expected REQUEST_SECOND_VIEW')
  process.exit(1)
}

// Test 3: Clear Evidence -> ACCEPT_LOW_RISK
const pGood = { valid: true, labAMean: 140, rgRatio: 1.45, hsvSaturation: 150, epiScore: 0.85, evidence: 'healthy' }
const d3 = evaluatePerceptionStep(qPass, pGood, 0.15, 1)

console.log('Test 3 Action:', d3.action)
if (d3.action !== 'ACCEPT_LOW_RISK') {
  console.error('✗ Test 3 FAILED: Expected ACCEPT_LOW_RISK')
  process.exit(1)
}

console.log('✓ Active Perception Agent Engine Unit Tests PASSED')
