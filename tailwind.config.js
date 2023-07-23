/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-170': 'linear-gradient(170deg, var(--tw-gradient-stops))'
      },
      colors: {
        'tomato': 'RGB(204, 41, 54, 1)',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}

