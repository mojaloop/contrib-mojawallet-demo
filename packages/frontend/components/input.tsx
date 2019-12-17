import * as React from "react"
import PhoneInput from 'react-phone-number-input'

type props = {
  hint?: string
  disabled?: boolean
  error?: boolean
  id?: string
  label?: string
  type: string
  value?: any
  placeholder?: string
  className: string
  name?: string
  formRef?: any
}


const Input: React.FC<props> = (props) => {
  return (
    <div className="mb-6">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={props.id}>
        {props.label}
      </label>
      <input name={props.name} ref={props.formRef} className={props.className} value={props.value} id={props.id} type={props.type} placeholder={props.placeholder}/>
      <p className="text-red-500 text-xs italic">{props.hint}</p>
    </div>
  )
}

{/* <input type="submit" value="Send Request"/> */}

export default Input