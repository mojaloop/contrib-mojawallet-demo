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
 --------------
 ******/

import React from 'react'
import { NextPage } from "next"
import ky from 'ky-universal'
import qs from 'querystring'
import { setCookie } from 'nookies'

const HYDRA_TOKEN_ENDPOINT = process.env.HYDRA_TOKEN_ENDPOINT || 'http://localhost:9000/oauth2/token'
const HYDRA_REDIRECT_URI = process.env.HYDRA_REDIRECT_URI || 'http://localhost:3000/callback'
const HYDRA_CLIENT_ID = process.env.HYDRA_CLIENT_ID || 'frontend-client'

const Callback: NextPage = () => {
  return (
    null
  )
}

Callback.getInitialProps = async (ctx) => {
  const {code} = ctx.query

  if (!code) {
    ctx.res.writeHead(302, {
      Location: '/'
    })
    ctx.res.end()
  }

  const tokenInfo = await ky.post(HYDRA_TOKEN_ENDPOINT, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Forwarded-Proto': 'https'
    },
    body: qs.stringify({
      grant_type: 'authorization_code',
      code: code.toString(),
      redirect_uri: HYDRA_REDIRECT_URI,
      client_id: HYDRA_CLIENT_ID,
    })
  }).then(async resp => {
    return resp.json()
  }).catch(error => {
    console.log(error.response)
    throw error
  })

  setCookie(ctx, 'token', tokenInfo.access_token, {})

  ctx.res.writeHead(302, {
    Location: '/'
  })
  ctx.res.end()
  return {}
}

export default Callback
