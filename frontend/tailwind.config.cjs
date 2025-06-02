/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1A2A40',
          light: '#2C3E56',
          dark: '#0F1A2A'
        },
        burgundy: {
          DEFAULT: '#6D071A',
          light: '#8A0D25',
          dark: '#560513'
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E5C158',
          dark: '#B39429'
        },
        cream: {
          DEFAULT: '#F5F1E3',
          light: '#FFFDF5',
          dark: '#EAE4D0'
        },
        brown: {
          DEFAULT: '#2C1A1D',
          light: '#3E2529',
          dark: '#1A0F11'
        },
        sage: {
          DEFAULT: '#8A9A5B',
          light: '#A0AF77',
          dark: '#6F7D47'
        },
        parchment: {
          DEFAULT: '#EFE8D8',
          light: '#F8F4EB',
          dark: '#DFD6BD'
        }
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'cormorant': ['Cormorant Garamond', 'serif'],
        'source-serif': ['Source Serif Pro', 'serif'],
        'libre': ['Libre Baskerville', 'serif']
      },
      backgroundImage: {
        'parchment-texture': "url('/src/assets/textures/parchment.jpg')",
        'leather-texture': "url('/src/assets/textures/leather.jpg')",
        'linen-texture': "url('/src/assets/textures/linen.jpg')"
      },
      boxShadow: {
        'elegant': '0 4px 6px -1px rgba(44, 26, 29, 0.1), 0 2px 4px -1px rgba(44, 26, 29, 0.06)',
        'ornate': '0 10px 15px -3px rgba(44, 26, 29, 0.1), 0 4px 6px -2px rgba(44, 26, 29, 0.05)'
      }
    },
  },
  plugins: [],
};