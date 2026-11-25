/**
 * Cálculo de discos para una barra olímpica: qué cargar en cada lado para llegar a un peso total.
 * Colores según el estándar de discos de competición (son los mismos colores de la app).
 */

export const PESO_BARRA_KG = 20;

export interface Disco {
  kg: number;
  color: 'rojo' | 'azul' | 'amarillo' | 'verde' | 'blanco' | 'gris';
  /** Altura relativa (1 = disco completo). */
  alto: number;
  /** Grosor relativo. */
  ancho: number;
}

export const DISCOS: Disco[] = [
  { kg: 25, color: 'rojo', alto: 1, ancho: 1.15 },
  { kg: 20, color: 'azul', alto: 1, ancho: 1 },
  { kg: 15, color: 'amarillo', alto: 1, ancho: 0.85 },
  { kg: 10, color: 'verde', alto: 1, ancho: 0.7 },
  { kg: 5, color: 'blanco', alto: 0.62, ancho: 0.55 },
  { kg: 2.5, color: 'gris', alto: 0.5, ancho: 0.45 },
  { kg: 1.25, color: 'gris', alto: 0.42, ancho: 0.38 },
];

export interface Carga {
  /** Discos de un solo lado, del más pesado (pegado al tope) al más liviano. */
  porLado: Disco[];
  /** Kilos que no se pueden armar con los discos disponibles. */
  resto: number;
  /** El peso pedido es menor que la barra sola. */
  menorQueBarra: boolean;
}

export function calcularCarga(totalKg: number, barraKg = PESO_BARRA_KG): Carga {
  if (totalKg < barraKg) return { porLado: [], resto: 0, menorQueBarra: true };
  let lado = (totalKg - barraKg) / 2;
  const porLado: Disco[] = [];
  for (const d of DISCOS) {
    while (lado + 1e-9 >= d.kg) {
      porLado.push(d);
      lado -= d.kg;
    }
  }
  return { porLado, resto: Math.round(lado * 2 * 100) / 100, menorQueBarra: false };
}

/** "1 de 15 kg y 1 de 2,5 kg" */
export function describirLado(porLado: Disco[]): string {
  if (porLado.length === 0) return 'nada: solo la barra';
  const conteo = new Map<number, number>();
  for (const d of porLado) conteo.set(d.kg, (conteo.get(d.kg) ?? 0) + 1);
  const partes = [...conteo.entries()].map(([kg, n]) => `${n} de ${String(kg).replace('.', ',')} kg`);
  return partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`;
}

/** El ejercicio se hace con barra olímpica (y no en barra fija ni en máquina). */
export function usaBarra(equipo: string | undefined): boolean {
  return !!equipo && /^barra(?! fija)/i.test(equipo.trim());
}
