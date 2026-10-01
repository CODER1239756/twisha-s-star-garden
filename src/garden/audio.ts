// Synthesized ambience (no sound files were supplied): soft wind/rain noise + a chime on planting.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseGain: GainNode | null = null;
let filter: BiquadFilterNode | null = null;

function ensure() {
  if (ctx) return ctx;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 500;
  noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.25;
  src.connect(filter).connect(noiseGain).connect(master);
  src.start();
  return ctx;
}

export const gardenAudio = {
  setEnabled(on: boolean) {
    if (!on && !ctx) return;
    const c = ensure();
    if (on) void c.resume();
    master!.gain.setTargetAtTime(on ? 0.5 : 0, c.currentTime, 0.4);
  },
  setRain(rain: boolean) {
    if (!ctx) return;
    filter!.frequency.setTargetAtTime(rain ? 2400 : 500, ctx.currentTime, 0.8);
    noiseGain!.gain.setTargetAtTime(rain ? 0.4 : 0.25, ctx.currentTime, 0.8);
  },
  chime() {
    if (!ctx || !master || master.gain.value < 0.01) return;
    const t = ctx.currentTime;
    [880, 1318.5, 1760].forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t + i * 0.12);
      g.gain.linearRampToValueAtTime(0.12, t + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 1.6);
      o.connect(g).connect(master!);
      o.start(t + i * 0.12);
      o.stop(t + i * 0.12 + 1.7);
    });
  },
};
