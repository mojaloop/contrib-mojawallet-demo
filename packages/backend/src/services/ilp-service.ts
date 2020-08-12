import { Logger } from 'pino'

type QuoteIlpResponse = {
  fulfilment: string;
  ilpPacket: string;
  condition: string;
}

export interface IlpServiceOptions {
  secret: string;
  logger: Logger;
}

export interface IlpService {
  getQuoteResponseIlp(quoteRequest: any, quoteResponse: any): QuoteIlpResponse;
  calculateFulfil (ilpPacket: string): string;
}
