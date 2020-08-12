import React, { useEffect, useState } from 'react'
import getConfig from 'next/config'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { NextPage } from 'next'
import { TransactionService } from '../../services/transactions'
import { OTPService } from '../../services/otp'
import { TransactionCardProps, AccountPageProps, Totals, OTPCardProps, CreateOTPCardProps, TimerProps, ActiveOTPCardProps, CreateFaucetCardProps } from "../../types"
import { formatCurrency, checkUser } from "../../utils"
import { AccountsService } from '../../services/accounts'
import moment from 'moment'
import { motion } from 'framer-motion'
import Pusher from 'pusher-js'

const { publicRuntimeConfig } = getConfig()

const PUSHER_KEY = publicRuntimeConfig.PUSHER_KEY

const accountsService = AccountsService()
const transactionService = TransactionService()
const otpService = OTPService()

// export type AccountDetails = {
//   id: number
//   name: string
//   balance: number
//   owner: number
//   assetScale: number
// }

const Account: NextPage<AccountPageProps> = ({ account, transactions, otp, user }) => {
  const [otpState, setOTP] = useState({
    otp: otp,
    hasOTP: otp && otp.accountId == account.id,
    disableOTP: otp && otp.accountId != account.id
  })
  const [accountState, setAccount] = useState(account)
  const [transactionsState, setTransactions] = useState(transactions)
  useEffect(() => {
    if (PUSHER_KEY) {
      const pusher = new Pusher(PUSHER_KEY, {
        cluster: 'eu'
      })
      const channel = pusher.subscribe(`account-${accountState.id}`)
      channel.bind('transaction', (balance) => {
        setAccount({ ...accountState, balance: +accountState.balance + +balance.message })
        setTransactions([...transactionsState, {
          id: Math.floor(Math.random() * 10000),
          accountId: accountState.id.toString(),
          amount: +balance.message,
          epoch: Date.now(),
          Description: ''
        }])
        setOTP({
          otp: otp,
          hasOTP: false,
          disableOTP: false
        })
      })
      pusher.connection.bind('connected', () => {
        console.log('Connected to pusher')
      })
      pusher.connection.bind('disconnected', () => {
        console.log('Disconnected from pusher')
      })
      return () => {
        console.log('disconnecting...')
        pusher.disconnect()
      }
    }
  })
  return (
    <div>
      <Head>
        <title>{accountState.name}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <div className='w-full rounded-b-2xl fixed top-0' style={{height: '21rem', background: 'linear-gradient(#023347, #025C5E, #B1CDAC)', zIndex:-3000 }}/>
          <div className='' style={{textDecoration: 'none', color: 'inherit', zIndex:0, marginTop: '6rem' }}>
            <div className='w-full mx-auto max-w-lg'>
              <div className="flex">
                <div className="text-headline text-white flex-1 text-base mx-4 px-4">
                  {accountState.name}
                </div>
              </div>
              <div className="w-full flex my-4 flex-wrap">
                { accountState.balance < 10 ? <CreateFaucet accountId={accountState.id} token={user.token}/> : otpState.hasOTP ? <OTP token={user.token} otp={otpState.otp} setOTP={setOTP}/> : otpState.disableOTP ? <DisabledOTP/> : <CreateOTP accountId={accountState.id} token={user.token} setOTP={setOTP}/> }
                <Balance balance={accountState.balance} assetScale={2}/>
                { transactionsState.length > 0 ? [...transactionsState].reverse().map(transaction => <TransactionCard key={'transaction_' + transaction.id} transaction={transaction}/>) : <Empty/>}
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}


const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const time = new Date(transaction.epoch).toLocaleString()
  const cardColour = transaction.amount >= 0 ? "success" : "error"
  const TimeNoSSR = dynamic(() => Promise.resolve(Time), { ssr: false })
  return (
    <div className="bg-white max-w-xl sm:max-w-xs rounded-xl elevation-4 flex flex-col w-full mt-8 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit'}}>
      <div className="flex flex-1">
        <div className="flex-1">
          <div className={"text-headline text-" + cardColour}>
            {formatCurrency(transaction.amount, 2)}
          </div>
          <div className="text-body py-2">
            {transaction.Description}
          </div>
          <div className="text-caption text-right">
          <TimeNoSSR className="text-right">{time}</TimeNoSSR>
          </div>
        </div>
        <div>
          <img className="h-10" src={'/Mono_logo.svg'}/>
        </div>
      </div>
    </div>
  )
}

const Time = (props) => {
  return (
    <React.Fragment>{props.children}</React.Fragment>
  )
}

const Empty: React.FC = () => {
  return (
    <div className="bg-white  max-w-xl sm:max-w-xs rounded-xl elevation-4 flex flex-col w-full mt-8 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit'}}>
      <div className="flex flex-wrap content-center text-center mx-10">
        <div className="w-full mb-2">
          <img className="h-40" src={'/icons/undraw_empty_xct9.svg'}/>
        </div>
        <div className="w-full text-caption">
          No transactions found! Create a transaction to get started.
        </div>
      </div>
    </div>
  )
}

const CreateOTP: React.FC<CreateOTPCardProps> = ({accountId, token, setOTP}) => {
  return (
    <motion.div
      className="inline-block max-w-xl sm:max-w-xs flex flex-col w-full mt-8 px-6 py-4 mx-8 rounded-xl elevation-4 bg-white hover:elevation-8 active:bg-dark focus:outline-none"
      onTap={async () => {
        let otp = await otpService.createOTP(accountId + '', token)
        setOTP({
          otp: otp,
          hasOTP: true,
          disableOTP: false
        })
      }}
      whileTap={{ boxShadow: "0px 5px 5px -3px rgba(0,0,0,0.20), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)" }}
    >
      <div className="flex flex-wrap">
        <div className="mr-1 ml-auto">
          <img className="" src={'/icons/add-24px.svg'}/>
        </div>
        <div className="ml-1 mr-auto text-button uppercase" style={{ paddingTop: '1px' }}>
          create otp
        </div>
      </div>
    </motion.div>
  )
}
  
const OTP: React.FC<ActiveOTPCardProps> = ({ otp, setOTP, token }) => {
  return (
    <div className="inline-block max-w-xl sm:max-w-xs flex flex-col w-full mt-8 px-6 py-4 mx-8 rounded-xl elevation-4 bg-white hover:elevation-8 active:bg-dark focus:outline-none">
      <div className="flex flex-1">
        <div className="flex-1">
        <div className="flex-1 text-center text-headline tracking-otp text-primary uppercase my-3 ">
          { otp.otp }
        </div>
        <div className="w-full">
          <Timer otp={otp} setOTP={setOTP}/>
        </div>
        </div>
        <motion.div
          className="h-10"
          onTap={async () => {
            let otp = await otpService.cancelOTP(token)
            console.log(otp)
            setOTP({
              otp: otp,
              hasOTP: false,
              disableOTP: false
            })
          }}
          >
          <img className="" src={'/icons/delete-24px.svg'}/>
        </motion.div>
      </div>
    </div>
  )
}

const DisabledOTP: React.FC = () => {
  return (
    <div className="inline-block max-w-xl sm:max-w-xs flex flex-col w-full mt-8 px-6 py-4 mx-8 rounded-xl elevation-4 bg-white hover:elevation-8 active:bg-dark focus:outline-none">
      <div className="flex flex-wrap">
        <div className="mx-auto ">
          You already have an active OTP on another account.
        </div>
      </div>
    </div>
  )
}

const CreateFaucet: React.FC<CreateFaucetCardProps> = ({accountId, token}) => {
  return (
    <motion.div
      className="inline-block max-w-xl sm:max-w-xs flex flex-col w-full mt-8 px-6 py-4 mx-8 rounded-xl elevation-4 bg-white hover:elevation-8 active:bg-dark focus:outline-none"
      onTap={async () => {
        await accountsService.addFunds(accountId + '', token)
      }}
      whileTap={{ boxShadow: "0px 5px 5px -3px rgba(0,0,0,0.20), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)" }}
    >
      <div className="flex flex-wrap">
        <div className="mr-1 ml-auto">
          <img className="" src={'/icons/add-24px.svg'}/>
        </div>
        <div className="ml-1 mr-auto text-button uppercase" style={{ paddingTop: '1px' }}>
          add funds
        </div>
      </div>
    </motion.div>
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

const Timer: React.FC<TimerProps> = ({otp, setOTP}) => {
  const expireAt = moment(1000 * (otp.expiresAt) || '')
  const calculateTimeLeft = () => {
    if (moment().isSameOrBefore(expireAt)) {
      return 'Expires ' + moment().to(expireAt)
    }
    return false
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())
  
  useEffect(() => {
    let interval = setInterval(async () => {
      let time = calculateTimeLeft()
      if (time) {
        setTimeLeft(time)
      } else {
        setOTP({
          otp: null,
          hasOTP: false,
          disableOTP: false
        })
      }
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  })
  return (
    <div className="text-caption">
      <span>{timeLeft}</span>
    </div>
  )
}

export default Account

Account.getInitialProps = async (ctx) => {
  let id = ctx.query.id
  let account, transactions, otp
  const user = await checkUser(ctx)
  try {
    account = await accountsService.getAccount(id.toString(), user.token)
    transactions = await transactionService.getTransactions(account.id.toString(), user.token)
  } catch(error) {
    console.log(error)
  }
  try {
    otp = await otpService.getOTP(user.token)
  } catch (error) {
    otp = null
    console.error('Error in getting otp', error)
  }
  return { account: account, transactions: transactions, otp: otp, user: user }
}
