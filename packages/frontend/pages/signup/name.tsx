import React from 'react'
import { NextPage } from "next"
import useForm from 'react-hook-form'
import Link from 'next/link'
import { UsersService } from '../../services/users'
import { checkUser } from '../../utils'
import PhoneInput, { isValidPhoneNumber, isPossiblePhoneNumber } from 'react-phone-number-input'
import './phone-input.css'
import Input from '../../components/input'
import FormButton from '../../components/form-button'


type FormData = {
  name: string
  phoneNumber: string
  password: string
}

const Signup: NextPage = () => {
  const usersService = UsersService()
  const { register, setValue, handleSubmit, errors, setError } = useForm<FormData>()
  const onSubmit = handleSubmit(async (props) => {
    if (!isValidPhoneNumber(props.phoneNumber)) {
      setError('phoneNumber', 'Invalid phone number.', '')
    } else {
      await usersService.signup(props.phoneNumber, props.password).then((user) => {
        console.log(user)
        window.location.href = `/login?signupSessionId=${user.signupSessionId}`
      })
    }
  })
  const onValueChange = (phoneNumber) => {
    if (!phoneNumber) {
      setError('phoneNumber', 'Phone number required.', '')
    } else if (!isValidPhoneNumber(phoneNumber)) {
      setError('phoneNumber', 'Invalid phone number.', '')
    } else {
      setValue('phoneNumber', phoneNumber, true)
    }
  }

  return (
    <div className="flex flex-wrap content-center items-center justify-center text-center w-full h-screen">
      <div className="w-full text-gray-800 mb-10 text-headline">Sign up</div>
      <form className="w-3/4 max-w-sm" onSubmit={onSubmit}>
        <div className="w-full">
          <input type="hidden" name="phoneNumber" ref={register({ required: true })}/>
          <PhoneInput
            smartCaret={false}
            placeholder="Phone number"
            name={'phoneNumber'}
            inputClassName={'appearance-none bg-gray-100 border-b border-light focus:border-primary py-2 px-3 mb-3 w-full leading-tight focus:outline-none'}
            onChange={onValueChange}
            error={errors.phoneNumber ? errors.phoneNumber.type : ''}
          />
        </div>
        <div className="w-full">
          <Input
            type={'password'}
            formRef={register({ required: true })}
            name={'password'}
            className={'appearance-none bg-gray-100 border-b border-light focus:border-primary w-full py-2 px-3 mb-3 leading-tight focus:outline-none'}
            placeholder={'***********'}
          />
        </div>
        <div className="w-full">
          <FormButton>Sign up</FormButton>
        </div>
      </form>
    </div>
  )
}

Signup.getInitialProps = async ({}) => {
  return {}
}

export default Signup
