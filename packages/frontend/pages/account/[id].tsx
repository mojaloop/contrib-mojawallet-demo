import React from 'react'
import Head from 'next/head'
import { NextPage, NextPageContext } from 'next'
import { TransactionService } from '../../services/transactions'
import { TransactionCardProps, AccountPageProps } from "../../types"
import Link from 'next/link'
import { formatCurrency, checkUser } from "../../utils"
import { AccountsService } from '../../services/accounts'

const accountsService = AccountsService()
const transactionService = TransactionService()

const Account: NextPage<AccountPageProps> = ({ account, transactions }) => {

  return (
    <div>
      <Head>
        <title>Account</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="fixed top-0 right-0" style={{ zIndex:1 }}>
        <Link href={{ pathname: '/' }}>
          <div className="mr-5 mt-5">
            <img style={{ height: '35px'}} src={'../../icons/close-24px-white.svg'}/>
          </div>
        </Link>
      </div>
      <div className='w-full fixed top-0 elevation-4' style={{textDecoration: 'none', color: 'inherit', height: '16rem', background: 'linear-gradient(#225980, #7caab2)', borderRadius: '0 0 20px 20px',zIndex:0 }}>
        <div className='w-full mx-auto max-w-lg'>
          
          <div className="flex">
          
            <div className="text-3xl text-white flex-1 text-base mx-4 px-4 mt-20">
              {account.name}
            </div>
          </div>
          <div className="flex flex-wrap text-2xl text-white mx-10">
            <div className="w-1/2">
              Balance
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
        { transactions.length > 0 ? transactions.map(transaction => <TransactionCard key={'transaction_' + transaction.id} transaction={transaction}/>) : 'No Accounts present.'}
      </div>
    </div>
  )
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  return (
    <Link href="/account/[account.id]"  as={`/account/${transaction.id}`}>
      <div className="w-auto rounded-lg elevation-1 flex flex-col w-full mt-8 px-6 py-4 mx-8" style={{textDecoration: 'none', color: 'inherit', background: 'white'}}>
        <div className="flex flex-1">
          <div className="flex-1">
            <div className="text-3xl">
              {formatCurrency(transaction.amount, 6)}
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
          {transaction.epoch}
        </div>
      </div>
    </Link>
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
