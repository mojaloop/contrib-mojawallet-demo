import got, { Response } from 'got'
import { ExtensionList } from './transaction-request-service'

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
