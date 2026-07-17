/* player.js — Sticky music player logic */
const Player = {
  audio: null,
  queue: [],
  index: 0,
  isPlaying: false,
  minutesListened: 0,
  _tick: null,

  init() {
    this.audio = document.getElementById("audio");
    this.playBtn = document.getElementById("playBtn");
    this.prevBtn = document.getElementById("prevBtn");
    this.nextBtn = document.getElementById("nextBtn");
    this.muteBtn = document.getElementById("muteBtn");
    this.vol = document.getElementById("volSlider");
    this.progressBar = document.getElementById("progressBar");
    this.progressFill = document.getElementById("progressFill");
    this.curTime = document.getElementById("curTime");
    this.durTime = document.getElementById("durTime");
    this.pCover = document.getElementById("pCover");
    this.pTitle = document.getElementById("pTitle");
    this.pArtist = document.getElementById("pArtist");

    this.playBtn.addEventListener("click", () => this.toggle());
    this.prevBtn.addEventListener("click", () => this.prev());
    this.nextBtn.addEventListener("click", () => this.next());
    this.muteBtn.addEventListener("click", () => this.toggleMute());
    this.vol.addEventListener("input", (e) => {
      this.audio.volume = e.target.value / 100;
    });
    this.audio.volume = 0.8;

    this.progressBar.addEventListener("click", (e) => {
      if (!this.audio.duration) return;
      const rect = this.progressBar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      this.audio.currentTime = ratio * this.audio.duration;
    });

    this.audio.addEventListener("timeupdate", () => this._render());
    this.audio.addEventListener("loadedmetadata", () => this._render());
    this.audio.addEventListener("ended", () => this.next());
    this.audio.addEventListener("error", () => {
      // Some CDN samples may not load; keep UI usable
      this.pArtist.textContent = "Preview unavailable";
    });

    this.minutesListened = MelodifyStorage.get("minutesListened", 0);
  },

  setQueue(songs, startIdx = 0) {
    this.queue = songs;
    this.index = startIdx;
    this._load();
    this.play();
  },

  _load() {
    const s = this.queue[this.index];
    if (!s) return;
    this.audio.src = s.src;
    this.pCover.src = s.cover;
    this.pTitle.textContent = s.title;
    this.pArtist.textContent = s.artist;
    // Track history
    if (window.RecentlyPlayed) RecentlyPlayed.add(s);
    // Stats
    const played = MelodifyStorage.get("songsPlayed", 0) + 1;
    MelodifyStorage.set("songsPlayed", played);
  },

  play() {
    const p = this.audio.play();
    if (p && p.catch)
      p.catch(() => {
        /* autoplay blocked or bad source */
      });
    this.isPlaying = true;
    this.playBtn.textContent = "⏸";
    this._startTick();
  },
  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.playBtn.textContent = "▶";
    this._stopTick();
  },
  toggle() {
    this.isPlaying
      ? this.pause()
      : this.audio.src
        ? this.play()
        : this._playFirst();
  },
  async _playFirst() {
    const songs = await DeezerAPI.getTrendingSongs();
    this.setQueue(songs, 0);
  },
  next() {
    if (!this.queue.length) return;
    this.index = (this.index + 1) % this.queue.length;
    this._load();
    this.play();
  },
  prev() {
    if (!this.queue.length) return;
    this.index = (this.index - 1 + this.queue.length) % this.queue.length;
    this._load();
    this.play();
  },
  toggleMute() {
    this.audio.muted = !this.audio.muted;
    this.muteBtn.textContent = this.audio.muted ? "🔇" : "🔊";
  },
  _startTick() {
    this._stopTick();
    this._tick = setInterval(() => {
      this.minutesListened += 1 / 60;
      if (
        Math.floor(this.minutesListened) !==
        MelodifyStorage.get("minutesListened", 0)
      ) {
        MelodifyStorage.set(
          "minutesListened",
          Math.floor(this.minutesListened),
        );
      }
    }, 1000);
  },
  _stopTick() {
    if (this._tick) {
      clearInterval(this._tick);
      this._tick = null;
    }
  },
  _render() {
    const cur = this.audio.currentTime || 0;
    const dur = this.audio.duration || 0;
    this.curTime.textContent = fmtTime(cur);
    this.durTime.textContent = fmtTime(dur);
    const pct = dur ? (cur / dur) * 100 : 0;
    this.progressFill.style.width = pct + "%";
  },
};

function fmtTime(t) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

window.Player = Player;
