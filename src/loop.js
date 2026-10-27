import { CONFIG } from './config.js';

export function stepFrames(accumulator, frameDt) {
  const dt = Number.isFinite(frameDt) ? Math.min(Math.max(frameDt, 0), CONFIG.MAX_FRAME_DT) : 0;
  const total = accumulator + dt;
  const steps = Math.floor(total / CONFIG.FIXED_DT + 1e-9);
  const rest = Math.max(0, total - steps * CONFIG.FIXED_DT);
  return { steps, accumulator: Math.min(rest, CONFIG.FIXED_DT - 1e-12) };
}
