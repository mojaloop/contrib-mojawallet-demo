import got, { Response } from 'got'
import { ExtensionList } from './transaction-request-service'
import { Quote } from './quote-service'

const baseMojaUrl: string = process.env.PUT_BASE_URI || 'http://localhost:8008' // base uri for testing

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
  putResponse: (responseObj: TransactionMojaResponse, transactionRequestId: string) => Promise<Response>;
  putErrorResponse: (responseObj: TransactionRequestError, transactionRequestId: string) => Promise<Response>;
  quoteResponse: (responseObj: Quote) => Promise<Response>;
}

export const mojaResponseService: MojaResponseService = {
  putResponse: async function (responseObj: TransactionMojaResponse, transactionRequestId: string) {
    const putUri = new URL('/transactionRequests/' + transactionRequestId, baseMojaUrl)
    return got.put(putUri.href, { json: responseObj })
  },
  putErrorResponse: function (responseObj: TransactionRequestError, transactionRequestId: string) {
    const putUri = new URL('/transactionRequests/' + transactionRequestId + '/error', baseMojaUrl)
    return got.put(putUri.href, { json: responseObj })
  },
  quoteResponse: function (responseObj: Quote) {
    const quoteUri = new URL('/quotes', baseMojaUrl)
    return got.post(quoteUri.href, { json: responseObj })
  }
}
