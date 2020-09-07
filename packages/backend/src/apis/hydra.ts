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

import axios, { AxiosResponse } from 'axios'
import got from 'got'

const hydraAdminUrl = process.env.HYDRA_ADMIN_URL || 'http://localhost:9001'
let mockTlsTermination = {}
const MOCK_TLS_TERMINATION = process.env.MOCK_TLS_TERMINATION || 'true'
if (MOCK_TLS_TERMINATION) {
  mockTlsTermination = {
    'X-Forwarded-Proto': 'https'
  }
}

type Flow = 'login' | 'consent' | 'logout'
type Action = 'accept' | 'reject'

// A little helper that takes type (can be "login" or "consent") and a challenge and returns the response from ORY Hydra.
function get (flow: Flow, challenge: string): Promise<AxiosResponse> {
  const url = new URL('/oauth2/auth/requests/' + flow, hydraAdminUrl)
  url.searchParams.set(`${flow}_challenge`, challenge)
  return axios.get(url.toString(), {
    headers: mockTlsTermination,
    timeout: 5000
  }).then(res => {
    return res.data
  })
}

// A little helper that takes type (can be "login" or "consent"), the action (can be "accept" or "reject") and a challenge and returns the response from ORY Hydra.
function put (flow: Flow, action: Action, challenge: string, body: any): Promise<AxiosResponse> {
  const url = new URL('/oauth2/auth/requests/' + flow + '/' + action, hydraAdminUrl)
  url.searchParams.set(`${flow}_challenge`, challenge)
  const headers = Object.assign(mockTlsTermination, { 'content-type': 'application/json' })
  return axios.put(url.toString(), body, {
    headers,
    timeout: 5000
  }).then(res => res.data)
}

export type Oauth2ClientDetails = {
  client_id: string;
  client_name: string;
  scope: string;
  response_types: string[];
  grant_types: string[];
  redirect_uris: string[];
  logo_uri: string;
}

export interface TokenInfo {
  active: boolean;
  scope?: string;
  client_id?: string;
  username?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  sub?: string;
  aud?: string;
  iss?: string;
  jti?: string;
}

export interface HydraApi {
  introspectToken: (token: string) => Promise<TokenInfo>;
  getLoginRequest: (challenge: string) => Promise<AxiosResponse>;
  acceptLoginRequest: (challenge: string, body: any) => Promise<AxiosResponse>;
  rejectLoginRequest: (challenge: string, body: any) => Promise<AxiosResponse>;
  getConsentRequest: (challenge: string) => Promise<AxiosResponse>;
  acceptConsentRequest: (challenge: string, body: any) => Promise<AxiosResponse>;
  rejectConsentRequest: (challenge: string, body: any) => Promise<AxiosResponse>;
  getLogoutRequest: (challenge: string) => Promise<AxiosResponse>;
  acceptLogoutRequest: (challenge: string) => Promise<AxiosResponse>;
  rejectLogoutRequest: (challenge: string) => Promise<AxiosResponse>;
  createOauthClient: (clientDetails: Oauth2ClientDetails) => Promise<AxiosResponse>;
}

export const hydraApi: HydraApi = {
  // Introspects the token
  introspectToken: function (token: string) {
    const url = new URL('/oauth2/introspect', hydraAdminUrl)
    const headers = Object.assign({ 'Content-Type': 'application/x-www-form-urlencoded' }, mockTlsTermination)
    const body = (new URLSearchParams({ token })).toString()
    console.log('in introspect token: ', token, ' typeof token', typeof token)
    const instance = got.extend({
      hooks: {
        beforeRequest: [
          options => {
            console.log('headers before going out', options.headers)
            console.log('body before going out', options.body)
            if (options.headers) {
              options.headers['content-type'] = 'application/x-www-form-urlencoded'
            }
          }
        ]
      }
    })

    return instance.post(url.toString(), { body, headers }).then(resp => JSON.parse(resp.body))
  },
  // Fetches information on a login request.
  getLoginRequest: async function (challenge: string): Promise<AxiosResponse> {
    return get('login', challenge)
  },
  // Accepts a login request.
  acceptLoginRequest: async function (challenge: string, body: any): Promise<AxiosResponse> {
    return put('login', 'accept', challenge, body)
  },
  // Rejects a login request.
  rejectLoginRequest: async function (challenge: string, body: any): Promise<AxiosResponse> {
    return put('login', 'reject', challenge, body)
  },
  // Fetches information on a consent request.
  getConsentRequest: async function (challenge: string): Promise<AxiosResponse> {
    return get('consent', challenge)
  },
  // Accepts a consent request.
  acceptConsentRequest: async function (challenge: string, body: any): Promise<AxiosResponse> {
    return put('consent', 'accept', challenge, body)
  },
  // Rejects a consent request.
  rejectConsentRequest: async function (challenge: string, body: any): Promise<AxiosResponse> {
    return put('consent', 'reject', challenge, body)
  },
  // Fetches information on a logout request.
  getLogoutRequest: async function (challenge: string): Promise<AxiosResponse> {
    return get('logout', challenge)
  },
  // Accepts a logout request.
  acceptLogoutRequest: async function (challenge: string): Promise<AxiosResponse> {
    return put('logout', 'accept', challenge, {})
  },
  // Reject a logout request.
  rejectLogoutRequest: async function (challenge: string): Promise<AxiosResponse> {
    return put('logout', 'reject', challenge, {})
  },
  createOauthClient: async function (clientDetails: Oauth2ClientDetails): Promise<AxiosResponse> {
    const url = new URL('/clients', hydraAdminUrl)
    const headers = Object.assign({ 'Content-Type': 'application/json' }, mockTlsTermination)
    return axios.post(url.toString(), clientDetails, { headers }).then(resp => resp.data)
  }
}
