// Opt-in only. The ordinary work keeps its original controls, audio and timing.
(() => {
  if (!new URLSearchParams(location.search).has('demo')) return;
  const order = [0,1,2,3,4,5,6,7, 7,6,5,4,3,2,1,0, 0,2,4,7,4,2,0];
  const scenario = {
    leadMs: 1200, spacingMs: 650, tailMs: 3200,
    events: order.map((note, i) => ({at: 1200 + i * 650, note})),
    durationMs: 1200 + (order.length - 1) * 650 + 290 + 3200
  };
  let started = false;
  window.doremiDemo = {
    scenario, state: 'ready', log: [],
    async start() {
      if (started) throw new Error('Reload before starting another take');
      started = true;
      await userStartAudio();
      if (getAudioContext().state !== 'running') throw new Error('Audio needs a click/tap');
      // Seed and reset only the automatic blink schedule, without changing the renderer.
      randomSeed(1001);
      marpan.nextAutoBlinkAt = 0;
      this.state = 'running';
      const start = performance.now();
      for (const event of scenario.events) {
        await new Promise(resolve => setTimeout(resolve, Math.max(0, start + event.at - performance.now())));
        playNote(event.note);
        this.log.push({...event, actualMs: performance.now() - start});
      }
      await new Promise(resolve => setTimeout(resolve, Math.max(0, start + scenario.durationMs - performance.now())));
      this.state = 'finished';
      return this.log;
    }
  };
  // The exporter prepares the recorder first. A manual demo starts on its first click.
  if (!new URLSearchParams(location.search).has('capture')) {
    const begin = async () => {
      if (typeof marpan === 'undefined' || !marpan) { setTimeout(begin, 50); return; }
      try { await window.doremiDemo.start(); } catch (error) {
        window.doremiDemo.state = 'error'; console.error(error);
      }
    };
    begin();
  }
})();
