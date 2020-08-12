import * as React from "react"
import { motion } from "framer-motion"

type props = {
  text: boolean
  to: string
  onClick?: () => void
}


const Button: React.FC<props> = (props) => {

  const onTap = () => {
    if (props.onClick) {
      props.onClick()
      return
    }

    window.location.href = props.to
    console.log('tapped', props.to)
  }

  if (props.text) {
    return (
      <a href={props.to} className="inline-block px-5 py-3 rounded-xl focus:outline-none text-button text-primary uppercase tracking-wider sm:text-base">
        { props.children }
      </a>
    )
  } else {
    return (
      <motion.div
        className="inline-block min-w-button px-5 py-3 rounded-xl elevation-2 bg-primary hover:elevation-8 active:bg-dark focus:outline-none text-button text-white uppercase tracking-wider sm:text-base"
        onTap={onTap}
        whileTap={{ boxShadow: "0px 5px 5px -3px rgba(0,0,0,0.20), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)" }}
      >
        { props.children }
      </motion.div>
    )
  }
}

const buttonTap = (to: string) => {
  console.log('tapped')
}

export default Button
