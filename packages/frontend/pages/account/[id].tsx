import React, { ReactNode } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { NextPage } from 'next'
import { TransactionService } from '../../services/transactions'
import { TransactionCardProps, AccountPageProps, Totals } from "../../types"
import Link from 'next/link'
import { formatCurrency, checkUser } from "../../utils"
import { AccountsService } from '../../services/accounts'

const accountsService = AccountsService()
const transactionService = TransactionService()

const Account: NextPage<AccountPageProps> = ({ account, transactions }) => {
  return (
    <div>
      <Head>
        <title>{account.name}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <div className="fixed top-0 right-0" style={{ zIndex:1 }}>
          <Link href={{ pathname: '/' }}>
            <div className="mr-8 mt-8">
              <img className="h-10" src={'/icons/close-24px-white.svg'}/>
            </div>
          </Link>
        </div>
        <div className='flex flex-wrap content-center items-center justify-center  top-0 w-full'>
        <div className='w-11/12 rounded-2xl fixed top-0 mt-4 mx-auto elevation-8' style={{ height: '16rem', background: 'linear-gradient(#023347, #025C5E, #B1CDAC)', zIndex:0 }}>
          <div className='' style={{textDecoration: 'none', color: 'inherit', zIndex:0, marginTop: '6rem' }}>
            <div className='w-full mx-auto max-w-lg'>
              <div className="flex">
                <div className="text-headline text-white flex-1 text-base mx-4 px-4">
                  {account.name}
                </div>
              </div>
              
              <div className="w-full flex  flex-wrap">
                <AddTransaction/>
              </div>
            </div>
          </div>
        </div>
        </div>
        <div className="w-full flex mt-4 mb-12 flex-wrap" style={{marginTop: '16rem'}}>
          <Balance balance={account.balance} assetScale={2}/>
          <div className="mt-4 text-subheader px-6 py-4 mx-8">
            Transactions
          </div>
          { transactions.length > 0 ? transactions.map(transaction => <TransactionCard key={'transaction_' + transaction.id} transaction={transaction}/>) : <Empty/>}
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
    // <Link href="/account/[account.id]"  as={`/account/${transaction.id}`}>
      <div className="border border-solid border-material bg-white max-w-xl sm:max-w-xs rounded-xl flex flex-col w-full mt-4 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit'}}>
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
    // </Link>
  )
}

const Time = (props) => {
  return (
    <React.Fragment>{props.children}</React.Fragment>
  )
}

const Empty: React.FC = () => {
  return (
    <div className="border border-solid border-material bg-white  max-w-xl sm:max-w-xs rounded-xl flex flex-col w-full mt-4 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit'}}>
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

const AddTransaction: React.FC = () => {
  return (
    <Link href={{ pathname: '/create/transaction' }}>
      <div className="bg-white max-w-xl hover:bg-grey-lightest text-grey-darkest sm:max-w-xs font-semibold rounded-xl elevation-4 flex flex-col w-full my-5 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit'}}>
        <div className="flex flex-wrap">
          <div className="mr-1 ml-auto">
            <img className="" src={'/icons/add-24px.svg'}/>
          </div>
          <div className="ml-1 mr-auto text-button uppercase">
            create transaction
          </div>
        </div>
      </div>
    </Link>
  )
}

const Balance: React.FC<Totals> = ({ balance, assetScale }) => {
  return (
    <div className="border border-solid border-material bg-white max-w-xl sm:max-w-xs rounded-xl flex flex-col w-full mt-12 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit'}}>
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

export default Account

Account.getInitialProps = async (ctx) => {
  let id = ctx.query.id
  let account, transactions
  const user = await checkUser(ctx)
  try {
    account = await accountsService.getAccount(id.toString(), user.token)
    transactions = await transactionService.getTransactions(account.id.toString(), user.token)
  } catch(error) {
    console.log(error)
  }
  return { account: account, transactions: transactions }
}
