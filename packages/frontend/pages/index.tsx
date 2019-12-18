import React from 'react'
import Head from 'next/head'
import { NextPage } from 'next'
import Link from 'next/link'
import { formatCurrency, checkUser } from "../utils"
import { AccountsPageProps, AccountCardProps, Totals } from "../types"
import { motion } from 'framer-motion'
import { AccountsService } from '../services/accounts'

const accountsService = AccountsService()

const Home: NextPage<AccountsPageProps> = ({accounts, user}) => {
  return (
    <div>
      <Head>
        <title>Accounts</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <div className='w-full rounded-b-2xl fixed top-0' style={{height: '21rem', background: 'linear-gradient(#023347, #025C5E, #B1CDAC)', zIndex:-3000 }}/>
        <div className='' style={{textDecoration: 'none', color: 'inherit', zIndex:0, marginTop: '6rem' }}>
          <div className='w-full mx-auto max-w-lg'>
            <div className="flex">
              <div className="text-3xl text-white flex-1 text-base mx-4 px-4">
                Accounts
              </div>
              <div className="mr-8" style={{ zIndex:1 }}>
                <Link href={{ pathname: '/profile' }}>
                  <img style={{ height: '32px'}} src={'../icons/person-24px-white.svg'}/>
                </Link>
              </div>
            </div>

            <div className="w-full flex my-4 flex-wrap">
              <Balance balance={accounts.reduce((sum, current) => sum + current.balance, 0)} assetScale={2}/>
                { accounts.length > 0 ? accounts.map(account => <AccountCard key={'account_' + account.id} account={account}/>) : <Empty/> }
              <AddAccount/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Balance: React.FC<Totals> = ({ balance, assetScale }) => {
  return (
    <div className="bg-white max-w-xl sm:max-w-xs rounded-xl elevation-4 flex flex-col w-full mt-8 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit'}}>
      <div className="flex flex-wrap text-2xl">
        <div className="w-1/2">
          Balance
        </div>
        <div className="w-1/2 text-right">
          {formatCurrency(balance, assetScale)}
        </div>
      </div>
    </div>
  )
}

const Empty: React.FC = () => {
  return (
    <div className="bg-white max-w-xl sm:max-w-xs rounded-xl elevation-4 flex flex-col w-full mt-8 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit'}}>
      <div className="flex flex-wrap content-center text-center mx-10">
        <div className="w-full mb-2">
          <img src={'../../icons/undraw_empty_xct9.svg'}/>
        </div>
        <div className="w-full text-lg">
          No accounts found! Add an account to get started.
        </div>
      </div>
    </div>
  )
}

const AddAccount: React.FC = () => {
  return (
    <Link href={{ pathname: '/create/account' }}>
      <div className="bg-white max-w-xl hover:bg-grey-lightest text-grey-darkest sm:max-w-xs font-semibold rounded-xl elevation-4 flex flex-col w-full my-8 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit'}}>
        <div className="flex flex-wrap">
          <div className="mr-1 ml-auto">
            <img className="" src={'../../icons/add-24px.svg'}/>
          </div>
          <div className="ml-1 mr-auto">
            Add Account
          </div>
        </div>
      </div>
    </Link>
  )
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  return (
    <Link href="/account/[account.id]"  as={`/account/${account.id}`}>
      <div className="bg-white max-w-xl sm:max-w-xs rounded-xl elevation-4 flex flex-col w-full mt-8 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit'}}>
        <div className="flex flex-1">
          <div className="flex-1">
            <div className="text-3xl">
              {formatCurrency(account.balance, account.assetScale)}
            </div>
            <div className="text-sm text-grey">
              Balance
            </div>
          </div>
          {/* <div>
            <img src={process.env.PUBLIC_URL + '/icons/xrp.svg'}/>
          </div> */}
        </div>
        <div style={{height: '3rem'}}></div>
        <div className="text-grey-dark">
          {account.name}
        </div>
      </div>
    </Link>
  )
}

export default Home

Home.getInitialProps = async (ctx) => {
  let accounts
  const user = await checkUser(ctx)
  try {
    accounts = await accountsService.getAccounts(user.id, user.token)
  } catch(error) {
    console.log(error)
  }
  return { user, accounts: accounts.data }
}
