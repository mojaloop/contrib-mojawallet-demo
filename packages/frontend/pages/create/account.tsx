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
