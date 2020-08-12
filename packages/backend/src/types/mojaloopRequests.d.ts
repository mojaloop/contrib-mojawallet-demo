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
