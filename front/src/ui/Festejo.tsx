import { useEffect, useRef } from 'react';
import { CONFETI } from './colores';

/**
 * Lluvia de papelitos para festejar (logros, récords, sesiones cerradas).
 * Se dispara desde cualquier parte con `festejar()`; una sola capa en App la dibuja en un canvas.
 */

const EVENTO = 'p3-festejo';

export function festejar(opciones: { cantidad?: number } = {}) {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: opciones }));
}

interface Papelito {
  x: number;
  y: number;
  vx: number;
  vy: number;
  giro: number;
  vGiro: number;
  ancho: number;
  alto: number;
  color: string;
  forma: 0 | 1 | 2; // rectángulo, círculo, tira
  vida: number;
}

export function CapaFestejo() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const papelitos = useRef<Papelito[]>([]);
  const animando = useRef(false);

  useEffect(() => {
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const lanzar = (e: Event) => {
      if (reducido) return;
      const cantidad = (e as CustomEvent<{ cantidad?: number }>).detail?.cantidad ?? 180;
      const w = window.innerWidth;
      for (let i = 0; i < cantidad; i++) {
        // Dos cañones desde las esquinas superiores y una lluvia desde arriba.
        const desde = i % 3;
        const x = desde === 0 ? -10 : desde === 1 ? w + 10 : Math.random() * w;
        const y = desde === 2 ? -20 - Math.random() * 120 : window.innerHeight * 0.6;
        const abertura = Math.PI / 3 + (Math.random() - 0.5) * 0.5;
        const angulo = desde === 0 ? -abertura : desde === 1 ? Math.PI + abertura : Math.PI / 2;
        const fuerza = desde === 2 ? 1 + Math.random() * 2 : 15 + Math.random() * 13;
        papelitos.current.push({
          x,
          y,
          vx: Math.cos(angulo) * fuerza + (Math.random() - 0.5) * 3,
          vy: Math.sin(angulo) * fuerza * (desde === 2 ? 1 : 1) - (desde === 2 ? 0 : 4),
          giro: Math.random() * Math.PI * 2,
          vGiro: (Math.random() - 0.5) * 0.35,
          ancho: 6 + Math.random() * 6,
          alto: 9 + Math.random() * 8,
          color: CONFETI[Math.floor(Math.random() * CONFETI.length)],
          forma: (Math.random() < 0.6 ? 0 : Math.random() < 0.5 ? 1 : 2) as 0 | 1 | 2,
          vida: 0,
        });
      }
      if (!animando.current) {
        animando.current = true;
        requestAnimationFrame(cuadro);
      }
    };

    const cuadro = () => {
      const c = canvas.current;
      if (!c) return;
      const dpr = window.devicePixelRatio || 1;
      if (c.width !== window.innerWidth * dpr || c.height !== window.innerHeight * dpr) {
        c.width = window.innerWidth * dpr;
        c.height = window.innerHeight * dpr;
      }
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      papelitos.current = papelitos.current.filter((p) => p.y < window.innerHeight + 40 && p.vida < 420);
      for (const p of papelitos.current) {
        p.vida++;
        p.vy += 0.22; // gravedad
        p.vx *= 0.985; // aire
        p.vy = Math.min(p.vy, 4.2 + Math.sin(p.vida / 9) * 0.6); // caída tipo hoja
        p.x += p.vx + Math.sin((p.vida + p.ancho) / 14) * 0.6;
        p.y += p.vy;
        p.giro += p.vGiro;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.giro);
        ctx.scale(1, Math.cos(p.vida / 6 + p.ancho)); // efecto de dar vueltas
        ctx.globalAlpha = p.vida > 340 ? Math.max(0, (420 - p.vida) / 80) : 1;
        ctx.fillStyle = p.color;
        if (p.color === '#FFFFFF') {
          ctx.strokeStyle = '#B8DCC6';
          ctx.lineWidth = 1;
        }
        if (p.forma === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, p.ancho / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.forma === 2) {
          ctx.fillRect(-p.ancho / 4, -p.alto, p.ancho / 2, p.alto * 2);
        } else {
          ctx.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto);
          if (p.color === '#FFFFFF') ctx.strokeRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto);
        }
        ctx.restore();
      }

      if (papelitos.current.length) requestAnimationFrame(cuadro);
      else {
        animando.current = false;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener(EVENTO, lanzar);
    return () => window.removeEventListener(EVENTO, lanzar);
  }, []);

  return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
}
