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