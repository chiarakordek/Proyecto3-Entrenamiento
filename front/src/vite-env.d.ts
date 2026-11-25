/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'memoria' para usar navegación interna (sin rutas en la URL). */
  readonly VITE_ROUTER?: string;
  /** URL del back si no se sirve detrás del mismo dominio (por defecto se usa /api con el proxy de Vite). */
  readonly VITE_API_URL?: string;
}
