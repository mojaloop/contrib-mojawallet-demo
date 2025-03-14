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
*****/

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
