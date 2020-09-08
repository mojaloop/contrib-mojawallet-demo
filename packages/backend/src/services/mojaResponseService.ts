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

import got, { Response } from 'got'
import rc from 'rc'
import { ExtensionList } from './transaction-request-service'
import DefaultConfig from '../../config/default.json'

const config = rc('MW', DefaultConfig)
const baseMojaUrl: string = config.PUT_BASE_URI || 'http://localhost:8008' // base uri for testing

export type TransactionMojaResponse = {
  transactionId?: string;
  transactionRequestState: 'RECEIVED' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  extensionList?: ExtensionList;
}

export type TransactionRequestError = {
  errorInformation: {
    errorCode: string;
    errorDescription: string;
    extensionList: ExtensionList;
  }
}

export interface MojaResponseService {
  putResponse: (responseObj: TransactionMojaResponse, transactionRequestId: string, destFspId: string) => Promise<Response>;
  putErrorResponse: (responseObj: TransactionRequestError, transactionRequestId: string, destFspId: string) => Promise<Response>;
}

export const mojaResponseService: MojaResponseService = {
  putResponse: async function (responseObj: TransactionMojaResponse, transactionRequestId: string, destFspId: string) {
    const putUri = new URL('/transactionRequests/' + transactionRequestId, 'https://transaction-request-service.mojaloop.app')
    return got.put(putUri.href, { json: responseObj,
      headers: {
        'Content-Type': 'application/vnd.interoperability.transactionRequests+json;version=1.0',
        'FSPIOP-Source': 'mojawallet',
        'FSPIOP-Destination': destFspId,
        'Date': new Date().toUTCString()
      }
    })
  },
  putErrorResponse: function (responseObj: TransactionRequestError, transactionRequestId: string, destFspId: string) {
    const putUri = new URL('/transactionRequests/' + transactionRequestId + '/error', baseMojaUrl)
    return got.put(putUri.href, { json: responseObj,
      headers: {
        'Content-Type': 'application/vnd.interoperability.transactionRequests+json;version=1.0',
        'FSPIOP-Source': 'mojawallet',
        'FSPIOP-Destination': destFspId,
        'Date': new Date().toUTCString()
      }
    })
  }
}
