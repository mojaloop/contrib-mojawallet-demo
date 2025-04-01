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

import { NextPage } from "next";
import { useState, useEffect } from "react";
import { AccountsService } from "../services/accounts";
import { checkUser, formatCurrency } from "../utils";
import { AccountDetails, CheckoutProps, UserDetails } from "../types";
import Selector from "../components/selector";
import Button from "../components/button";

const methodName = 'https://mojaloop.app'

interface MobileMoneyPaymentDetails {
  currency: string
  amount: string
  MSISDN: string
}

type SelectorOptions = {
  label: string;
  value: number
}

const accountsService = AccountsService()

const Checkout: NextPage<CheckoutProps> = ({ accounts, user }) => {

  const [client, setClient] = useState<any>()
  const [details, setDetails] = useState<MobileMoneyPaymentDetails>()
  const [selectedAccount, setSelectedAccount] = useState<SelectorOptions>()

  useEffect(() => {
    navigator.serviceWorker.addEventListener('message', e => {
      setClient(e.source)
      console.log('e source ->',client)
      console.log('message', e)

      if (e.data && e.data.currency && e.data.amount && e.data.MSISDN) {
        console.log('RECEIVED PAYMENT REQUEST', e.data)

        setDetails(e.data)
      }
    })
    navigator.serviceWorker.controller.postMessage('payment_app_window_ready')
    // setDetails({
    //   MSISDN: '+829876544',
    //   amount: '100',
    //   currency: '840' 
    // })
  }, [])

  const onCancel = () => {
    console.log('cancelling')
    if (!client) return
    const response = "The payment request is cancelled by user"
    client.postMessage(response)
  }

  const authorize = async () => {
    console.log('selected account', selectedAccount)
    if (!selectedAccount) {
      return
    }
    const authCodeResponse = await accountsService.getAuthorizationCode(selectedAccount.value, details.amount, details.currency, user.token)
    console.log('got auth code:', authCodeResponse.authorisationCode)
    client.postMessage({
      methodName: methodName,
      details: {
        success: true,
        code: authCodeResponse.authorisationCode,
        userMSISDN: user.username
      }
    })
  }

  const formatAccountName = (account: AccountDetails) => {
    return `${account.name} - ${formatCurrency(account.balance, account.assetScale)}`
  }

  if (!details) return null

  return (
    <div>
      <div className='w-full rounded-b-2xl fixed top-0' style={{height: '16rem', background: 'linear-gradient(#023347, #025C5E, #B1CDAC)', zIndex:-3000 }}>
        <div className='' style={{textDecoration: 'none', color: 'inherit', zIndex:0, marginTop: '6rem' }}>
            <div className='w-full mx-auto max-w-lg flex my-4 flex-wrap'>
              
              <div className="bg-white max-w-xl sm:max-w-xs rounded-xl elevation-4 flex flex-col w-full mt-8 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit'}}>
                You are about to pay Moja Coffee XML {details.amount} from account:
                <div>
                  { accounts ? 
                    <Selector onChange={(event) => { setSelectedAccount(event) } } options={accounts.map(account => ({ label: formatAccountName(account), value: account.id }))} />
                    : null }
                </div>
                <div className='flex'>
                  <div className='flex-1'>
                    
                  </div>
                  <div className="inline-block px-5 py-3 rounded-xl focus:outline-none text-button text-primary uppercase tracking-wider sm:text-base mx-1" onClick={onCancel}>
                      Cancel
                    </div>
                  <div>
                    <Button onClick={authorize} text={false} to={''}>
                      Pay
                    </Button>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout

const dummyAccounts: AccountDetails[] = [{
  id: 1,
  name: 'shopping',
  balance: 10000,
  owner: 1,
  assetScale: 2
}]
const dummyUser: UserDetails = {
  defaultAccountId: 1,
  id: 1,
  password: 'aaa',
  token: 'aaa',
  username: '+2788888888'
}

Checkout.getInitialProps = async (ctx) => {
  let response
  const user = await checkUser(ctx)
  try {
    response = await accountsService.getAccounts(user.id, user.token)
  } catch(error) {
    console.log(error)
  }
  return { accounts: response.data, user }
  // return { accounts: dummyAccounts, user: dummyUser }
}
