import * as React from "react"

type props = {
  text: boolean
  to: string
}


const FormButton: React.FC = (props) => {
  return (
    <input className="inline-block px-5 py-3 rounded-xl elevation-2 bg-primary hover:elevation-8 active:bg-dark focus:outline-none text-button text-white uppercase tracking-wider sm:text-base" type="submit" value={props.children.toString()}/>
    // <a href={props.to} className="inline-block px-5 py-3 rounded-xl elevation-2 bg-primary hover:elevation-8 active:bg-dark focus:outline-none text-button text-white uppercase tracking-wider sm:text-base">
    //   { props.children }
    // </a>
  )
}

export default FormButton
