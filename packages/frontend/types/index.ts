export type AccountCardProps = {
  account: AccountDetails
}

export type TransactionCardProps = {
  transaction: TransactionsDetails
}

export type AccountPageProps = {
  account: AccountDetails
  transactions: TransactionsDetails[]
}

export type ProfilePageProps = {
  user: UserDetails
}

export type TransactionsDetails = {
  id: number
  accountId: string
  amount: number
  epoch: number
  Description: string
}

export type AccountDetails = {
  id: number
  name: string
  balance: number
  owner: number
  assetScale: number
}

export type UserDetails = {
  id: number
  username: string
  password: string
  defaultAccountId: number
  token: string
}

export type AccountsPageProps = {
  accounts: AccountDetails[]
  user: UserDetails
}

export type Totals = {
  balance: number
  assetScale: number
}
