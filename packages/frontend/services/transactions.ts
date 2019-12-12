import ky from 'ky-universal'
import getConfig from 'next/config'
const { publicRuntimeConfig } = getConfig()

const USERS_API_URL = publicRuntimeConfig.REACT_APP_USERS_API_URL

function handleError (statusCode: number, authErrorCallback?: () => void) {
  if ((statusCode === 401 || statusCode === 403) && authErrorCallback) {
    authErrorCallback()
  }
}

export const TransactionService = (authErrorCallback?: () => void) => {
  return {
    getTransactions: async (accountId: string, authToken: string) => {
      const url = new URL('transactions', USERS_API_URL)
      url.searchParams.set('accountId', accountId)
      return ky.get(url.toString(), { headers: { authorization: `Bearer ${authToken}` } }).then(resp => resp.json()).catch(error => { handleError(error.response.status, authErrorCallback); return error })
    }
  }
}
