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
