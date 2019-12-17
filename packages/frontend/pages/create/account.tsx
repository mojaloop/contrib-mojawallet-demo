import React from 'react'
import Head from 'next/head'
import { NextPage, NextPageContext } from 'next'
import Link from 'next/link'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import { ProfilePageProps } from "../../types"
import { formatCurrency, checkUser } from "../../utils"
import { AccountsService } from '../../services/accounts'
import Input from '../../components/input'
import useForm from "react-hook-form"

const accountsService = AccountsService()

type FormData = {
  firstName: string
  phoneNumber: string
}

const Account: NextPage<ProfilePageProps> = ({ user }) => {
  const { register, setValue, handleSubmit, errors, setError } = useForm<FormData>()
  let phoneError = ''
  const onSubmit = handleSubmit((props) => {
    if (!isValidPhoneNumber(props.phoneNumber)) {
      setError('phoneNumber', 'Invalid phone number.', 'Invalid phone number.')
    }
    console.log(errors)
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
            <img style={{ height: '35px'}} src={'../../icons/close-24px.svg'}/>
          </div>
        </Link>
      </div>
      <form className="w-full max-w-sm" onSubmit={onSubmit}>
        <div className="flex items-center py-2">
          <input type="hidden" name="phoneNumber" ref={register({ required: true })}></input>
            <PhoneInput smartCaret={false} name={'phoneNumber'} placeholder="Enter phone number" error={typeof errors.phoneError !== 'undefined' ? errors.phoneError.type : ''} onChange={value => { setValue('phoneNumber', value, true); console.log(errors) }}/>
            {/* <Input type={'phone'} formRef={register} name={'phoneNumber'} className={'shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline'} placeholder={'TEsting tghe placeholder'}/> */}
            <Input type={'text'} formRef={register} name={'firstName'} className={'shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline'} placeholder={'TEsting tghe placeholder'}/>
            <Input type={'submit'} className={'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'} value={'Login'}/>
          {/* <input autoFocus className="appearance-none bg-transparent border-b border-b-2 border-teal-500 w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none focus:border-teal-900" type="text" placeholder="Account Name" aria-label="Full name"/> */}
          {/* <button className="flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2 rounded" type="button">
            Sign Up
          </button>
          <button className="flex-shrink-0 border-transparent border-4 text-teal-500 hover:text-teal-800 text-sm py-1 px-2 rounded" type="button">
            Cancel
          </button> */}
        </div>
      </form>
      {/* <div className='w-full fixed top-0 shadow-2xl' style={{textDecoration: 'none', color: 'inherit', height: '16rem', background: 'linear-gradient(#225980, #7caab2)', borderRadius: '0 0 20px 20px',zIndex:0 }}>
        <div className='w-full mx-auto max-w-lg'>
          
          <div className="flex">
          
            <div className="text-3xl text-white flex-1 text-base mx-4 px-4 mt-20">
              {account.name}
            </div>
          </div>
          <div className="flex flex-wrap text-2xl text-white mx-10">
            <div className="w-1/2">
              Balance:
            </div>
            <div className="w-1/2 text-right">
              {formatCurrency(account.balance, account.assetScale)}
            </div>
          </div>

        </div>
      </div>
      <div className="w-full flex my-4 flex-wrap" style={{marginTop: '16rem'}}>
        <div className="mt-4 text-xl px-6 py-4 mx-8">
          Transactions
        </div>
        { accountList.length > 0 ? accountList.map(account => <AccountCard key={'account_' + account.id} account={account}/>) : 'No Accounts present.'}
      </div> */}
    </div>
  )
}

export interface AccountDetails {
  id: number
  name: string
  balance: number
  owner: number,
  assetScale: number
}

type AccountCardProps = {
  account: AccountDetails
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  return (
    <Link href="/account/[account.id]"  as={`/account/${account.id}`}>
      <div className="w-auto rounded-lg shadow-md flex flex-col w-full mt-8 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit', background: 'white'}}>
        <div className="flex flex-1">
          <div className="flex-1">
            <div className="text-3xl">
              {formatCurrency(account.balance, 6)}
            </div>
            <div className="text-sm text-grey">
              Balance
            </div>
          </div>
          <div>
            {/* <img src={'../../icons/close-24px-white.svg'}/> */}
          </div>
        </div>
        <div className="text-grey-dark">
          {account.name}
        </div>
      </div>
    </Link>
  )
}

export default Account

Account.getInitialProps = async (ctx) => {
  const user = await checkUser(ctx)
  return { user }
}
