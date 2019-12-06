import axios, { AxiosResponse } from 'axios'
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
  putResponse: (responseObj: TransactionMojaResponse, transactionRequestId: string) => Promise<AxiosResponse>;
  putErrorResponse: (responseObj: TransactionRequestError, transactionRequestId: string) => Promise<AxiosResponse>;
}

export const mojaResponseService: MojaResponseService = {
  putResponse: function (responseObj: TransactionMojaResponse, transactionRequestId: string) {
    const putUri = new URL('/transactionRequests/' + transactionRequestId, baseMojaUrl)
    return axios.put(putUri.href, responseObj)
  },
  putErrorResponse: function (responseObj: TransactionRequestError, transactionRequestId: string) {
    const putUri = new URL('/transactionRequests/' + transactionRequestId + '/error', baseMojaUrl)
    return axios.put(putUri.href, responseObj)
  }
}
