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

// eslint-disable-file no-use-before-define
/// <reference types="node" />

declare module '@mojaloop/sdk-standard-components' {

  type PartyIdInfo = {
    partyIdType: string
    partyIdentifier: string
    partySubIdOrType?: string
    fspId: string
  }

  type BulkParticipantsRequest = {
    requestId: string
    partyList: Array<PartyIdInfo>
    currency?: string
  }

  type Money = {
    currency: string,
    amount: string
  }

  type PostTransferBody = {
    transferId: string,
    payeeFsp: string,
    payerFsp: string
    amount: Money,
    ilpPacket: string,
    condition: string,
    expiration: string,
  }

  type Config = {
    logger: any;
    dfspId: string;
    tls: {
      outbound: {
        mutualTLS: {
          enabled: boolean
        },
        creds: {}
      }
    };
    jwsSign: boolean;
    jwsSignPutParties?: boolean;
    jwsSigningKey: string
    peerEndpoint: string
    alsEndpoint?: string
    quotesEndpoint?: string
    transfersEndpoint?: string
    transactionRequestsEndpoint?: string
    wso2Auth?: any
  }

  class MojaloopRequests {
    constructor(config: Config)

    getParties(idType: string, idValue: string, idSubValue: string | null): Promise<object>
    putParties(idType: string, idValue: string, idSubValue: string | null, body: object, destFspId: string): Promise<object>
    putPartiesError(idType: string, idValue: string, idSubValue: string | null, error: object, destFspId: string): Promise<object>

    postParticipants(request: BulkParticipantsRequest, destFspId?: string): Promise<object>
    putParticipants(idType: string, idValue: string, idSubValue: string | null, body: object, destFspId: string): Promise<object>
    putParticipantsError(idType: string, idValue: string, idSubValue: string | null, error: object, destFspId: string): Promise<object>

    postQuotes(quoteRequest: object, destFspId: string): Promise<object>
    putQuotes(quoteId: string, quoteResponse: object, destFspId: string): Promise<object>
    putQuotesError(quoteId: string, error: object, destFspId: string): Promise<object>

    postTransfers(prepare: PostTransferBody, destFspId: string): Promise<object>
    putTransfers(transferId: string, fulfilment: object, destFspId: string): Promise<object>
    putTransfersError(transferId: string, error: object, destFspId: string): Promise<object>

    postTransactionRequests(transactionRequest: object, destFspId: string): Promise<object>
    putTransactionRequests(transactionRequestId: string, transactionRequestResponse: object, destFspId: string): Promise<object>

    getAuthorizations(transactionRequestId: string, authorizationParameters: string, destFspId: string): Promise<object>
    putAuthorizations(transactionRequestId: string, authorizationResponse: object, destFspId: string): Promise<object>
  }
}
