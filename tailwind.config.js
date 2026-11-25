/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad de la presentación del Proyecto 3: verde pino profundo y fondo menta.
        goma: { DEFAULT: '#0F3D2E', 700: '#174C3A', 600: '#1C5A45' },
        tiza: { DEFAULT: '#EAF5EE', 200: '#D5EBDD', 300: '#B8DCC6' },
        tinta: { DEFAULT: '#12302A', suave: '#4A6A60' },
        // El círculo amarillo de la portada de la PPT: resaltados y logros.
        chispa: { DEFAULT: '#F7C04A', claro: '#FFF3D6' },

        // Colores por categoría, tal como en la diapositiva 3 (un poco más vivos).
        superior: { DEFAULT: '#239A5E', claro: '#E1F4E9', oscuro: '#17663F' },
        inferior: { DEFAULT: '#1E88A8', claro: '#E0F1F7', oscuro: '#155E75' },
        media: { DEFAULT: '#F2B84B', claro: '#FCF1DB', oscuro: '#7A5300' },
        cardio: { DEFAULT: '#E0583A', claro: '#FCE7E1', oscuro: '#A33A22' },

        // Semáforo (estado), separado de las categorías.
        exito: { DEFAULT: '#1E9E5A', claro: '#DDF4E7', oscuro: '#146E3E' },
        aviso: { DEFAULT: '#F2B84B', claro: '#FCF1DB', oscuro: '#7A5300' },
        peligro: { DEFAULT: '#D64545', claro: '#FBE4E4', oscuro: '#9B2525' },
      },
      fontFamily: {
        sans: ['"Archivo Variable"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.8rem', { lineHeight: '1.15rem' }],
        sm: ['0.9rem', { lineHeight: '1.35rem' }],
        base: ['1rem', { lineHeight: '1.55rem' }],
        lg: ['1.25rem', { lineHeight: '1.75rem' }],
        xl: ['1.563rem', { lineHeight: '1.95rem' }],
        '2xl': ['1.953rem', { lineHeight: '2.25rem' }],
        '3xl': ['2.441rem', { lineHeight: '2.6rem' }],
        '4xl': ['3.815rem', { lineHeight: '1' }],
      },
      boxShadow: {
        hoja: '0 1px 0 rgba(15,61,46,0.05), 0 10px 24px -18px rgba(15,61,46,0.45)',
      },
    },
  },
  plugins: [],
};
