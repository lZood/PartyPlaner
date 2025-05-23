/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Montserrat', 'sans-serif'],
      },
      colors: {
        primary: {
          50: 'rgb(var(--color-primary), 0.05)',
          100: 'rgb(var(--color-primary), 0.1)',
          200: 'rgb(var(--color-primary), 0.2)',
          300: 'rgb(var(--color-primary), 0.3)',
          400: 'rgb(var(--color-primary), 0.6)',
          500: 'rgb(var(--color-primary), 1)',
          600: 'rgb(var(--color-primary), 0.9)',
          700: 'rgb(var(--color-primary), 0.8)',
          800: 'rgb(var(--color-primary), 0.7)',
          900: 'rgb(var(--color-primary), 0.6)',
        },
        secondary: {
          50: 'rgb(var(--color-secondary), 0.05)',
          100: 'rgb(var(--color-secondary), 0.1)',
          200: 'rgb(var(--color-secondary), 0.2)',
          300: 'rgb(var(--color-secondary), 0.3)',
          400: 'rgb(var(--color-secondary), 0.6)',
          500: 'rgb(var(--color-secondary), 1)',
          600: 'rgb(var(--color-secondary), 0.9)',
          700: 'rgb(var(--color-secondary), 0.8)',
          800: 'rgb(var(--color-secondary), 0.7)',
          900: 'rgb(var(--color-secondary), 0.6)',
        },
        accent: {
          50: 'rgb(var(--color-accent), 0.05)',
          100: 'rgb(var(--color-accent), 0.1)',
          200: 'rgb(var(--color-accent), 0.2)',
          300: 'rgb(var(--color-accent), 0.3)',
          400: 'rgb(var(--color-accent), 0.6)',
          500: 'rgb(var(--color-accent), 1)',
          600: 'rgb(var(--color-accent), 0.9)',
          700: 'rgb(var(--color-accent), 0.8)',
          800: 'rgb(var(--color-accent), 0.7)',
          900: 'rgb(var(--color-accent), 0.6)',
        },
        success: {
          50: 'rgb(var(--color-success), 0.05)',
          100: 'rgb(var(--color-success), 0.1)',
          500: 'rgb(var(--color-success), 1)',
          600: 'rgb(var(--color-success), 0.9)',
        },
        warning: {
          50: 'rgb(var(--color-warning), 0.05)',
          100: 'rgb(var(--color-warning), 0.1)',
          500: 'rgb(var(--color-warning), 1)',
          600: 'rgb(var(--color-warning), 0.9)',
        },
        error: {
          50: 'rgb(var(--color-error), 0.05)',
          100: 'rgb(var(--color-error), 0.1)',
          500: 'rgb(var(--color-error), 1)',
          600: 'rgb(var(--color-error), 0.9)',
        },
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};