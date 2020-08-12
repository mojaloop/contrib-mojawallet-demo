export interface MobileMoneyTransactionRequest {
  amount: string
  currency: string
  type: 'merchantpay' | 'transfer'
  debitParty: [
    { key: 'msisdn', value: string }
  ]
  creditParty: [
    { key: 'msisdn', value: string },
    { key: 'accountId', value: string }
  ],
  oneTimeCode?: string
}

export interface MobileMoneyTransaction extends MobileMoneyTransactionRequest {
  transactionStatus: string
  transactionReference: string
}

export interface MobileMoneyAuthorizationCodeRequest {
  amount: string,
  currency: string,
  requestDate: string
}

export interface MobileMoneyAuthorizationCodeResponse {
  codeState: 'active' | 'inactive',
  authorisationCode: string
}
