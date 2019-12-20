module.exports = {
  theme: {
    fontFamily: {
      display: 'Rubik, sans-serif',
      body: 'Rubik, sans-serif'
    },
    extend: {
      minWidth: {
        button: '64px'
      },
      colors: {
        card: '#fafafa',
        primary: '#025C5E',
        dark: '#023347',
        light: '#B1CDAC',
        success: '#4caf50',
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
      },
      borderColor: {
        material: '#0000001e'
      }
    }
  },
  variants: {},
  plugins: [
    require('tailwindcss-elevation')(['responsive', 'hover'])
  ]
}
