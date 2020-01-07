import axios from 'axios'
import ky from 'ky-universal'
import getConfig from 'next/config'
const { publicRuntimeConfig } = getConfig()

const USERS_API_URL = publicRuntimeConfig.REACT_APP_USERS_API_URL

function handleError (statusCode: number, authErrorCallback?: () => void) {
  if ((statusCode === 401 || statusCode === 403) && authErrorCallback) {
    authErrorCallback()
  }
}

export const OTPService = (authErrorCallback?: () => void) => {
  return {
    getOTP: async (authToken: string) => {
      const url = new URL('otp', USERS_API_URL)
      return ky.get(url.toString(), { headers: { authorization: `Bearer ${authToken}` } }).then(resp => resp.json()).catch(error => { handleError(error.response.status, authErrorCallback); throw error })
    },
    createOTP: async (accountId: string, authToken: string) => {
      const url = new URL('otp', USERS_API_URL)
      return axios.post(url.toString(), {
        accountId
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }).then(response => response.data)
        .catch(error => { throw error })
    }
  }
}
