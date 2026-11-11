/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Modo oscuro manual: se activa agregando la clase "dark" al <html>
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta oficial (Drive: "Parkia - Diseño (colores y pantallas)")
        parkia: {
          navy: '#0F172A',        // Azul marino
          blue: '#1E5AA8',        // Azul
          lime: '#A3E635',        // Verde lima
          black: '#0B0B0B',       // Negro
          page: '#F5F7FA',        // Fondo (modo claro)
          line: '#D1D5DB',        // Bordes (modo claro)
          muted: '#F1F5F9',       // Chips / ocupado (modo claro)
          'page-dark': '#0B1120', // Fondo (modo oscuro)
          'card-dark': '#111A2E', // Tarjetas (modo oscuro)
          'line-dark': '#26324A', // Bordes (modo oscuro)
          'muted-dark': '#1E293B',// Chips / ocupado (modo oscuro)
        },
        // Colores del selector de plazas: salen de src/styles/parkia-colores.css
        // (cambian solos entre modo claro y oscuro)
        plaza: {
          fondo: 'rgb(var(--parkia-fondo) / <alpha-value>)',
          DEFAULT: 'rgb(var(--parkia-plaza) / <alpha-value>)',
          borde: 'rgb(var(--parkia-borde) / <alpha-value>)',
          'libre-borde': 'rgb(var(--parkia-libre-borde) / <alpha-value>)',
          'libre-texto': 'rgb(var(--parkia-libre-texto) / <alpha-value>)',
          texto: 'rgb(var(--parkia-texto) / <alpha-value>)',
          ocupada: 'rgb(var(--parkia-ocupada) / <alpha-value>)',
          'ocupada-texto': 'rgb(var(--parkia-ocupada-texto) / <alpha-value>)',
          elegida: 'rgb(var(--parkia-elegida) / <alpha-value>)',
          'elegida-texto': 'rgb(var(--parkia-elegida-texto) / <alpha-value>)',
          franja: 'rgb(var(--parkia-franja) / <alpha-value>)',
          accesible: 'rgb(var(--parkia-accesible) / <alpha-value>)',
          'accesible-borde': 'rgb(var(--parkia-accesible-borde) / <alpha-value>)',
          'accesible-texto': 'rgb(var(--parkia-accesible-texto) / <alpha-value>)',
          'accesible-elegida': 'rgb(var(--parkia-accesible-elegida) / <alpha-value>)',
          'accesible-elegida-texto': 'rgb(var(--parkia-accesible-elegida-texto) / <alpha-value>)',
          simbolo: 'rgb(var(--parkia-simbolo) / <alpha-value>)',
          'simbolo-figura': 'rgb(var(--parkia-simbolo-figura) / <alpha-value>)',
          leyenda: 'rgb(var(--parkia-leyenda) / <alpha-value>)',
        },
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
        sans: ['Albert Sans', 'system-ui', 'sans-serif'],
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
