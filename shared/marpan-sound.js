class MarpanSound {
  constructor(options = {}) {
    this.context = null;
    this.masterGain = null;
    this.volume = options.volume ?? 0.22;
  }

  start() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContextClass();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      this.context.resume();
    }
  }

  playMidi(midi, options = {}) {
    this.start();

    const now = this.context.currentTime;
    const frequency = 440 * pow(2, (midi - 69) / 12);
    const duration = options.duration ?? 0.52;
    const level = options.level ?? 0.72;
    const pan = options.pan ?? 0;
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();

    panner.pan.value = constrain(pan, -1, 1);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(level, now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    envelope.connect(panner);
    panner.connect(this.masterGain);

    const partials = [
      { ratio: 1, level: 1 },
      { ratio: 2.01, level: 0.18 },
      { ratio: 3.99, level: 0.05 }
    ];

    for (const partial of partials) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency * partial.ratio;
      gain.gain.value = partial.level;
      oscillator.connect(gain);
      gain.connect(envelope);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.04);
    }
  }
}
