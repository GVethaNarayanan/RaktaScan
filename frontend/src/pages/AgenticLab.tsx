import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRuntimeConfig, setRuntimeMode } from '../utils/awsConfig'
import { MCP_TOOL_DEFINITIONS, executeMCPTool } from '../utils/mcpTools'

export default function AgenticLab() {
  const navigate = useNavigate()
  const [runtimeConfig, setConfig] = useState(getRuntimeConfig())
  const [demoStep, setDemoStep] = useState<number>(0)
  const [isDemoRunning, setIsDemoRunning] = useState(false)
  const [activeTrace, setActiveTrace] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] AGENT READY: OpenCV 5 Vision Engine & Active Perception Loop online.`,
    `[${new Date().toLocaleTimeString()}] MCP TOOLS: 10 tools registered. Runtime mode: ${runtimeConfig.mode}.`
  ])
  const [selectedTool, setSelectedTool] = useState<string>('analyze_capture_quality')
  const [toolOutput, setToolOutput] = useState<any>(null)

  const handleToggleRuntime = () => {
    const nextMode = runtimeConfig.mode === 'LOCAL' ? 'AWS' : 'LOCAL'
    setRuntimeMode(nextMode)
    setConfig(getRuntimeConfig())
    setActiveTrace(prev => [
      `[${new Date().toLocaleTimeString()}] RUNTIME MODE CHANGED: Switched to ${nextMode} execution context.`,
      ...prev
    ])
  }

  const handleRunDemoScenario = () => {
    setIsDemoRunning(true)
    setDemoStep(1)
    const t1 = new Date().toLocaleTimeString()

    setActiveTrace([
      `[${t1}] ATTEMPT 1: Multi-frame capture sequence initiated (10 frames).`,
      `[${t1}] PERCEPT (OpenCV 5): Specular Glare detected (9.4% > 8.0% threshold). Sharpness=135.2.`,
      `[${t1}] DECISION Engine: Quality Gate Failed -> Action: REQUEST_RECAPTURE`,
      `[${t1}] ACTION: Prompt operator: "Tilt phone slightly to reduce direct specular reflections."`
    ])

    setTimeout(() => {
      setDemoStep(2)
      const t2 = new Date().toLocaleTimeString()
      setActiveTrace(prev => [
        `[${t2}] ATTEMPT 2: Operator adjusted camera framing. 12 valid frames collected.`,
        `[${t2}] PERCEPT (OpenCV 5): Quality PASSED. CIELAB a* = 126.2, Red/Green Ratio = 1.18, EPI = 0.52.`,
        `[${t2}] UNDERSTAND: Visual evidence is Borderline (Uncertainty threshold reached: 0.35 <= EPI <= 0.65).`,
        `[${t2}] DECISION Engine: Action -> REQUEST_SECOND_VIEW`,
        `[${t2}] ACTION: Operator requested to capture 2nd visual site for cross-validation.`,
        ...prev
      ])
    }, 2500)

    setTimeout(() => {
      setDemoStep(3)
      const t3 = new Date().toLocaleTimeString()
      setActiveTrace(prev => [
        `[${t3}] ATTEMPT 3: 2nd visual capture processed. CIELAB a* = 127.1, EPI 2 = 0.49.`,
        `[${t3}] MCP TOOL CALL: run_cross_validation(capture1_epi=0.52, capture2_epi=0.49)`,
        `[${t3}] CROSS-VALIDATION: |ΔEPI| = 0.03 <= 0.25 (Consistent visual evidence across sites).`,
        `[${t3}] DECISION Engine: Action -> ACCEPT_MODERATE_RISK`,
        `[${t3}] ACTION: Final Risk Tier set to MODERATE (Confidence = 89%).`,
        `[${t3}] GUIDANCE: Confirmatory hemoglobin blood test recommended at a healthcare facility.`,
        ...prev
      ])
      setIsDemoRunning(false)
    }, 5500)
  }

  const handleTestTool = () => {
    const res = executeMCPTool(selectedTool, { sample: true })
    setToolOutput(res)
    setActiveTrace(prev => [
      `[${new Date().toLocaleTimeString()}] MCP TOOL EXECUTED: ${selectedTool}() -> Status: ${res.status}`,
      ...prev
    ])
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden text-white">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-rakta-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyber-500/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 px-6 py-4 bg-gray-950/70 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Agentic Vision Lab
              <span className="text-[10px] font-mono uppercase bg-rakta-500/20 text-rakta-300 border border-rakta-500/40 px-2 py-0.5 rounded-full">
                OpenCV 5 + AWS
              </span>
            </h1>
            <p className="text-xs text-gray-400">OpenCV AI Competition 2026 Innovation Demonstration</p>
          </div>
        </div>

        {/* Runtime Mode Toggle */}
        <button
          onClick={handleToggleRuntime}
          className="floating-badge text-xs font-bold bg-white/10 hover:border-white/30 cursor-pointer"
        >
          Runtime: <span className={runtimeConfig.mode === 'AWS' ? 'text-emerald-400 font-bold' : 'text-rakta-300 font-bold'}>{runtimeConfig.mode}</span>
        </button>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Top Control & Demo Banner */}
        <div className="glass-card border-white/15 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="floating-badge text-emerald-300 bg-emerald-500/15 border-emerald-500/30 mb-2">
                🤖 Active Perception Agent Engine
              </span>
              <h2 className="text-xl font-bold text-white">Active Visual Evidence Loop Demonstration</h2>
              <p className="text-xs text-gray-300 mt-1 max-w-xl">
                Demonstrates how OpenCV 5 visual evidence actively triggers agent actions (Recapture $\rightarrow$ 2nd View $\rightarrow$ Cross-Validation $\rightarrow$ Final Screening).
              </p>
            </div>

            <button
              onClick={handleRunDemoScenario}
              disabled={isDemoRunning}
              className="btn-gradient-emerald text-sm py-3.5 px-6 whitespace-nowrap shadow-xl"
            >
              {isDemoRunning ? '🔄 Running Agentic Scenario...' : '🚀 START AGENTIC DEMO'}
            </button>
          </div>

          {/* Active Demo Step Indicator */}
          {demoStep > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2 animate-fade-in">
              <div className={`p-3 rounded-xl border text-center text-xs transition-all ${
                demoStep === 1 ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold scale-105' : 'bg-gray-900/60 border-white/10 text-gray-500'
              }`}>
                Attempt 1: Glare $\rightarrow$ Recapture Prompt
              </div>
              <div className={`p-3 rounded-xl border text-center text-xs transition-all ${
                demoStep === 2 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold scale-105' : 'bg-gray-900/60 border-white/10 text-gray-500'
              }`}>
                Attempt 2: Borderline $\rightarrow$ 2nd View Request
              </div>
              <div className={`p-3 rounded-xl border text-center text-xs transition-all ${
                demoStep === 3 ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold scale-105' : 'bg-gray-900/60 border-white/10 text-gray-500'
              }`}>
                Attempt 3: Cross-Validation $\rightarrow$ Result
              </div>
            </div>
          )}
        </div>

        {/* Real-time Agent Trace Console */}
        <div className="glass-card space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              Live Agent Execution Trace
            </h3>
            <span className="text-[11px] font-mono text-gray-400">PERCEIVE → DECIDE → ACT</span>
          </div>

          <div className="bg-black/80 rounded-2xl p-4 font-mono text-xs text-emerald-400 space-y-2 max-h-64 overflow-y-auto border border-white/10">
            {activeTrace.map((line, idx) => (
              <div key={idx} className="leading-relaxed border-b border-white/5 pb-1">
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* OpenCV 5 & AWS Architecture Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OpenCV 5 Substantive Vision Features */}
          <div className="glass-card space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>👁️</span> OpenCV 5 Vision Subsystem
            </h3>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                <span>Sharpness Metric</span>
                <span className="font-mono text-emerald-400">Laplacian Variance Var(ΔI)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                <span>Exposure & Luminance</span>
                <span className="font-mono text-emerald-400">CIELAB L-channel Mean</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                <span>Specular Glare Detection</span>
                <span className="font-mono text-emerald-400">LAB L &gt; 230 Masking</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                <span>Conjunctiva Redness</span>
                <span className="font-mono text-emerald-400">CIELAB a* & R/(R+G) Ratio</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                <span>Temporal Aggregation</span>
                <span className="font-mono text-emerald-400">5-15 Frame Trimmed Median</span>
              </div>
            </div>
          </div>

          {/* AWS & MCP Architecture Panel */}
          <div className="glass-card space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>☁️</span> AWS & MCP Tool Framework
            </h3>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                <span>AI Orchestration</span>
                <span className="font-mono text-emerald-400">Amazon Bedrock (Claude 3)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                <span>MCP Tools</span>
                <span className="font-mono text-emerald-400">10 Registered Tools</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                <span>Database</span>
                <span className="font-mono text-emerald-400">Amazon DynamoDB</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                <span>Observability</span>
                <span className="font-mono text-emerald-400">AWS CloudWatch Logs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                <span>Privacy Mode</span>
                <span className="font-mono text-emerald-400">On-Device Default</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive MCP Tool Tester */}
        <div className="glass-card space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>⚙️</span> Interactive MCP Tool Execution Tester
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedTool}
              onChange={e => setSelectedTool(e.target.value)}
              className="flex-1 bg-gray-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rakta-500"
            >
              {MCP_TOOL_DEFINITIONS.map(t => (
                <option key={t.name} value={t.name}>
                  {t.name}() — {t.description}
                </option>
              ))}
            </select>

            <button
              onClick={handleTestTool}
              className="btn-gradient-secondary text-xs py-2.5 px-5 whitespace-nowrap"
            >
              Execute MCP Tool
            </button>
          </div>

          {toolOutput && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
              <p className="font-bold flex items-center gap-2">
                <span>✅</span> Executed Tool: <span className="font-mono">{toolOutput.tool || selectedTool}</span>
              </p>
              <div className="bg-black/60 p-3 rounded-xl border border-white/10 text-[11px] font-mono leading-relaxed">
                {JSON.stringify(toolOutput.output || toolOutput, null, 2)}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
