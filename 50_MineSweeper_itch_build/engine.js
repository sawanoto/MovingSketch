/* Minesweeper rules and the music timeline, independent of UI and audio. */
(function (root) {
  class MusicMineBoard {
    constructor(song, random = Math.random, options = {}) {
      this.song = song;
      this.size = options.size || song.size || 8;
      this.mineCount = options.mineCount || song.mineCount || 12;
      this.safeOpened = 0;
      this.phase = "playing";
      this.outcome = null;
      this.trigger = null;
      this.cells = Array.from({ length: this.size ** 2 }, (_, index) => ({ index, opened: false, marked: false, count: 0, mine: false, sounded: false }));
      const positions = this.cells.map(cell => cell.index);
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      this.mines = positions.slice(0, this.mineCount).sort((a, b) => a - b);
      this.mines.forEach(index => { this.cells[index].mine = true; });
      this.cells.forEach(cell => { cell.count = this.neighbors(cell.index).filter(index => this.cells[index].mine).length; });
      this.chain = [];
    }
    neighbors(index) {
      const result = [], row = Math.floor(index / this.size), col = index % this.size;
      for (let y = Math.max(0, row - 1); y <= Math.min(this.size - 1, row + 1); y++) {
        for (let x = Math.max(0, col - 1); x <= Math.min(this.size - 1, col + 1); x++) {
          if (y !== row || x !== col) result.push(y * this.size + x);
        }
      }
      return result;
    }
    mark(index) {
      const cell = this.cells[index];
      if (this.phase !== "playing" || !cell || cell.opened) return false;
      cell.marked = !cell.marked;
      return true;
    }
    open(index) {
      const cell = this.cells[index];
      if (this.phase !== "playing" || !cell || cell.marked || cell.opened) return null;
      if (cell.mine) {
        this.beginChain(index, "mine");
        return "mine";
      }
      const queue = [index];
      while (queue.length) {
        const current = this.cells[queue.pop()];
        if (current.opened || current.marked || current.mine) continue;
        current.opened = true;
        this.safeOpened++;
        if (!current.count) queue.push(...this.neighbors(current.index));
      }
      if (this.safeOpened === 64 - this.mineCount) {
        this.beginChain(this.mines[0], "clear");
        return "clear";
      }
      return "safe";
    }
    beginChain(start, outcome) {
      this.phase = "chain";
      this.outcome = outcome;
      this.trigger = start;
      // Assign notes 1–12 to a route rooted at the hit. Every hit starts C4;
      // the song is never rotated, truncated, or played out of order.
      const unvisited = this.mines.filter(index => index !== start), route = [start];
      const distance = (a, b) => (a % this.size - b % this.size) ** 2 + (Math.floor(a / this.size) - Math.floor(b / this.size)) ** 2;
      const exit = unvisited.reduce((best, index) => index % this.size > best % this.size ? index : best, unvisited[0]);
      while (unvisited.length) {
        const candidates = unvisited.length > 1 ? unvisited.filter(index => index !== exit) : unvisited;
        const next = candidates.reduce((best, index) => distance(route.at(-1), index) < distance(route.at(-1), best) ? index : best, candidates[0]);
        route.push(next);
        unvisited.splice(unvisited.indexOf(next), 1);
      }
      let at = 0;
      this.chain = this.song.melody.map((event, position) => {
        const entry = { ...event, position, at, cell: position < this.mineCount ? route[position] : null, outer: position >= this.mineCount ? position - this.mineCount : null };
        at += event.beats * 60000 / this.song.bpm;
        return entry;
      });
      this.duration = at;
    }
    finish() { if (this.phase === "chain") this.phase = "finished"; }
  }
  root.MusicMineBoard = MusicMineBoard;
})(globalThis);

