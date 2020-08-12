import axios from 'axios'
import ky from 'ky-universal'
import getConfig from 'next/config'
const { publicRuntimeConfig } = getConfig()

const ACCOUNTS_API_URL = publicRuntimeConfig.REACT_APP_USERS_API_URL

function handleError (statusCode: number, authErrorCallback?: () => void) {
  if ((statusCode === 401 || statusCode === 403) && authErrorCallback) {
    authErrorCallback()
  }
}

export const AccountsService = (authErrorCallback?: () => void) => {
  return {
    createAccount: async (name: string, authToken: string) => {
      const url = new URL('accounts', ACCOUNTS_API_URL)
      return ky.post(url.toString(), {
        headers: { authorization: `Bearer ${authToken}` },
        json: { name }
      }).then(resp => resp.json())
    },
    getAccount: async (accountId: string, authToken: string) => {
      const url = new URL(`accounts/${accountId}`, ACCOUNTS_API_URL)
      return ky.get(url.toString(), {
        headers: { authorization: `Bearer ${authToken}` }
      }).then(resp => resp.json()).catch(error => { handleError(error.response.status, authErrorCallback); return error })
    },
    getAccounts: async (userId: string, authToken: string) => {
      const url = new URL('accounts', ACCOUNTS_API_URL)
      return axios.get(`${url.toString()}?userId=${userId}`, { headers: { Authorization: `Bearer ${authToken}` } }).catch(error => { handleError(error.response.status, authErrorCallback); return error })
    },
    getTransactions: async (accountId: string, authToken: string) => {
      const url = new URL('transactions', ACCOUNTS_API_URL)
      return axios.get(url.toString() + `?accountId=${accountId}&aggregateTime=30000`, { headers: { Authorization: `Bearer ${authToken}` } }).then(response => response.data).catch(error => { handleError(error.response.status, authErrorCallback); return error })
    },
    addFunds: async (accountId: string, authToken: string) => {
      const url = new URL('faucet', ACCOUNTS_API_URL)
      return axios.post(url.toString(), {
        accountId
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }).then(response => response.data)
        .catch(error => { handleError(error.response.status, authErrorCallback); return error })
    },
    getAuthorizationCode: async (accountId: number, amount: string, currency: string, authToken: string) => {
      const url = new URL(`mm/accounts/accountId/${accountId}/authorisationCodes`, ACCOUNTS_API_URL)
      const authCodeRequest = {
        amount,
        currency,
        requestDate: new Date().toUTCString()
      }
      return axios.post(url.toString(), authCodeRequest, { headers: { Authorization: `Bearer ${authToken}` } }).then(resp => resp.data)
    }
  }
}
