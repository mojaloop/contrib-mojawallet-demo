module.exports = {
  theme: {
    extend: {
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem'
      }
    }
  },
  variants: {},
  plugins: [
    require('tailwindcss-elevation')(['responsive', 'hover'])
  ]
}
