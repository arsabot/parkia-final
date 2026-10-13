/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6fa',
          100: '#e1eef4',
          200: '#c5ddea',
          300: '#98c2d9',
          400: '#5c9ec0',
          500: '#2D7A9E', // Teal / Azul Cerceta
          600: '#236585',
          700: '#1e526d',
          800: '#1d455b',
          900: '#1c3b4d',
          950: '#1A2B42', // Azul Marino Oscuro
        },
        navy: {
          50: '#f4f6f9',
          100: '#e8edf3',
          200: '#cad5e3',
          300: '#9cb3cc',
          400: '#678cb1',
          500: '#436d97',
          600: '#32557b',
          700: '#284464',
          800: '#233b54',
          900: '#1A2B42', // Color principal Azul Marino Oscuro
          950: '#101c2b',
        },
        emerald: {
          50: '#eefcf5',
          100: '#d7f7e7',
          200: '#b2edd2',
          300: '#7ddfb6',
          400: '#43ca93',
          500: '#28C175', // Color Verde Esmeralda del logo
          600: '#1ca05e',
          700: '#177e4c',
          800: '#17643e',
          900: '#155235',
          950: '#062d1c',
        },
        teal: {
          50: '#f0f9fa',
          100: '#d9f0f3',
          200: '#b6e2e9',
          300: '#84ccd8',
          400: '#4dafc1',
          500: '#2D7A9E', // Azul Cerceta del logo
          600: '#246382',
          700: '#20516b',
          800: '#1e4459',
          900: '#1d3a4c',
          950: '#0f2532',
        },
        slate: {
          50: '#F9FAFA',  // Blanco Roto de fondo
          100: '#f1f4f5',
          200: '#e2e7e8',
          300: '#ccd4d6',
          400: '#a3b1b5',
          500: '#7A8B8F', // Gris Pizarra secundario
          600: '#5e6f73',
          700: '#4c5a5d',
          800: '#3f4a4d',
          900: '#242e31',
          950: '#141b1c',
        },
        offwhite: '#F9FAFA',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'elevated': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.25s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
