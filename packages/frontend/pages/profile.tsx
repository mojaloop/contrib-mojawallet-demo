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

import React, { useState, useEffect } from 'react'
import { NextPage } from "next"
import Button from '../components/button'
import { checkUser } from '../utils'
import { ProfilePageProps } from '../types'
import QRCode from 'qrcode';



const Signup: NextPage<ProfilePageProps> = ({user}) => {

  const [swInstalled, setSwInstalled] = useState(false)
  const [swSupported, setSwSupported] = useState(true)

  const addInstruments = (registration) => {
    registration.paymentManager.userHint = "Registration user hint"
    return Promise.all([
      registration.paymentManager.instruments.set(
        'Moja Wallet',
        {
          name: 'Moja Wallet',
          method: 'http://localhost:3000'
        }
      )
    ])
  }

  const installSw = () => {

      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        // @ts-ignore
        if(!registration.paymentManager) {
          // Payment app capability not available, unregister right away.
          registration.unregister().then((success) => {})
          // showBobPayError('Payment app capability not present. Enable flags?')
          setSwSupported(false)
          return;
        }

        addInstruments(registration).then(function() {
          setSwInstalled(true)
        });
      }).catch((error) => {
        setSwSupported(false)
      })

  }

  const checkSwStatus = () => {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistration('/sw.js').then(function(registration) {
        if (registration) {
            // @ts-ignore
            if (registration.paymentManager) {
                registration.update();
            } else {
                unregisterPaymentAppServiceWorker();
            }
        }
        setSwInstalled(!!registration)
      });
    } else {
      setSwSupported(false)
    }
  }

  const unregisterPaymentAppServiceWorker = () => {
    navigator.serviceWorker.getRegistration('/sw.js').then(function(registration) {
      if (registration) {
        registration.unregister().then((success) => {
            // showBobPayStatus(!success);
            setSwInstalled(!success)
        });
      }
    });
  }

  useEffect(() => {
    checkSwStatus()
  })

  return (
    <div className="flex flex-wrap content-center items-center justify-center text-center w-full h-screen">
      <img className="h-32" src={'/Logo.svg'}/>
      <div className="w-full mt-5 text-gray-800 text-headline">{user.username}</div>
      <div className={ swInstalled || !swSupported ? 'hidden' : "px-5 py-3 rounded-xl focus:outline-none text-button text-primary uppercase tracking-wider sm:text-base"} onClick={installSw}>
        Install SW
      </div>
      <div className={ !swInstalled ? 'hidden' : "px-5 py-3 rounded-xl focus:outline-none text-button text-primary uppercase tracking-wider sm:text-base"} onClick={unregisterPaymentAppServiceWorker}>
        Uninstall SW
      </div>
      { swSupported ?'':'Payment Handler is not supported'}
      <div className="w-full mt-20">
        <Button to="/logout" text={false}>logout</Button>
      </div>
    </div>
  )
}

export default Signup

Signup.getInitialProps = async (ctx) => {
  const user = await checkUser(ctx)
  return { user }
}
