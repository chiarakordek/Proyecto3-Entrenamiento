import { useSyncExternalStore } from 'react';
import { guardarClave, leerClave } from './guardado';

/**
 * Sonidos sintetizados con Web Audio: no hay archivos que descargar.
 * Cada efecto es una secuencia corta de notas con envolvente suave.
 * Se respeta la preferencia del usuario (silenciado se guarda en localStorage).
 */

const CLAVE = 'p3-sonido';
let activo = leerClave(CLAVE) !== 'off';
const oyentes = new Set<() => void>();
let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface Nota {
  /** Frecuencia en Hz. */
  f: number;
  /** Inicio relativo en segundos. */
  t: number;
  /** Duración en segundos. */
  d: number;
  tipo?: OscillatorType;
  vol?: number;
  /** Frecuencia final (para un barrido). */
  hasta?: number;
}

function tocar(notas: Nota[]) {
  if (!activo) return;
  const ac = contexto();
  if (!ac) return;
  const ahora = ac.currentTime + 0.01;
  const master = ac.createGain();
  master.gain.value = 0.22;
  master.connect(ac.destination);
  for (const n of notas) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = n.tipo ?? 'sine';
    osc.frequency.setValueAtTime(n.f, ahora + n.t);
    if (n.hasta) osc.frequency.exponentialRampToValueAtTime(n.hasta, ahora + n.t + n.d);
    const v = n.vol ?? 1;
    g.gain.setValueAtTime(0.0001, ahora + n.t);
    g.gain.exponentialRampToValueAtTime(v, ahora + n.t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, ahora + n.t + n.d);
    osc.connect(g).connect(master);
    osc.start(ahora + n.t);
    osc.stop(ahora + n.t + n.d + 0.05);
  }
}

/**
 * Trompeta: por nota, dos dientes de sierra levemente desafinados pasan por un filtro
 * pasabajos que se abre rápido (el "soplido" del bronce). La última nota lleva vibrato.
 */
function trompeta(notas: { f: number; t: number; d: number }[]) {
  if (!activo) return;
  const ac = contexto();
  if (!ac) return;
  const inicio = ac.currentTime + 0.02;
  const master = ac.createGain();
  master.gain.value = 0.16;
  master.connect(ac.destination);

  notas.forEach((n, i) => {
    const ultima = i === notas.length - 1;
    const t0 = inicio + n.t;
    const filtro = ac.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.Q.value = 2;
    filtro.frequency.setValueAtTime(500, t0);
    filtro.frequency.exponentialRampToValueAtTime(3200, t0 + 0.06);
    filtro.frequency.exponentialRampToValueAtTime(1800, t0 + n.d);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(1, t0 + 0.03);
    g.gain.setValueAtTime(0.85, t0 + Math.max(0.04, n.d - 0.08));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.d + (ultima ? 0.25 : 0.03));
    filtro.connect(g).connect(master);

    for (const desafinado of [-7, 7]) {
      const osc = ac.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, t0);
      osc.detune.value = desafinado;
      if (ultima) {
        const lfo = ac.createOscillator();
        const prof = ac.createGain();
        lfo.frequency.value = 5.5;
        prof.gain.value = 9;
        lfo.connect(prof).connect(osc.frequency);
        lfo.start(t0 + 0.15);
        lfo.stop(t0 + n.d + 0.3);
      }
      osc.connect(filtro);
      osc.start(t0);
      osc.stop(t0 + n.d + 0.3);
    }
  });
}

// Notas (Hz)
const DO5 = 523.25, MI5 = 659.25, SOL5 = 783.99, DO6 = 1046.5, LA4 = 440, MI4 = 329.63, SOL4 = 392;

export const sonidos = {
  /** Toque corto al sumar o restar en un selector. */
  toque: () => tocar([{ f: 880, t: 0, d: 0.04, tipo: 'triangle', vol: 0.35 }]),
  /** Serie guardada: dos notas ascendentes, como un "listo". */
  serie: () =>
    tocar([
      { f: DO5, t: 0, d: 0.12, tipo: 'triangle' },
      { f: SOL5, t: 0.09, d: 0.2, tipo: 'triangle' },
    ]),
  /** Deshacer: una nota que baja. */
  deshacer: () => tocar([{ f: 520, hasta: 300, t: 0, d: 0.16, tipo: 'sine', vol: 0.6 }]),
  /** Cuenta regresiva del descanso (3, 2, 1). */
  cuenta: () => tocar([{ f: LA4, t: 0, d: 0.09, tipo: 'square', vol: 0.25 }]),
  /** Fin del descanso: a la barra. */
  vamos: () =>
    tocar([
      { f: MI5, t: 0, d: 0.1, tipo: 'square', vol: 0.3 },
      { f: DO6, t: 0.1, d: 0.28, tipo: 'square', vol: 0.3 },
    ]),
  /** Ejercicio completo: arpegio corto. */
  ejercicio: () =>
    tocar([
      { f: DO5, t: 0, d: 0.12, tipo: 'triangle' },
      { f: MI5, t: 0.08, d: 0.12, tipo: 'triangle' },
      { f: SOL5, t: 0.16, d: 0.25, tipo: 'triangle' },
    ]),
  /** Sesión cerrada: acorde mayor. */
  cierre: () =>
    tocar([
      { f: MI4, t: 0, d: 0.7, tipo: 'triangle', vol: 0.6 },
      { f: SOL4, t: 0.03, d: 0.7, tipo: 'triangle', vol: 0.6 },
      { f: DO5, t: 0.06, d: 0.8, tipo: 'triangle', vol: 0.7 },
    ]),
  /** Logro o récord: trompeta de victoria (ta-ta-ta-taaa, ta-taaaa). */
  victoria: () =>
    trompeta([
      { f: SOL4, t: 0, d: 0.11 },
      { f: SOL4, t: 0.13, d: 0.11 },
      { f: SOL4, t: 0.26, d: 0.11 },
      { f: DO5, t: 0.39, d: 0.42 },
      { f: MI5, t: 0.86, d: 0.13 },
      { f: SOL5, t: 1.01, d: 0.75 },
    ]),
  /** Alias histórico. */
  record: () => sonidos.victoria(),
  /** Algo salió mal (validación). */
  error: () =>
    tocar([
      { f: 220, t: 0, d: 0.12, tipo: 'sawtooth', vol: 0.25 },
      { f: 196, t: 0.11, d: 0.18, tipo: 'sawtooth', vol: 0.25 },
    ]),
  /** Confirmación genérica (guardar, asignar). */
  ok: () =>
    tocar([
      { f: SOL5, t: 0, d: 0.1, tipo: 'sine', vol: 0.7 },
      { f: DO6, t: 0.08, d: 0.22, tipo: 'sine', vol: 0.7 },
    ]),
};

export function vibrar(patron: number | number[]) {
  if (activo && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(patron);
}

export function setSonido(valor: boolean) {
  activo = valor;
  guardarClave(CLAVE, valor ? 'on' : 'off');
  oyentes.forEach((o) => o());
  if (valor) sonidos.ok();
}

export function useSonidoActivo(): boolean {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => oyentes.delete(o);
    },
    () => activo,
    () => activo,
  );
}
