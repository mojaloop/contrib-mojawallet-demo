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
import {ConsentRequest} from '../pages/consent'

type AgreementConsentProps = {
  acceptConsent: () => void
  consentRequest: ConsentRequest
}

const NormalConsent: React.FC<AgreementConsentProps> = ({consentRequest, acceptConsent}) => {

  return (
      <div className="w-full max-w-sm mx-auto mt-16 bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className='w-full flex justify-center align-center mb-4'>

        </div>
        <div className="text-center my-4">
          Authorize <strong className="text-grey-darkest font-bold whitespace-no-wrap">{consentRequest.client.client_name}</strong> to access your ILP Wallet Account
        </div>
        <div className="text-grey-dark font-semibold text-md mb-2">
          Permissions
        </div>
        <div>
          {consentRequest.requestedScopes.map(scope => {
            if(scope === 'intents') {
              return (
                <div key={scope} className="border-b py-4">
                  <div className="text-grey-darkest text-xl">
                    Intents
                  </div>
                  <div className="text-grey-darkest text-md mt-2">
                    This application will be able to create, update and read intents.
                  </div>
                </div>
              )
            }
            if(scope === 'openid') {
              return (
                <div key={scope} className="border-b py-4">
                  <div className="text-grey-darkest text-xl">
                    Access to profile information
                  </div>
                  <div className="text-grey-darkest text-md mt-2">
                    This application will have access to your profile information.
                  </div>
                </div>
              )
            }
            return null
          })}
        </div>
        <div className="mt-6">
          <div onClick={acceptConsent}
               className="bg-blue hover:bg-blue-dark cursor-pointer text-white font-bold py-2 px-4 rounded text-center">
            Authorize
          </div>
        </div>
      </div>
    )
}

export default NormalConsent;
