/** @type {import('tailwindcss').Config} */
const rotateValues = [0, 5, 10, 15, 20, 30, 45, 75];

const transformValue = () => `
  translate3d(var(--tw-translate-x, 0), var(--tw-translate-y, 0), var(--tw-translate-z, 0))
  rotateX(var(--tw-rotate-x, 0))
  rotateY(var(--tw-rotate-y, 0))
  rotateZ(var(--tw-rotate-z, 0))
  skewX(var(--tw-skew-x, 0))
  skewY(var(--tw-skew-y, 0))
  scaleX(var(--tw-scale-x, 1))
  scaleY(var(--tw-scale-y, 1))
`.replace(/\s+/g, ' ').trim();

/** Generates the rotate-x/y/z + perspective utilities previously built by the Tailwind CDN config. */
function threeDPlugin({ addUtilities }) {
  const utilities = {};

  ['x', 'y', 'z'].forEach((axis) => {
    rotateValues.forEach((value) => {
      const variable = `--tw-rotate-${axis}`;
      utilities[`.rotate-${axis}-${value}`] = { [variable]: `${value}deg`, transform: transformValue() };
      if (value !== 0) {
        utilities[`.-rotate-${axis}-${value}`] = { [variable]: `-${value}deg`, transform: transformValue() };
      }
    });
  });

  Object.assign(utilities, {
    '.perspective-none': { perspective: 'none' },
    '.perspective-dramatic': { perspective: '100px' },
    '.perspective-near': { perspective: '300px' },
    '.perspective-normal': { perspective: '500px' },
    '.perspective-midrange': { perspective: '800px' },
    '.perspective-distant': { perspective: '1200px' },
    '.transform-style-preserve-3d': { 'transform-style': 'preserve-3d' },
    '.transform-style-flat': { 'transform-style': 'flat' },
  });

  addUtilities(utilities);
}

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        geist: ['Geist', 'sans-serif'],
      },
      colors: {
        brand: {
          green: '#B9FF66',
        },
      },
    },
  },
  plugins: [threeDPlugin],
};
