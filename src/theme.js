// Light / dark theme for the page and the 3D scenes. Saved in this browser.
import { themeState } from './theme-state.js';
import { setTheme as setSceneTheme } from './three/engine.js';

function saved() {
  try { return localStorage.getItem('ssl.theme'); } catch { return null; }
}

export function applyTheme(mode) {
  const light = mode === 'light';
  themeState.light = light;
  document.documentElement.classList.toggle('dark', !light);
  document.documentElement.style.colorScheme = light ? 'light' : 'dark';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', light ? '#fafafa' : '#0a0a0a');
  setSceneTheme(light);
  try { localStorage.setItem('ssl.theme', mode); } catch { /* private mode */ }
  document.dispatchEvent(new CustomEvent('themechange', { detail: mode }));
}

export function initTheme() { applyTheme(saved() || 'light'); }
export function toggleTheme() { applyTheme(themeState.light ? 'dark' : 'light'); }
export const isLightTheme = () => themeState.light;
