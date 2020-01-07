import React from 'react'
import App from 'next/app'
import '../styles/main.css'
import { AnimatePresence, motion } from 'framer-motion'

class MyApp extends App {
  render() {
    const { Component, pageProps, router } = this.props
    const spring = {
      when: "afterChildren"
    }
    return (
      <AnimatePresence>
        <motion.div
            transition={spring}
            key={router.pathname}
            initial={{ y: 0, opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 0, opacity: 0.5 }}
          >
          <Component {...pageProps} key={router.pathname} />
        </motion.div>
      </AnimatePresence>
    )
  }
}

export default MyApp
