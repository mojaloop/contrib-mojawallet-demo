/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * Coil
 - Cairin Michie <cairin@coil.com>
 - Donovan Changfoot <don@coil.com>
 - Matthew de Haast <matt@coil.com>
 - Talon Patterson <talon.patterson@coil.com>
 --------------
 ******/

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
          />
          <p className="h-6 text-error text-xs italic">{errors.phoneNumber ? errors.phoneNumber.type : ''}</p>
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
