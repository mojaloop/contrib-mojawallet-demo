/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the License) and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Coil
 - Cairin Michie <cairin@coil.com>
 - Donovan Changfoot <don@coil.com>
 - Matthew de Haast <matt@coil.com>
 - Talon Patterson <talon.patterson@coil.com>
 --------------
 ******/

import React from 'react'
import Head from 'next/head'
import { NextPage } from 'next'
import Link from 'next/link'
import useForm from 'react-hook-form'
import { ProfilePageProps } from "../../types"
import { checkUser } from "../../utils"
import { AccountsService } from '../../services/accounts'
import Input from '../../components/input'
import FormButton from '../../components/form-button'

const accountsService = AccountsService()

type FormData = {
  name: string
}

const Account: NextPage<ProfilePageProps> = ({ user }) => {
  const { register, setValue, handleSubmit, errors, setError } = useForm<FormData>()

  const onSubmit = handleSubmit(async (props) => {
    let resp = await accountsService.createAccount(props.name, user.token).then(resp => {
      window.location.href = '/'
    }).catch(async error => {
      let message = await error.response.json()
      if (message.errors[0].field === 'name') {
        setError('name', message.errors[0].message, '')
      }
    })
  })

  return (
    <div>
      <Head>
        <title>Create account</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="fixed top-0 right-0" style={{ zIndex:1 }}>
        <Link href={{ pathname: '/' }}>
          <div className="mr-5 mt-5">
            <img className="h-10" src={'/icons/close-24px.svg'}/>
          </div>
        </Link>
      </div>
      <div className="flex flex-wrap content-center items-center justify-center text-center w-full h-screen">
        <img className="h-40" src={'/icons/undraw_things_to_say_ewwb.svg'}/>
        <div className="w-full text-gray-800 text-headline my-5">Give your new<br/>account a name</div>
        <form className="w-3/4 max-w-sm" onSubmit={onSubmit}>
          <div className="w-full">
            <Input
              type={'name'}
              formRef={register({ required: true })}
              name={'name'}
              className={'appearance-none bg-gray-100 border-b border-light focus:border-primary w-full py-2 px-3 mb-3 leading-tight focus:outline-none'}
              placeholder={'New account'}
              hint={errors.name ? errors.name.type : ''}
            />
          </div>
          <div className="w-full">
            <FormButton>Save</FormButton>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Account

Account.getInitialProps = async (ctx) => {
  const user = await checkUser(ctx)
  return { user }
}
