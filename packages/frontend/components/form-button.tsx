import * as React from "react"
import { motion } from "framer-motion"

type props = {
  text: boolean
  to: string
}


const FormButton: React.FC = (props) => {
  return (
    <motion.button
    type="submit"
    className="inline-block min-w-button cursor-pointer px-5 py-3 rounded-xl elevation-2 bg-primary focus:outline-none text-button text-white uppercase tracking-wider"
    whileTap={{ boxShadow: "0px 5px 5px -3px rgba(0,0,0,0.20), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)" }}
  >
    { props.children }
  </motion.button>
  )
}

export default FormButton
