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
import { formatCurrency, checkUser } from "../utils"
import { AccountsPageProps, AccountCardProps, Totals } from "../types"
import { motion } from 'framer-motion'
import { AccountsService } from '../services/accounts'
import { useEffect, useState } from 'react'
import ReactDOM from "react-dom";

const QRCode = ({ text }) => {
  const[src, setSrc] = useState('');

  useEffect(() => {
    QRCode.toDataURL(text).then((data) => {
      setSrc(data);
    });
  }, []);

  return (<div>  
    <img src={src} />
  </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <QRCode text="Merchant QRCode" />
  </React.StrictMode>,
  document.getElementById('root')
);



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
              <div className="text-headline text-white flex-1 text-base mx-4 px-4">
                Accounts
              </div>
              <div className="mr-8" style={{ zIndex:1 }}>
                <Link href={{ pathname: '/profile' }}>
                  <img className="h-10" src={'/icons/person-24px-white.svg'}/>
                </Link>
              </div>
            </div>

            <div className="w-full flex my-4 flex-wrap">
              <Balance balance={accounts.reduce((sum, current) => sum + +current.balance, 0)} assetScale={2}/>
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
      <div className="flex flex-wrap text-subheader">
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
          <img className="h-40" src={'/icons/undraw_empty_xct9.svg'}/>
        </div>
        <div className="w-full text-caption">
          No accounts found! Create an account to get started.
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
            <img className="" src={'/icons/add-24px.svg'}/>
          </div>
          <div className="ml-1 mr-auto text-button uppercase">
            Create Account
          </div>
        </div>
      </div>
    </Link>
  )
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  return (
    <Link href="/account/[account.id]"  as={`/account/${account.id}`}>
      <motion.div
        className="bg-white max-w-xl sm:max-w-xs rounded-xl elevation-4 flex flex-col w-full mt-8 px-6 py-4 mx-8"
        style={{textDecoration: 'none', color: 'inherit'}}
        whileTap={{ boxShadow: "0px 5px 5px -3px rgba(0,0,0,0.20), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)" }}
      >
        <div className="flex flex-1">
          <div className="flex-1">
            <div className="text-headline">
              {formatCurrency(account.balance, account.assetScale)}
            </div>
            <div className="text-caption text-grey">
              Balance
            </div>
          </div>
          <div>
            <img className="h-10" src={'/Mono_logo.svg'}/>
          </div>
        </div>
        <div style={{height: '3rem'}}></div>
        <div className="text-title font-medium text-primary">
          {account.name}
        </div>
      </motion.div>
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
