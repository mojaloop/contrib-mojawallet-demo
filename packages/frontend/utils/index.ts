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

import { parseCookies } from 'nookies'
import { UsersService } from '../services/users'

const usersService = UsersService()

export const formatCurrency = (value: number, scale: number) => {
  return (value * 10 ** (-scale)).toFixed(scale) + ' XML'
}

export const checkUser = async (ctx) => {
  let user, cookies
  try {
    cookies = parseCookies(ctx)
    if (cookies && cookies.token) {
      user = await usersService.getUser(cookies.token)
    } else {
      throw new Error('no token')
    }
  } catch (error) {
    console.log(error)
    if (typeof window === 'undefined') {
      ctx.res.writeHead(302, {
        Location: '/signup'
      })
      ctx.res.end()
      return
    }

    window.location.href = '/signup'
  }
  return { ...user, token: cookies.token }
}

export const checkUserOnSignup = async (ctx) => {
  let user, cookies
  try {
    cookies = parseCookies(ctx)
    if (cookies && cookies.token) {
      if (typeof window === 'undefined') {
        ctx.res.writeHead(302, {
          Location: '/login'
        })
        ctx.res.end()
        return
      }
      window.location.href = '/login'
    }
  } catch (error) {
    console.log(error)
  }
  return { ...user, token: cookies.token }
}
