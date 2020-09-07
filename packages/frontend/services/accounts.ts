/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the License) and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Coil
 - Cairin Michie <cairin@coil.com>
 - Donovan Changfoot <don@coil.com>
 - Matthew de Haast <matt@coil.com>
 - Talon Patterson <talon.patterson@coil.com>
 --------------
 ******/

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
