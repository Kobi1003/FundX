import { useState } from 'react'
import DarkVeil from './DarkVeil'
import { Sparkles, Sliders, Play, RefreshCw, Zap } from 'lucide-react'

export default function DarkVeilCard({
  title = 'FundX Neural Market Engine',
  subtitle = 'Powered by React Bits Dark Veil WebGL Shaders & Real-time Risk Matrices',
  defaultHue = 140,
  defaultSpeed = 0.5,
  defaultWarp = 0.35,
  defaultNoise = 0.05,
}) {
  const [hueShift, setHueShift] = useState(defaultHue)
  const [speed, setSpeed] = useState(defaultSpeed)
  const [warpAmount, setWarpAmount] = useState(defaultWarp)
  const [noiseIntensity, setNoiseIntensity] = useState(defaultNoise)
  const [showControls, setShowControls] = useState(false)
  const [isLightMode, setIsLightMode] = useState(false)

  const presetThemes = [
    { name: 'Emerald Cyber', hue: 140, warp: 0.35, speed: 0.5 },
    { name: 'Deep Space Purple', hue: 270, warp: 0.45, speed: 0.6 },
    { name: 'Solar Flare Gold', hue: 45, warp: 0.25, speed: 0.4 },
    { name: 'Neon Electric Blue', hue: 200, warp: 0.5, speed: 0.7 },
  ]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-950 text-slate-100 shadow-2xl shadow-emerald-950/20 transition-all duration-300">
      {/* Dark Veil Canvas Canvas Container */}
      <div className="absolute inset-0 z-0">
        <DarkVeil
          hueShift={hueShift}
          speed={speed}
          warpAmount={warpAmount}
          noiseIntensity={noiseIntensity}
          scanlineIntensity={0.25}
          scanlineFrequency={2.5}
          lightMode={isLightMode}
        />
        {/* Gradient Overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              <span>React Bits · Dark Veil Engine</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
              {title}
            </h2>
            <p className="text-sm text-slate-300/90 leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowControls(!showControls)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-emerald-500/50 backdrop-blur-md transition-all"
            >
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>{showControls ? 'Hide Shader Controls' : 'Shader Controls'}</span>
            </button>

            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 backdrop-blur-md transition-all"
            >
              <Zap className={`h-4 w-4 ${isLightMode ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span>{isLightMode ? 'Light Shader' : 'Dark Shader'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Pill Ribbon */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-3 backdrop-blur-md">
            <p className="text-[11px] font-semibold text-slate-400">Shader Hue Shift</p>
            <p className="text-lg font-bold text-emerald-400 font-mono">{hueShift}°</p>
          </div>
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-3 backdrop-blur-md">
            <p className="text-[11px] font-semibold text-slate-400">Flow Speed</p>
            <p className="text-lg font-bold text-cyan-400 font-mono">{speed.toFixed(2)}x</p>
          </div>
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-3 backdrop-blur-md">
            <p className="text-[11px] font-semibold text-slate-400">Warp Distortion</p>
            <p className="text-lg font-bold text-purple-400 font-mono">{warpAmount.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-3 backdrop-blur-md">
            <p className="text-[11px] font-semibold text-slate-400">WebGL Status</p>
            <p className="text-lg font-bold text-emerald-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </p>
          </div>
        </div>

        {/* Interactive Customizer Panel */}
        {showControls && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                Live React Bits Shader Tuning
              </span>
              <button
                onClick={() => {
                  setHueShift(defaultHue)
                  setSpeed(defaultSpeed)
                  setWarpAmount(defaultWarp)
                  setNoiseIntensity(defaultNoise)
                }}
                className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
              >
                <RefreshCw className="h-3 w-3" />
                Reset Defaults
              </button>
            </div>

            {/* Themes Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-400">Presets:</span>
              {presetThemes.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setHueShift(preset.hue)
                    setWarpAmount(preset.warp)
                    setSpeed(preset.speed)
                  }}
                  className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-emerald-500/50 hover:bg-slate-800 transition"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Hue Shift</span>
                  <span className="font-mono text-emerald-400">{hueShift}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hueShift}
                  onChange={(e) => setHueShift(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Animation Speed</span>
                  <span className="font-mono text-cyan-400">{speed.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Warp Amount</span>
                  <span className="font-mono text-purple-400">{warpAmount.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={warpAmount}
                  onChange={(e) => setWarpAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
