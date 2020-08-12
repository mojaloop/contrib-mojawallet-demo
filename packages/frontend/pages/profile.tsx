import React, { useState, useEffect } from 'react'
import { NextPage } from "next"
import Button from '../components/button'
import { checkUser } from '../utils'
import { ProfilePageProps } from '../types'

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
          method: 'https://mojaloop.app'
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
