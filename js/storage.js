/* storage.js — LocalStorage layer for Melodify */
const STORE_KEY = "melodify.v1";

const Storage = {
  _read() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch {
      return {};
    }
  },
  _write(state) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  },
  get(key, fallback = null) {
    const s = this._read();
    return key in s ? s[key] : fallback;
  },
  set(key, value) {
    const s = this._read();
    s[key] = value;
    this._write(s);
  },
  push(key, value, maxLen = 20) {
    const arr = this.get(key, []);
    const filtered = arr.filter((item) => item.id !== value.id);
    filtered.unshift(value);
    this.set(key, filtered.slice(0, maxLen));
  },
  clear() {
    localStorage.removeItem(STORE_KEY);
  },
};

window.MelodifyStorage = Storage;
