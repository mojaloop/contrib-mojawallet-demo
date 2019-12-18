import React from 'react'
import { NextPage } from "next"
import useForm from 'react-hook-form'
import { UsersService } from '../services/users'
import PhoneInput, { isValidPhoneNumber, isPossiblePhoneNumber } from 'react-phone-number-input'
import './signup/phone-input.css'
import Input from '../components/input'
import FormButton from '../components/form-button'

const usersService = UsersService()

const HYDRA_LOGIN_GRANT_URL = process.env.REACT_APP_LOGIN_GRANT_URL || 'http://localhost:9000/oauth2/auth?client_id=frontend-client&state=loginflow&response_type=code&redirect_uri=http://localhost:3000/callback'

type Props = {
  login_challenge: string
}

type FormData = {
  phoneNumber: string
  password: string
}

const Login: NextPage<Props> = ({login_challenge}) => {
  const { register, setValue, handleSubmit, errors, setError } = useForm<FormData>()

  const onSubmit = handleSubmit(async (props) => {
    if (!isValidPhoneNumber(props.phoneNumber)) {
      setError('phoneNumber', 'Invalid phone number.', '')
    } else {
      let resp = await usersService.login(props.phoneNumber, props.password, login_challenge).then(resp => {
        if(resp.redirectTo) {
          window.location.href = resp.redirectTo
        }
      }).catch(async error => {
        let message = await error.response.json()
        console.log(message.errors[0].field)
        if (message.errors[0].field === 'password') {
          setError('password', message.errors[0].message, '')
        } else {
          setError('phoneNumber', message.errors[0].message, '')
        }
      })
      console.log('error.response.body', resp)
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
      <div className="w-full text-gray-800 mb-10 text-headline">Welcome back!</div>
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
            hint={errors.password ? errors.password.type : ''}
          />
        </div>
        <div className="w-full">
          <FormButton>Login</FormButton>
        </div>
      </form>
    </div>
  )
}

Login.getInitialProps = async ({query, res}) => {
  const { login_challenge, signupSessionId } = query

  if(!login_challenge) {
    res.writeHead(302, {
      Location: signupSessionId ? HYDRA_LOGIN_GRANT_URL + `&signupSessionId=${signupSessionId}` : HYDRA_LOGIN_GRANT_URL
    })
    res.end()
    return
  }

  // Check loginChallenge to see if it can be skipped.
  const login = await usersService.getLogin(login_challenge.toString()).then(resp => {
    if(resp.redirectTo) {
      res.writeHead(302, {
        Location: resp.redirectTo
      })
      res.end()
    }
    return resp
  }).catch(error => {
    console.log(error)
  })

  return {
    login_challenge: query.login_challenge ? query.login_challenge.toString() : ''
  }
}

export default Login
