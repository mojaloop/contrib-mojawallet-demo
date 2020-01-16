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
  username: string
  password: string
}

const Signup: NextPage = () => {
  const usersService = UsersService()
  const { register, setValue, handleSubmit, errors, setError } = useForm<FormData>()
  const onSubmit = handleSubmit(async (props) => {
    console.log('submitted')
    if (!isValidPhoneNumber(props.username)) {
      setError('username', 'Invalid phone number.', '')
    } else {
      let user = await usersService.signup(props.username, props.password).then(async (user) => {
        const response = await user.json()
        console.log('USER', response)
        window.location.href = `/login?signupSessionId=${response.signupSessionId}`
      }).catch(async (error) => {
        let response = await error.response.json()
        setError(response.errors[0].field, response.errors[0].message, '')
      })
    }
  })
  const onValueChange = (username) => {
    if (!username) {
      setError('username', 'Phone number required.', '')
    } else if (!isValidPhoneNumber(username)) {
      setError('username', 'Invalid phone number.', '')
    } else {
      setValue('username', username, true)
    }
  }

  return (
    <div className="flex flex-wrap content-center items-center justify-center text-center w-full h-screen">
      <div className="w-full text-gray-800 mb-10 text-headline">Sign up</div>
      <form className="w-3/4 max-w-sm" onSubmit={onSubmit}>
        <div className="w-full">
          <input type="hidden" name="username" ref={register({ required: true })}/>
          <PhoneInput
            smartCaret={false}
            placeholder="Phone number"
            name={'username'}
            inputClassName={'appearance-none bg-gray-100 border-b border-light focus:border-primary py-2 px-3 mb-3 w-full leading-tight focus:outline-none'}
            onChange={onValueChange}
            error={errors.username ? errors.username.type : ''}
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
