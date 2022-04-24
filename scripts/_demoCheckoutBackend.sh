#! /usr/bin/env bash

curl -v -X POST localhost:3001/mm/p2p/create \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -d '{
    "debitParty": [
      "+2551231231234"
    ],
    "creditPartyType": "BUSINESS",
    "creditPartyId": "001239"
  }'


# sleep 10

curl -X POST localhost:3001/mm/p2p/getFees \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -d '{
    "transactionId": "0f51813f-2812-44b7-b5c1-339bda272343",
    "transactionReq": {
      "transactionRequestId": "0f51813f-2812-44b7-b5c1-339bda272344", 
      "payee": {
        "partyIdInfo": {
          "partyIdType": "BUSINESS",
          "partyIdentifier": "001239",
          "fspId": "jcash"
        },
        "merchantClassificationCode": "27"
      },
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
  }'

sleep 5

curl -X POST localhost:3001/mm/p2p/makeTransfer \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -d '{
    "quoteId": "935e66c5-5241-4d76-81c3-cbe727c3ea68",
    "payeeFsp": "testingtoolfsp",
    "transactionId": "0f51813f-2812-44b7-b5c1-339bda272343",
    "transactionRequestId": "0f51813f-2812-44b7-b5c1-339bda272344", 
    "quoteResponse": {
      "transferAmount":{
        "currency":"USD",
        "amount":"10"
      },
      "expiration":"5155-03-30T01:47:24.183+19:39",
      "ilpPacket":"AXsAAAAAAAAD6CBnLnRlc3Rpbmd0b29sZnNwLmJ1c2luZXNzLjU0Mzk0NVBleUp0YjJOclJHRjBZU0k2SWxSb2FYTWdhWE1nWVNCMFpYTjBJR1JoZEdFZ1puSnZiU0J6Wld4bUlIUmxjM1JwYm1jZ2RHOXZiR3RwZENKOQA",
      "condition":"tDecPpsAw_kvahADsHZIzhxWzM7F1z3eP8ggm4EHpvo",
      "payeeReceiveAmount":{
        "currency":"USD",
        "amount":"123"
      },
      "payeeFspFee":{
        "currency":"USD",
        "amount":"2"
      },
      "payeeFspCommission":{
        "currency":"USD",
        "amount":"3"
      },
      "geoCode":{
        "latitude":"+1",
        "longitude":"1.2621"
      }
    }
  }'