import React, { useEffect, useRef } from 'react';

interface OscilloscopeProps {
  heartRate: number;
  melaninLevel: number;
  dcRedBoosted: number;
  dcIrBoosted: number;
  hasArtifact: number;
  stage1Boost: boolean;
  audioEnabled?: boolean;
}

export const OscilloscopeCanvas: React.FC<OscilloscopeProps> = ({
  heartRate,
  melaninLevel,
  dcRedBoosted,
  dcIrBoosted,
  hasArtifact,
  stage1Boost,
  audioEnabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastBeepTimeRef = useRef<number>(0);

  // Audio beep player on systolic pulse
  useEffect(() => {
    if (!audioEnabled) return;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
  }, [audioEnabled]);

  const playBleep = (pitch = 880) => {
    if (!audioEnabled || !audioCtxRef.current) return;
    try {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.09);
    } catch {
      // Audio not permitted yet
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let scanX = 0;
    const speed = 2.2; // pixels per frame

    // Buffer to store recent signal values across the width
    const width = canvas.width;
    const height = canvas.height;
    const redHistory = new Float32Array(width).fill(height / 2);
    const irHistory = new Float32Array(width).fill(height / 2);

    let phase = 0;
    let prevWave = 0;

    const render = () => {
      // Update cardiac phase
      const freq = heartRate / 60.0;
      const dt = 1 / 60; // 60 fps
      phase += 2 * Math.PI * freq * dt;
      if (phase > 2 * Math.PI) phase -= 2 * Math.PI;

      // Realistic cardiac pulsatile contour
      const primary = Math.sin(phase);
      const dicrotic = 0.35 * Math.sin(2 * phase - 0.85);
      const diastolic = 0.16 * Math.sin(3 * phase - 1.3);
      const wave = primary + dicrotic + diastolic;

      // Detect systolic peak for audio blip
      if (prevWave < 0.95 && wave >= 0.95) {
        const now = performance.now();
        if (now - lastBeepTimeRef.current > (60000 / heartRate) * 0.7) {
          playBleep(840);
          lastBeepTimeRef.current = now;
        }
      }
      prevWave = wave;

      // Scale amplitudes based on optical DC floor and melanin
      // When melanin is high, Red is severely attenuated unless stage1Boost is active
      const redScale = (dcRedBoosted / 1000) * 32;
      const irScale = (dcIrBoosted / 1000) * 26;

      // Inject motion jitter if toggled
      const jitter = hasArtifact > 0 ? (Math.random() - 0.5) * 45 * hasArtifact : (Math.random() - 0.5) * 2.5;

      const redY = height * 0.42 - wave * redScale + jitter;
      const irY = height * 0.68 - wave * irScale + jitter;

      // Write into current scan position
      const currentIdx = Math.floor(scanX);
      redHistory[currentIdx] = redY;
      irHistory[currentIdx] = irY;

      // Advance scanner
      scanX = (scanX + speed) % width;

      // Clear with dark biomedical screen gradient
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Draw oscilloscope grid
      ctx.strokeStyle = 'rgba(30, 58, 76, 0.4)';
      ctx.lineWidth = 1;

      const gridSize = 25;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw center division crosshairs
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height * 0.42);
      ctx.lineTo(width, height * 0.42);
      ctx.moveTo(0, height * 0.68);
      ctx.lineTo(width, height * 0.68);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw RED 660nm Waveform
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff3366';
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      let started = false;
      for (let x = 0; x < width; x++) {
        // Skip region near scanhead to simulate cathode phosphor erase
        const distFromScan = (x - scanX + width) % width;
        if (distFromScan < 18) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(x, redHistory[x]);
          started = true;
        } else {
          ctx.lineTo(x, redHistory[x]);
        }
      }
      ctx.stroke();

      // Draw INFRARED 880nm Waveform
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f2fe';
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      started = false;
      for (let x = 0; x < width; x++) {
        const distFromScan = (x - scanX + width) % width;
        if (distFromScan < 18) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(x, irHistory[x]);
          started = true;
        } else {
          ctx.lineTo(x, irHistory[x]);
        }
      }
      ctx.stroke();

      // Draw cathode scan line
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(20, 184, 166, 0.8)';
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scanX, 0);
      ctx.lineTo(scanX, height);
      ctx.stroke();

      // Phosphor glow leading dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(scanX, redY, 3.5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(scanX, irY, 3.5, 0, 2 * Math.PI);
      ctx.fill();

      // Annotations
      ctx.shadowBlur = 0;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ff3366';
      ctx.fillText(`CH1: RED 660nm [DC: ${Math.round(dcRedBoosted)} LSB]`, 14, 22);

      ctx.fillStyle = '#00f2fe';
      ctx.fillText(`CH2: IR 880nm [DC: ${Math.round(dcIrBoosted)} LSB]`, 14, height * 0.54);

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${heartRate} BPM | SWEEP 25mm/s`, width - 150, 22);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [heartRate, melaninLevel, dcRedBoosted, dcIrBoosted, hasArtifact, stage1Boost, audioEnabled]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#060a12] shadow-2xl">
      {/* Top Header bar with status indicators */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping"></span>
            <span className="text-teal-300 font-bold uppercase">LIVE AFE DUAL-WAVELENGTH SCOPE</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">MAX86141 19-Bit Delta-Sigma</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-rose-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> 660nm Red
          </span>
          <span className="text-cyan-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span> 880nm IR
          </span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={780}
        height={320}
        className="w-full h-[280px] sm:h-[320px] block cursor-crosshair"
      />

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-t border-slate-900 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span>TIMEBASE: 50 ms/div</span>
          <span>SENS: 50 mV/div</span>
          <span>BW: 0.5 - 4.0 Hz</span>
        </div>
        <div>
          {stage1Boost ? (
            <span className="text-teal-400 font-semibold bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
              LED CURRENT ADAPTIVE BOOST: ACTIVE (+{(20 * Math.log10(dcRedBoosted / 400)).toFixed(1)} dB)
            </span>
          ) : (
            <span className="text-slate-500">LED CURRENT: STATIC 10mA</span>
          )}
        </div>
      </div>
    </div>
  );
};
