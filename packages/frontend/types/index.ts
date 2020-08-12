import { SetStateAction } from 'react'

export type AccountCardProps = {
  account: AccountDetails
}

export type TransactionCardProps = {
  transaction: TransactionsDetails
}

export type OTPCardProps = {
  otp: OTPDetails
}

export type CreateOTPCardProps = {
  accountId: number,
  token: string,
  setOTP: React.Dispatch<SetStateAction<{ otp: OTPDetails; hasOTP: boolean; disableOTP: boolean; }>>
}

export type CreateFaucetCardProps = {
  accountId: number
  token: string
}

export type TimerProps = {
  otp: OTPDetails,
  setOTP: React.Dispatch<SetStateAction<{ otp: OTPDetails; hasOTP: boolean; disableOTP: boolean; }>>
}

export type ActiveOTPCardProps = {
  otp: OTPDetails,
  setOTP: React.Dispatch<SetStateAction<{ otp: OTPDetails; hasOTP: boolean; disableOTP: boolean; }>>
  token: string
}

export type AccountPageProps = {
  account: AccountDetails
  transactions: TransactionsDetails[]
  otp: OTPDetails,
  user: UserDetails
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

export type OTPDetails = {
  id: number
  userId: string
  accountId: number
  otp: string
  isUsed: number,
  expiresAt: number
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

export type CheckoutProps = {
  accounts: AccountDetails[],
  user: UserDetails
}
