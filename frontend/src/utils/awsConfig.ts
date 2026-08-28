// AWS Runtime Environment & Bedrock Configuration Manager
// OpenCV AI Competition 2026

export interface AWSRuntimeConfig {
  mode: 'LOCAL' | 'AWS'
  region: string
  bedrockModel: string
  bedrockConnected: boolean
  mcpEnabled: boolean
  opencvVersion: string
}

const RUNTIME_KEY = 'raktascan-runtime-mode'

export function getRuntimeConfig(): AWSRuntimeConfig {
  const mode = (localStorage.getItem(RUNTIME_KEY) as 'LOCAL' | 'AWS') || 'LOCAL'
  return {
    mode,
    region: 'us-east-1',
    bedrockModel: 'anthropic.claude-3-haiku-20240307-v1:0',
    bedrockConnected: mode === 'AWS',
    mcpEnabled: true,
    opencvVersion: '5.0.0',
  }
}

export function setRuntimeMode(mode: 'LOCAL' | 'AWS'): void {
  localStorage.setItem(RUNTIME_KEY, mode)
}
