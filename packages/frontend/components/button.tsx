import * as React from "react"

type props = {
  text: boolean
  to: string
}


const Button: React.FC<props> = (props) => {
  if (props.text) {
    return (
      <a href={props.to} className="inline-block px-5 py-3 rounded-xl focus:outline-none text-button text-primary uppercase tracking-wider sm:text-base">
        { props.children }
      </a>
    )
  } else {
    return (
      <a href={props.to} className="inline-block px-5 py-3 rounded-xl elevation-2 bg-primary hover:elevation-8 active:bg-dark focus:outline-none text-button text-white uppercase tracking-wider sm:text-base">
        { props.children }
      </a>
    )
  }
}

export default Button
