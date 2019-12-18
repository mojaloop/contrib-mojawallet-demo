module.exports = {
  theme: {
    fontFamily: {
      display: 'Rubik, sans-serif',
      body: 'Rubik, sans-serif'
    },
    extend: {
      colors: {
        primary: '#025C5E',
        dark: '#023347',
        light: '#B1CDAC',
        error: '#B00020'
      },
      fontSize: {
        headline: '24pt',
        title: '20pt',
        subheader: '16pt',
        body: '14pt',
        caption: '12pt',
        button: '12pt',
      },
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
