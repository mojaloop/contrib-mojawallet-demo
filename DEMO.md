# P2B QR Code Demo


## QR Code Scheme

<!-- TODO: describe the scheme and format here -->
<!-- insert references to the Mojaloop API here -->

```json
{
  "PartyIdType": string, (actually this could be more strict)
  "PartyIdValue": string,
  "PartyIdSubValue": optional string
}
```

for example,

A basic merchant identifier with a Business's Phone number
```json
{
  "PartyIdType": "MERCHANT",
  "PartyIdValue": "04404400404"
}
```

This correlates to a Mojaloop GET /parties request of:
```
GET /parties/MERCHANT/04404400404
```

A merchant identifier with a business ID held by some regulatory authority
```json
{
  "PartyIdType": "MERCHANT",
  "PartyIdValue": "abn_12345"
}
```

This correlates to a Mojaloop GET /parties request of:
```
GET /parties/MERCHANT/abn_12345
```

A merchant identifier with a business' phone number and a till number
```json
{
  "PartyIdType": "MERCHANT",
  "PartyIdValue": "04404400404",
  "PartyIdSubValue": "3312"
}
```

This correlates to a Mojaloop GET /parties request of:
```
GET /parties/MERCHANT/04404400404/3312
```


<!-- TODO: describe how to generate a demo QR following this scheme -->
<!-- eg. remove whitespace -->
<!-- eg. validate json -->
<!-- eg. copy and paste to some website -->


## For Example, the following

<!-- TODO: embed 3-5 examples here -->

## Backend:

```bash
./scripts/setupHydra.sh
./scripts/setupFrontendClient.sh

# set up config for TTK
export MW_ALS_ENDPOINT=localhost:5000
export MW_QUOTES_ENDPOINT=localhost:5000
export MW_TRANSFERS_ENDPOINT=localhost:5000
export MW_TRANSACTION_REQUEST_ENDPOINT=localhost:5000

# set up config for ml sandbox
export MW_ALS_ENDPOINT=sandbox.mojaloop.io/api/fspiop
export MW_QUOTES_ENDPOINT=sandbox.mojaloop.io/api/fspiop
export MW_TRANSFERS_ENDPOINT=sandbox.mojaloop.io/api/fspiop
export MW_TRANSACTION_REQUEST_ENDPOINT=sandbox.mojaloop.io/api/fspiop


cd packages/backend

npm run build
npm run start
```


## Sandbox Config:
```bash
# in a separate shell, run localtunnel and expose the mojalwallet backend
npx localtunnel --port 3001
# your url is: https://ordinary-shrimp-25.loca.lt


cd packages/backend

# Copy the above url out and put it in the ml-bootstrap config
./node_modules/.bin/ml-bootstrap participants -c ../../ml-bootstrap.config.json5




```