#!/usr/bin/env node

const got = require('got')
const v4 = require('uuid/v4')

const transactionId = v4()
const transactionRequestId = v4()
let quoteId
let payeeFsp

async function create() {
  const response = await got.post({
    url: `http://localhost:3001/mm/p2p/create`,
    json: {
      "debitParty": [
        "+2551231231234"
      ],
      "creditPartyType": "BUSINESS",
      "creditPartyId": "001239"
    }
  }).json()
  return response
}

async function getFees(createResponse) {
  console.log('transactionId', transactionId)
  console.log('transactionRequestId', transactionRequestId)

  const response = await got.post({
    url: `http://localhost:3001/mm/p2p/getFees`,
    json: {
      transactionId,
      transactionReq: {
        transactionRequestId,
        payee: createResponse,
        "payer": {
          "partyIdType": "MSISDN",
          "partyIdentifier": "2553442423323"
        },
        "amount": {
          "currency": "UGX",
          "amount": "10000"
        },
        "transactionType": {
          "scenario": "TRANSFER",
          "initiator": "PAYER",
          "initiatorType": "CONSUMER"
        }
      }
    }
  }).json()
  return response
}

async function makeTransfer(getFeeResponse) {
  const response = await got.post({
    url: `http://localhost:3001/mm/p2p/makeTransfer`,
    json: {
      quoteId: getFeeResponse.quoteId,
      transactionId,
      transactionRequestId,
      payeeFsp,
      quoteResponse: getFeeResponse.quoteResponse
    }
  }).json()
  return response
}

async function main() {
  const createResponse = await create()
  logBorder()
  console.log('createResponse', createResponse)

  // save for later
  payeeFsp = createResponse.partyIdInfo.fspId

  logBorder()  
  const getFeesResponse = await getFees(createResponse)
  logBorder()
  console.log('getFeesResponse', getFeesResponse)
  logBorder()

  const makeTransferResponse = await makeTransfer(getFeesResponse)
  logBorder()
  console.log('makeTransferResponse', makeTransferResponse)
  logBorder()
}

function logBorder() {
  console.log(`-------------\n\n`)
}

main()