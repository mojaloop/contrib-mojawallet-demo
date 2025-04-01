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

import ky from 'ky-universal'
import getConfig from 'next/config'
const { publicRuntimeConfig } = getConfig()

const USERS_API_URL = publicRuntimeConfig.REACT_APP_USERS_API_URL

function handleError (statusCode: number, authErrorCallback?: () => void) {
  if ((statusCode === 401 || statusCode === 403) && authErrorCallback) {
    authErrorCallback()
  }
}

export const UsersService = (authErrorCallback?: () => void) => {
  return {
    signup: async (username: string, password: string) => {
      const url = new URL('users', USERS_API_URL)
      return ky.post(url.toString(), {
        json: { username, password }
      })
    },
    getLogin: async (challenge: string) => {
      const url = new URL('login', USERS_API_URL)
      url.searchParams.set('login_challenge', challenge)
      return ky.get(url.toString()).then(resp => resp.json()).catch(error => { handleError(error.response.status, authErrorCallback); return error })
    },
    login: async (username: string, password: string, challenge: string) => {
      const url = new URL('login', USERS_API_URL)
      url.searchParams.set('login_challenge', challenge)
      return ky.post(url.toString(), {
        json: { username, password }
      }).then(resp => resp.json())
    },
    getConsent: async (challenge: string) => {
      const url = new URL('consent', USERS_API_URL)
      url.searchParams.set('consent_challenge', challenge)
      return ky.get(url.toString()).then(resp => resp.json()).catch(error => { handleError(error.response.status, authErrorCallback); return error })
    },
    handleConsent: async (challenge: string, body: object) => {
      const url = new URL('consent', USERS_API_URL)
      url.searchParams.set('consent_challenge', challenge)
      return ky.post(url.toString(), {
        json: body
      }).then(resp => resp.json()).catch(error => { handleError(error.response.status, authErrorCallback); return error })
    },
    handleLogout: async (challenge: string) => {
      const url = new URL('logout', USERS_API_URL)
      url.searchParams.set('logout_challenge', challenge)
      return ky.post(url.toString()).then(resp => resp.json()).catch(error => { handleError(error.response.status, authErrorCallback); return error })
    },
    getUser: async (token: string) => {
      const url = new URL('users/me', USERS_API_URL)
      return ky.get(url.toString(), { headers: { authorization: `Bearer ${token}` } }).then(resp => resp.json())
    },
    update: async (id: number, body: any, token: string) => {
      const url = new URL(`users/${id}`, USERS_API_URL)
      return ky.patch(url.toString(), {
        headers: { authorization: `Bearer ${token}` },
        json: body
      }).then(resp => resp.json()).catch(error => { handleError(error.response.status, authErrorCallback); return error })
    },
    registerOauth2Client: async (clientDetails: any, token: string) => {
      const url = new URL(`oauth2/clients`, USERS_API_URL)
      console.log('client data posting', clientDetails)
      return ky.post(url.toString(), {
        json: clientDetails,
        headers: { authorization: `Bearer ${token}` }
      }).then(resp => resp.json()).catch(error => { handleError(error.response.status, authErrorCallback); return error })
    }
  }
}
