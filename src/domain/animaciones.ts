import type { Ejercicio, GrupoMuscular } from './tipos';

/**
 * Animaciones de "cómo se hace": figura de perfil, mirando a la derecha.
 * Cada patrón es una secuencia de poses (posición de cada articulación) y
 * la animación interpola entre ellas en bucle.
 * Sistema de coordenadas: viewBox 0 -14 160 128, piso en y = 108.
 */

export type P = readonly [number, number];

export interface Pose {
  hombro: P;
  cadera: P;
  codo: P;
  mano: P;
  rodilla: P;
  tobillo: P;
  punta?: P;
  /** Brazo y pierna del lado lejano, cuando se mueven distinto (correr, bici). */
  codo2?: P;
  mano2?: P;
  rodilla2?: P;
  tobillo2?: P;
  punta2?: P;
  /** Altura de la soga (solo saltos a la soga). */
  cuerda?: number;
}

export type Equipo =
  | { t: 'rect'; x: number; y: number; w: number; h: number }
  | { t: 'linea'; x1: number; y1: number; x2: number; y2: number; grosor?: number }
  | { t: 'circulo'; cx: number; cy: number; r: number }
  | { t: 'cable'; x: number; y: number }
  | { t: 'barra-corta' }
  | { t: 'rueda' }
  | { t: 'cuerda' };

export type Carga = 'disco' | 'mancuerna';

export interface Patron {
  poses: Pose[];
  /** Duración en segundos de la transición desde cada pose a la siguiente (cíclico). */
  tiempos: number[];
  /** Indicación de cada fase (misma longitud que poses). */
  fases: string[];
  equipo?: Equipo[];
  carga?: Carga;
  sinSuelo?: boolean;
}

// Piernas de pie, reutilizadas.
const PIE = { rodilla: [81, 83] as P, tobillo: [80, 105] as P, punta: [89, 106] as P };
const DE_PIE = { hombro: [80, 28] as P, cadera: [80, 60] as P, ...PIE };

const PLANCHA_ALTA: Pose = { hombro: [100, 78], cadera: [66, 88], codo: [100, 93], mano: [101, 107], rodilla: [48, 96], tobillo: [30, 104], punta: [32, 108] };

export const PATRONES: Record<string, Patron> = {
  sentadilla: {
    poses: [
      { hombro: [80, 28], cadera: [80, 60], codo: [66, 40], mano: [70, 31], ...PIE },
      { hombro: [88, 52], cadera: [64, 80], codo: [74, 64], mano: [79, 55], rodilla: [88, 82], tobillo: [80, 105], punta: [89, 106] },
    ],
    tiempos: [2, 1.2],
    fases: ['Bajá llevando la cadera atrás, espalda recta', 'Subí empujando el piso con todo el pie'],
    carga: 'disco',
  },
  sillon: {
    poses: [
      { hombro: [60, 42], cadera: [64, 70], codo: [64, 56], mano: [72, 70], rodilla: [88, 70], tobillo: [90, 94], punta: [97, 97] },
      { hombro: [60, 42], cadera: [64, 70], codo: [64, 56], mano: [72, 70], rodilla: [88, 70], tobillo: [111, 66], punta: [115, 60] },
    ],
    tiempos: [1, 1.8],
    fases: ['Extendé la pierna y apretá un segundo arriba', 'Bajá lento, sin soltar el peso'],
    equipo: [
      { t: 'rect', x: 50, y: 72, w: 34, h: 7 },
      { t: 'linea', x1: 52, y1: 72, x2: 50, y2: 36, grosor: 5 },
      { t: 'linea', x1: 62, y1: 79, x2: 62, y2: 108, grosor: 4 },
    ],
  },
  bisagra: {
    poses: [
      { hombro: [80, 28], cadera: [80, 60], codo: [81, 44], mano: [82, 60], rodilla: [82, 83], tobillo: [80, 105], punta: [89, 106] },
      { hombro: [100, 48], cadera: [68, 58], codo: [96, 64], mano: [90, 80], rodilla: [84, 82], tobillo: [80, 105], punta: [89, 106] },
    ],
    tiempos: [2, 1.2],
    fases: ['Llevá la cadera atrás, la carga pegada a las piernas', 'Volvé apretando los glúteos'],
  },
  hipthrust: {
    poses: [
      { hombro: [54, 80], cadera: [78, 100], codo: [66, 92], mano: [76, 98], rodilla: [98, 84], tobillo: [102, 105], punta: [111, 106] },
      { hombro: [54, 80], cadera: [84, 82], codo: [68, 84], mano: [80, 80], rodilla: [106, 83], tobillo: [102, 105], punta: [111, 106] },
    ],
    tiempos: [1, 1.6],
    fases: ['Empujá con los talones y subí la cadera', 'Bajá controlado sin apoyar del todo'],
    equipo: [{ t: 'rect', x: 26, y: 84, w: 30, h: 24 }],
    carga: 'disco',
  },
  camilla: {
    poses: [
      { hombro: [50, 72], cadera: [80, 74], codo: [44, 80], mano: [36, 84], rodilla: [102, 74], tobillo: [124, 75], punta: [128, 69] },
      { hombro: [50, 72], cadera: [80, 74], codo: [44, 80], mano: [36, 84], rodilla: [102, 74], tobillo: [96, 52], punta: [102, 49] },
    ],
    tiempos: [1, 1.8],
    fases: ['Llevá los talones hacia la cola', 'Bajá lento con la cadera pegada'],
    equipo: [
      { t: 'rect', x: 30, y: 78, w: 80, h: 6 },
      { t: 'linea', x1: 40, y1: 84, x2: 40, y2: 108, grosor: 4 },
      { t: 'linea', x1: 100, y1: 84, x2: 100, y2: 108, grosor: 4 },
    ],
  },
  talones: {
    poses: [
      { ...DE_PIE, codo: [80, 45], mano: [82, 60], tobillo: [80, 103], punta: [90, 106] },
      { hombro: [80, 21], cadera: [80, 53], codo: [80, 38], mano: [82, 53], rodilla: [81, 76], tobillo: [82, 97], punta: [90, 106] },
    ],
    tiempos: [0.9, 1.4],
    fases: ['Subí en puntas de pie lo más alto posible', 'Bajá estirando la pantorrilla'],
  },
  'press-banca': {
    poses: [
      { hombro: [54, 72], cadera: [86, 74], codo: [56, 56], mano: [56, 40], rodilla: [106, 80], tobillo: [108, 105], punta: [116, 106] },
      { hombro: [54, 72], cadera: [86, 74], codo: [42, 76], mano: [56, 62], rodilla: [106, 80], tobillo: [108, 105], punta: [116, 106] },
    ],
    tiempos: [2, 1.1],
    fases: ['Bajá controlado hasta rozar el pecho', 'Empujá hacia arriba exhalando'],
    equipo: [
      { t: 'rect', x: 34, y: 76, w: 66, h: 6 },
      { t: 'linea', x1: 44, y1: 82, x2: 44, y2: 108, grosor: 4 },
      { t: 'linea', x1: 90, y1: 82, x2: 90, y2: 108, grosor: 4 },
    ],
    carga: 'disco',
  },
  flexiones: {
    poses: [PLANCHA_ALTA, { hombro: [100, 96], cadera: [66, 99], codo: [88, 94], mano: [101, 107], rodilla: [48, 102], tobillo: [30, 104], punta: [32, 108] }],
    tiempos: [1.6, 1],
    fases: ['Bajá en bloque, cuerpo en línea recta', 'Empujá el piso hasta estirar los brazos'],
  },
  dominada: {
    poses: [
      { hombro: [80, 26], cadera: [80, 58], codo: [83, 12], mano: [84, -4], rodilla: [80, 80], tobillo: [74, 100], punta: [80, 104] },
      { hombro: [80, 10], cadera: [80, 42], codo: [68, 8], mano: [84, -4], rodilla: [80, 64], tobillo: [74, 84], punta: [80, 88] },
    ],
    tiempos: [1.2, 1.8],
    fases: ['Tirá con la espalda hasta pasar el mentón', 'Bajá lento hasta estirar los brazos'],
    equipo: [{ t: 'linea', x1: 52, y1: -5, x2: 116, y2: -5, grosor: 4 }],
  },
  jalon: {
    poses: [
      { hombro: [80, 30], cadera: [78, 72], codo: [84, 14], mano: [86, 0], rodilla: [100, 72], tobillo: [102, 100], punta: [110, 102] },
      { hombro: [80, 30], cadera: [78, 72], codo: [74, 40], mano: [88, 26], rodilla: [100, 72], tobillo: [102, 100], punta: [110, 102] },
    ],
    tiempos: [1.2, 1.8],
    fases: ['Llevá la barra al pecho tirando con los codos', 'Volvé arriba controlando'],
    equipo: [{ t: 'rect', x: 64, y: 74, w: 30, h: 6 }, { t: 'linea', x1: 76, y1: 80, x2: 76, y2: 108, grosor: 4 }, { t: 'cable', x: 86, y: -14 }, { t: 'barra-corta' }],
  },
  remo: {
    poses: [
      { hombro: [100, 46], cadera: [70, 58], codo: [100, 62], mano: [100, 78], rodilla: [84, 82], tobillo: [80, 105], punta: [89, 106] },
      { hombro: [100, 46], cadera: [70, 58], codo: [86, 46], mano: [94, 62], rodilla: [84, 82], tobillo: [80, 105], punta: [89, 106] },
    ],
    tiempos: [1, 1.6],
    fases: ['Tirá hacia el ombligo juntando las escápulas', 'Bajá estirando los brazos'],
    carga: 'disco',
  },
  'press-militar': {
    poses: [
      { ...DE_PIE, codo: [90, 38], mano: [86, 26] },
      { ...DE_PIE, codo: [84, 10], mano: [82, -6] },
    ],
    tiempos: [1.1, 1.8],
    fases: ['Empujá por encima de la cabeza', 'Bajá hasta la altura del mentón'],
    carga: 'disco',
  },
  elevacion: {
    poses: [
      { ...DE_PIE, codo: [81, 44], mano: [83, 60] },
      { ...DE_PIE, codo: [96, 30], mano: [112, 28] },
    ],
    tiempos: [1.1, 1.8],
    fases: ['Subí los brazos hasta la altura de los hombros', 'Bajá lento, sin balancearte'],
    carga: 'mancuerna',
  },
  vuelos: {
    poses: [
      { hombro: [100, 48], cadera: [70, 58], codo: [100, 64], mano: [100, 80], rodilla: [84, 82], tobillo: [80, 105], punta: [89, 106] },
      { hombro: [100, 48], cadera: [70, 58], codo: [108, 34], mano: [118, 24], rodilla: [84, 82], tobillo: [80, 105], punta: [89, 106] },
    ],
    tiempos: [1.1, 1.8],
    fases: ['Abrí los brazos apretando la parte de atrás del hombro', 'Volvé lento'],
    carga: 'mancuerna',
  },
  curl: {
    poses: [
      { ...DE_PIE, codo: [80, 44], mano: [83, 60] },
      { ...DE_PIE, codo: [80, 44], mano: [86, 30] },
    ],
    tiempos: [1, 1.8],
    fases: ['Subí sin mover el codo', 'Bajá en dos tiempos'],
    carga: 'mancuerna',
  },
  fondos: {
    poses: [
      { hombro: [80, 30], cadera: [78, 64], codo: [80, 46], mano: [80, 62], rodilla: [76, 86], tobillo: [66, 98], punta: [68, 104] },
      { hombro: [80, 46], cadera: [78, 80], codo: [66, 50], mano: [80, 62], rodilla: [72, 100], tobillo: [58, 104], punta: [56, 110] },
    ],
    tiempos: [1.6, 1.1],
    fases: ['Bajá hasta que el codo forme 90°', 'Empujá hasta estirar los brazos'],
    equipo: [{ t: 'linea', x1: 66, y1: 63, x2: 100, y2: 63, grosor: 4 }, { t: 'linea', x1: 96, y1: 63, x2: 96, y2: 112, grosor: 4 }],
    sinSuelo: true,
  },
  'ext-triceps': {
    poses: [
      { ...DE_PIE, codo: [82, 44], mano: [92, 34] },
      { ...DE_PIE, codo: [82, 44], mano: [86, 62] },
    ],
    tiempos: [1, 1.6],
    fases: ['Extendé el brazo con el codo pegado al cuerpo', 'Volvé hasta los 90°'],
    equipo: [{ t: 'cable', x: 100, y: -14 }],
  },
  crunch: {
    poses: [
      { hombro: [46, 102], cadera: [78, 104], codo: [40, 94], mano: [36, 100], rodilla: [96, 86], tobillo: [106, 105], punta: [114, 106] },
      { hombro: [58, 88], cadera: [78, 104], codo: [52, 80], mano: [46, 86], rodilla: [96, 86], tobillo: [106, 105], punta: [114, 106] },
    ],
    tiempos: [1, 1.4],
    fases: ['Despegá los omóplatos exhalando', 'Volvé sin apoyar la cabeza'],
  },
  rueda: {
    poses: [
      { hombro: [82, 62], cadera: [64, 82], codo: [86, 78], mano: [88, 94], rodilla: [60, 106], tobillo: [40, 106], punta: [36, 103] },
      { hombro: [106, 88], cadera: [76, 94], codo: [120, 94], mano: [128, 98], rodilla: [60, 106], tobillo: [40, 106], punta: [36, 103] },
    ],
    tiempos: [2, 1.4],
    fases: ['Avanzá con la zona lumbar firme', 'Volvé contrayendo el abdomen'],
    equipo: [{ t: 'rueda' }],
  },
  plancha: {
    poses: [
      { hombro: [100, 90], cadera: [66, 92], codo: [100, 104], mano: [112, 104], rodilla: [48, 98], tobillo: [30, 104], punta: [32, 108] },
      { hombro: [100, 89], cadera: [66, 91], codo: [100, 104], mano: [112, 104], rodilla: [48, 97], tobillo: [30, 104], punta: [32, 108] },
    ],
    tiempos: [2, 2],
    fases: ['Sostené: cuerpo en línea, abdomen y glúteos firmes', 'Respirá sin dejar caer la cadera'],
  },
  'plancha-lateral': {
    poses: [
      { hombro: [100, 88], cadera: [66, 98], codo: [100, 104], mano: [112, 104], rodilla: [48, 102], tobillo: [30, 105], punta: [32, 108], codo2: [86, 84], mano2: [72, 92] },
      { hombro: [100, 86], cadera: [66, 88], codo: [100, 104], mano: [112, 104], rodilla: [48, 96], tobillo: [30, 105], punta: [32, 108], codo2: [86, 80], mano2: [72, 84] },
    ],
    tiempos: [1.6, 2],
    fases: ['Subí la cadera hasta alinear el cuerpo', 'Sostené sin dejarla caer'],
  },
  giros: {
    poses: [
      { hombro: [86, 74], cadera: [70, 100], codo: [92, 84], mano: [102, 88], rodilla: [92, 86], tobillo: [108, 96], punta: [114, 92] },
      { hombro: [86, 74], cadera: [70, 100], codo: [80, 86], mano: [72, 94], rodilla: [92, 86], tobillo: [108, 96], punta: [114, 92] },
    ],
    tiempos: [0.9, 0.9],
    fases: ['Rotá el torso hacia un lado', 'Rotá hacia el otro lado'],
  },
  lenador: {
    poses: [
      { ...DE_PIE, codo: [92, 16], mano: [104, 8] },
      { ...DE_PIE, hombro: [78, 30], codo: [78, 48], mano: [70, 64] },
    ],
    tiempos: [1, 1.6],
    fases: ['Llevá el cable en diagonal hacia abajo rotando el torso', 'Volvé controlando la rotación'],
    equipo: [{ t: 'cable', x: 120, y: -14 }],
  },
  superman: {
    poses: [
      { hombro: [46, 102], cadera: [80, 104], codo: [32, 104], mano: [18, 104], rodilla: [102, 104], tobillo: [124, 104], punta: [128, 100] },
      { hombro: [46, 96], cadera: [80, 104], codo: [32, 92], mano: [18, 88], rodilla: [102, 102], tobillo: [124, 96], punta: [128, 92] },
    ],
    tiempos: [1, 1.6],
    fases: ['Elevá brazos y piernas a la vez', 'Bajá sin soltar de golpe'],
  },
  correr: {
    poses: [
      {
        hombro: [83, 28], cadera: [80, 60], codo: [72, 42], mano: [78, 52], codo2: [92, 40], mano2: [100, 32],
        rodilla: [94, 76], tobillo: [86, 100], punta: [94, 102], rodilla2: [72, 80], tobillo2: [60, 90], punta2: [62, 96],
      },
      {
        hombro: [83, 28], cadera: [80, 60], codo: [92, 40], mano: [100, 32], codo2: [72, 42], mano2: [78, 52],
        rodilla: [72, 80], tobillo: [60, 90], punta: [62, 96], rodilla2: [94, 76], tobillo2: [86, 100], punta2: [94, 102],
      },
    ],
    tiempos: [0.42, 0.42],
    fases: ['Pisada suave, brazos acompañando', 'Ritmo en el que puedas hablar'],
    equipo: [
      { t: 'rect', x: 36, y: 102, w: 94, h: 5 },
      { t: 'linea', x1: 122, y1: 103, x2: 126, y2: 58, grosor: 4 },
      { t: 'linea', x1: 108, y1: 58, x2: 128, y2: 58, grosor: 4 },
    ],
    sinSuelo: true,
  },
  bici: {
    poses: [
      { hombro: [90, 34], cadera: [70, 58], codo: [98, 48], mano: [108, 52], rodilla: [94, 68], tobillo: [90, 88], punta: [96, 88], rodilla2: [84, 70], tobillo2: [70, 88], punta2: [76, 88] },
      { hombro: [90, 34], cadera: [70, 58], codo: [98, 48], mano: [108, 52], rodilla: [92, 62], tobillo: [80, 78], punta: [86, 78], rodilla2: [90, 76], tobillo2: [80, 98], punta2: [86, 98] },
      { hombro: [90, 34], cadera: [70, 58], codo: [98, 48], mano: [108, 52], rodilla: [84, 70], tobillo: [70, 88], punta: [76, 88], rodilla2: [94, 68], tobillo2: [90, 88], punta2: [96, 88] },
      { hombro: [90, 34], cadera: [70, 58], codo: [98, 48], mano: [108, 52], rodilla: [90, 76], tobillo: [80, 98], punta: [86, 98], rodilla2: [92, 62], tobillo2: [80, 78], punta2: [86, 78] },
    ],
    tiempos: [0.25, 0.25, 0.25, 0.25],
    fases: ['Pedaleá con ritmo constante', 'Rodilla casi estirada abajo', 'Espalda quieta', 'Respirá parejo'],
    equipo: [
      { t: 'circulo', cx: 80, cy: 88, r: 10 },
      { t: 'linea', x1: 66, y1: 60, x2: 80, y2: 88, grosor: 4 },
      { t: 'linea', x1: 80, y1: 88, x2: 106, y2: 54, grosor: 4 },
      { t: 'linea', x1: 62, y1: 59, x2: 74, y2: 59, grosor: 5 },
      { t: 'linea', x1: 104, y1: 52, x2: 112, y2: 46, grosor: 4 },
      { t: 'linea', x1: 60, y1: 108, x2: 110, y2: 108, grosor: 6 },
      { t: 'linea', x1: 80, y1: 98, x2: 80, y2: 108, grosor: 4 },
    ],
  },
  soga: {
    poses: [
      { ...DE_PIE, codo: [76, 44], mano: [86, 56], cuerda: 112 },
      { hombro: [80, 21], cadera: [80, 53], codo: [76, 37], mano: [86, 49], rodilla: [81, 76], tobillo: [80, 98], punta: [88, 100], cuerda: -18 },
    ],
    tiempos: [0.3, 0.3],
    fases: ['Saltos bajos sobre la punta de los pies', 'El giro sale de las muñecas'],
    equipo: [{ t: 'cuerda' }],
  },
  burpees: {
    poses: [
      { ...DE_PIE, codo: [80, 45], mano: [82, 60] },
      { hombro: [92, 62], cadera: [70, 84], codo: [96, 82], mano: [98, 104], rodilla: [90, 84], tobillo: [80, 105], punta: [89, 106] },
      PLANCHA_ALTA,
      { hombro: [80, 18], cadera: [80, 50], codo: [84, 4], mano: [86, -10], rodilla: [81, 73], tobillo: [80, 95], punta: [87, 98] },
    ],
    tiempos: [0.5, 0.5, 0.6, 0.5],
    fases: ['Bajá y apoyá las manos', 'Llevá los pies atrás a plancha', 'Volvé los pies y saltá', 'Aterrizá suave'],
  },
  remoergometro: {
    poses: [
      { hombro: [78, 68], cadera: [64, 96], codo: [96, 80], mano: [110, 84], rodilla: [84, 76], tobillo: [104, 98], punta: [110, 96] },
      { hombro: [36, 68], cadera: [44, 96], codo: [46, 86], mano: [60, 82], rodilla: [72, 94], tobillo: [104, 98], punta: [110, 96] },
    ],
    tiempos: [0.9, 1.3],
    fases: ['Empujá con las piernas, después torso y brazos', 'Volvé: brazos, torso y piernas'],
    equipo: [
      { t: 'linea', x1: 26, y1: 104, x2: 132, y2: 104, grosor: 4 },
      { t: 'circulo', cx: 128, cy: 90, r: 11 },
      { t: 'cable', x: 124, y: 88 },
    ],
    sinSuelo: true,
  },
};

/** Ejercicio del catálogo semilla → patrón, carga y velocidad. */
const POR_EJERCICIO: Record<string, { patron: string; carga?: Carga | null; velocidad?: number }> = {
  'ej-press-banca': { patron: 'press-banca' },
  'ej-aperturas': { patron: 'press-banca', carga: 'mancuerna' },
  'ej-flexiones': { patron: 'flexiones' },
  'ej-dominadas': { patron: 'dominada' },
  'ej-jalon': { patron: 'jalon' },
  'ej-remo-barra': { patron: 'remo' },
  'ej-remo-mancuerna': { patron: 'remo', carga: 'mancuerna' },
  'ej-press-militar': { patron: 'press-militar' },
  'ej-elevaciones': { patron: 'elevacion' },
  'ej-vuelos': { patron: 'vuelos' },
  'ej-curl': { patron: 'curl' },
  'ej-fondos': { patron: 'fondos' },
  'ej-ext-triceps': { patron: 'ext-triceps' },
  'ej-sentadilla': { patron: 'sentadilla' },
  'ej-prensa': { patron: 'sentadilla', carga: null },
  'ej-sillon': { patron: 'sillon' },
  'ej-peso-muerto-rumano': { patron: 'bisagra', carga: 'disco' },
  'ej-hip-thrust': { patron: 'hipthrust' },
  'ej-camilla': { patron: 'camilla' },
  'ej-talones-parado': { patron: 'talones' },
  'ej-talones-sentado': { patron: 'talones' },
  'ej-crunch': { patron: 'crunch' },
  'ej-plancha-frontal': { patron: 'plancha' },
  'ej-rueda': { patron: 'rueda' },
  'ej-plancha-lateral': { patron: 'plancha-lateral' },
  'ej-giros-rusos': { patron: 'giros' },
  'ej-lenador': { patron: 'lenador' },
  'ej-hiperextensiones': { patron: 'bisagra' },
  'ej-superman': { patron: 'superman' },
  'ej-cinta': { patron: 'correr' },
  'ej-soga': { patron: 'soga' },
  'ej-remoergometro': { patron: 'remoergometro' },
  'ej-burpees': { patron: 'burpees' },
  'ej-bici': { patron: 'bici' },
  'ej-escalador': { patron: 'correr', velocidad: 0.6 },
};

/** Para ejercicios creados por el entrenador: un patrón según el grupo muscular. */
const POR_GRUPO: Record<GrupoMuscular, string> = {
  PECHO: 'press-banca',
  ESPALDA: 'remo',
  HOMBROS: 'press-militar',
  BRAZOS: 'curl',
  CUADRICEPS: 'sentadilla',
  GLUTEOS_ISQUIOS: 'bisagra',
  PANTORRILLAS: 'talones',
  ABDOMEN: 'crunch',
  OBLICUOS: 'giros',
  LUMBAR: 'superman',
  CUERPO_COMPLETO: 'burpees',
  PREDOMINIO_INFERIOR: 'bici',
};

export interface AnimacionResuelta {
  patron: Patron;
  carga: Carga | undefined;
  velocidad: number;
}

export function animacionDe(ej: Pick<Ejercicio, 'id' | 'grupo' | 'equipo'>): AnimacionResuelta {
  const especifica = POR_EJERCICIO[ej.id];
  const patron = PATRONES[especifica?.patron ?? POR_GRUPO[ej.grupo]];
  let carga: Carga | undefined = patron.carga;
  if (especifica && especifica.carga !== undefined) carga = especifica.carga ?? undefined;
  if (!especifica) {
    const equipo = ej.equipo?.toLowerCase() ?? '';
    carga = equipo.includes('mancuerna') ? 'mancuerna' : /^barra(?! fija)/.test(equipo) ? 'disco' : patron.carga;
  }
  return { patron, carga, velocidad: especifica?.velocidad ?? 1 };
}

/** Qué segmentos del cuerpo trabaja cada grupo (para pintarlos del color de la categoría). */
export type Segmento = 'torso' | 'brazo' | 'antebrazo' | 'muslo' | 'pierna';

export const SEGMENTOS_POR_GRUPO: Record<GrupoMuscular, Segmento[]> = {
  PECHO: ['torso', 'brazo'],
  ESPALDA: ['torso', 'brazo'],
  HOMBROS: ['brazo'],
  BRAZOS: ['brazo', 'antebrazo'],
  CUADRICEPS: ['muslo'],
  GLUTEOS_ISQUIOS: ['muslo'],
  PANTORRILLAS: ['pierna'],
  ABDOMEN: ['torso'],
  OBLICUOS: ['torso'],
  LUMBAR: ['torso'],
  CUERPO_COMPLETO: ['torso', 'brazo', 'antebrazo', 'muslo', 'pierna'],
  PREDOMINIO_INFERIOR: ['muslo', 'pierna'],
};

/** Pasos numerados a partir de la descripción técnica (una oración por paso). */
export function pasosDe(descripcion: string): string[] {
  return descripcion
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
