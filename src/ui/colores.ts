import type { TipoEjercicio } from '@/domain/tipos';

/** Colores por categoría para SVG y canvas (los mismos de tailwind.config.js). */
export const HEX_TIPO: Record<TipoEjercicio, { base: string; claro: string; oscuro: string }> = {
  TREN_SUPERIOR: { base: '#239A5E', claro: '#E1F4E9', oscuro: '#17663F' },
  TREN_INFERIOR: { base: '#1E88A8', claro: '#E0F1F7', oscuro: '#155E75' },
  ZONA_MEDIA: { base: '#F2B84B', claro: '#FCF1DB', oscuro: '#7A5300' },
  CARDIO: { base: '#E0583A', claro: '#FCE7E1', oscuro: '#A33A22' },
};

export const HEX = {
  goma: '#0F3D2E',
  tiza: '#EAF5EE',
  tiza300: '#B8DCC6',
  tinta: '#12302A',
  suave: '#4A6A60',
  chispa: '#F7C04A',
};

/** Paleta de los papelitos de festejo: las cuatro categorías más el amarillo de logro. */
export const CONFETI = ['#239A5E', '#1E88A8', '#F2B84B', '#E0583A', '#F7C04A', '#FFFFFF'];
