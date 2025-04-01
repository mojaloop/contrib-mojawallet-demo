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
import Button from '../../components/button'
import { checkUserOnSignup } from '../../utils'
import { ProfilePageProps } from '../../types'

const Signup: NextPage<ProfilePageProps> = ({user}) => {
  return (
    <div className="flex flex-wrap content-center items-center justify-center text-center w-full h-screen">
      <img className="h-32" src={'/Logo.svg'}/>
      <div className="w-full text-gray-800 text-headline">Welcome to<br/>Mojawallet</div>
      <div className="w-full text-gray-500 text-caption mt-2">Your new personal<br/>mobile wallet</div>
      <div className="w-full mt-20">
        <Button to="/signup/name" text={false}>Get started</Button>
      </div>
      <div className="w-full mt-2">
        <Button to="/login" text={true}>login</Button>
      </div>
    </div>
  )
}

export default Signup

Signup.getInitialProps = async (ctx) => {
  const user = await checkUserOnSignup(ctx)
  return { user }
}
