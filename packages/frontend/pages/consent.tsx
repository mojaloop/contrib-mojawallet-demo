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

import React from 'react'
import { NextPage } from "next"

import { UsersService } from '../services/users'
import NormalConsent from '../components/normal-consent'
import AgreementConsent from '../components/agreement-consent'

const usersService = UsersService()

type Props = {
  consentChallenge: string
  consent: ConsentRequest
}

export type ConsentRequest = {
  accounts?: { id: number, name: string }[],
  client: {
    client_id: string,
    redirect_uris: string[],
    logo_uri?: string,
    client_name?: string
  },
  requestedScopes: string[],
  agreementUrl?: string,
  redirectTo?: string
}

const dummyConsent: ConsentRequest = {
  client: {
    client_id: 'Test',
    redirect_uris: [],
    client_name: 'Merchant'
  },
  requestedScopes: [
    'intents', 'offline', 'openid'
  ]
}

const Consent: NextPage<Props> = ({consentChallenge, consent}) => {

  const handleConsent = async () => {
    try {
      const acceptConsent = await usersService.handleConsent(consentChallenge, {
        accepts: true,
        scopes: consent.requestedScopes
      })
      window.location.href = acceptConsent.redirectTo
    } catch (error) {
      if (error.response.status === 401) {
        const rejectConsent = await usersService.handleConsent(consentChallenge, {
          accepts: false,
          scopes: consent.requestedScopes
        })
        alert(error.response.data)
        window.location.href = rejectConsent.redirectTo
        return
      }
      console.log('error accepting consent', error.response)
      alert('An error occurred whilst trying to authorize the agreement.')
    }
  }

  return consent ?
    consent.agreementUrl ?
      <AgreementConsent challenge={consentChallenge} consentRequest={consent} /> :
      <NormalConsent consentRequest={consent}  acceptConsent={handleConsent.bind(this)} /> : null
}

Consent.getInitialProps = async ({query, res}) => {
  const { consent_challenge } = query

  if(!consent_challenge) {
    res.writeHead(302, {
      Location: '/'
    })
    res.end()
  }

  // Check consentChallenge to see if it can be skipped.
  const consent = await usersService.getConsent(consent_challenge.toString()).then(resp => {

    if(resp.redirectTo) {
      res.writeHead(302, {
        Location: resp.redirectTo
      })
      res.end()
    }
    return resp
  }).catch(error => {
    console.log(error)
  })

  return {
    consentChallenge: consent_challenge.toString(),
    consent
  }
}

export default Consent
