export interface TransfersPostRequest {
  /**
   * The common ID between the FSPs and the optional Switch for the transfer object, decided by the Payer FSP. The ID should be reused for resends of the same transfer. A new ID should be generated for each new transfer.
   */
  transferId: string;
  /**
   * Payee FSP in the proposed financial transaction.
   */
  payeeFsp: string;
  /**
   * Payer FSP in the proposed financial transaction.
   */
  payerFsp: string;
  /**
   * The transfer amount to be sent.
   */
  amount: Money;
  /**
   * The ILP Packet containing the amount delivered to the Payee and the ILP Address of the Payee and any other end-to-end data.
   */
  ilpPacket: string;
  /**
   * The condition that must be fulfilled to commit the transfer.
   */
  condition: string;
  /**
   * Expiration can be set to get a quick failure expiration of the transfer. The transfer should be rolled back if no fulfilment is delivered before this time.
   */
  expiration: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface TransfersIDPutResponse {
  /**
   * Fulfilment of the condition specified with the transaction. Mandatory if transfer has completed successfully.
   */
  fulfilment?: string;
  /**
   * Time and date when the transaction was completed.
   */
  completedTimestamp?: string;
  /**
   * State of the transfer.
   */
  transferState: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface TransactionType {
  /**
   * Deposit, withdrawal, refund, …
   */
  scenario: string;
  /**
   * Possible sub-scenario, defined locally within the scheme.
   */
  subScenario?: string;
  /**
   * Who is initiating the transaction - Payer or Payee
   */
  initiator: string;
  /**
   * Consumer, agent, business, …
   */
  initiatorType: string;
  /**
   * Extra information specific to a refund scenario. Should only be populated if scenario is REFUND
   */
  refundInfo?: Refund;
  /**
   * Balance of Payments code.
   */
  balanceOfPayments?: string;
}
export interface TransactionsIDPutResponse {
  /**
   * Time and date when the transaction was completed.
   */
  completedTimestamp?: string;
  /**
   * State of the transaction.
   */
  transactionState: string;
  /**
   * Optional redemption information provided to Payer after transaction has been completed.
   */
  code?: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface TransactionRequestsPostRequest {
  /**
   * Common ID between the FSPs for the transaction request object, decided by the Payee FSP. The ID should be reused for resends of the same transaction request. A new ID should be generated for each new transaction request.
   */
  transactionRequestId: string;
  /**
   * Information about the Payee in the proposed financial transaction.
   */
  payee: Party;
  /**
   * Information about the Payer type, id, sub-type/id, FSP Id in the proposed financial transaction.
   */
  payer: PartyIdInfo;
  /**
   * Requested amount to be transferred from the Payer to Payee.
   */
  amount: Money;
  /**
   * Type of transaction.
   */
  transactionType: TransactionType;
  /**
   * Reason for the transaction request, intended to the Payer.
   */
  note?: string;
  /**
   * Longitude and Latitude of the initiating Party. Can be used to detect fraud.
   */
  geoCode?: GeoCode;
  /**
   * OTP or QR Code, otherwise empty.
   */
  authenticationType?: string;
  /**
   * Can be set to get a quick failure in case the peer FSP takes too long to respond. Also, it may be beneficial for Consumer, Agent, Merchant to know that their request has a time limit.
   */
  expiration?: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface TransactionRequestsIDPutResponse {
  /**
   * Identifies a related transaction (if a transaction has been created).
   */
  transactionId?: string;
  /**
   * State of the transaction request.
   */
  transactionRequestState: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface Transaction {
  /**
   * ID of the transaction, the ID is decided by the Payer FSP during the creation of the quote.
   */
  transactionId: string;
  /**
   * ID of the quote, the ID is decided by the Payer FSP during the creation of the quote.
   */
  quoteId: string;
  /**
   * Information about the Payee in the proposed financial transaction.
   */
  payee: Party;
  /**
   * Information about the Payer in the proposed financial transaction.
   */
  payer: Party;
  /**
   * Transaction amount to be sent.
   */
  amount: Money;
  /**
   * Type of the transaction.
   */
  transactionType: TransactionType;
  /**
   * Memo associated to the transaction, intended to the Payee.
   */
  note?: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface Refund {
  /**
   * Reference to the original transaction ID that is requested to be refunded.
   */
  originalTransactionId: string;
  /**
   * Free text indicating the reason for the refund.
   */
  refundReason?: string;
}
export interface QuotesPostRequest {
  /**
   * Common ID between the FSPs for the quote object, decided by the Payer FSP. The ID should be reused for resends of the same quote for a transaction. A new ID should be generated for each new quote for a transaction.
   */
  quoteId: string;
  /**
   * Common ID (decided by the Payer FSP) between the FSPs for the future transaction object. The actual transaction will be created as part of a successful transfer process. The ID should be reused for resends of the same quote for a transaction. A new ID should be generated for each new quote for a transaction.
   */
  transactionId: string;
  /**
   * Identifies an optional previously-sent transaction request.
   */
  transactionRequestId?: string;
  /**
   * Information about the Payee in the proposed financial transaction.
   */
  payee: Party;
  /**
   * Information about the Payer in the proposed financial transaction.
   */
  payer: Party;
  /**
   * SEND for send amount, RECEIVE for receive amount.
   */
  amountType: string;
  /**
   * Depending on amountType. If SEND - The amount the Payer would like to send, that is, the amount that should be withdrawn from the Payer account including any fees. The amount is updated by each participating entity in the transaction. If RECEIVE - The amount the Payee should receive, that is, the amount that should be sent to the receiver exclusive any fees. The amount is not updated by any of the participating entities.
   */
  amount: Money;
  /**
   * The fees in the transaction. The fees element should be empty if fees should be non-disclosed. The fees element should be non-empty if fees should be disclosed.
   */
  fees?: Money;
  /**
   * Type of transaction for which the quote is requested.
   */
  transactionType: TransactionType;
  /**
   * Longitude and Latitude of the initiating Party. Can be used to detect fraud.
   */
  geoCode?: GeoCode;
  /**
   * A memo that will be attached to the transaction.
   */
  note?: string;
  /**
   * Expiration is optional. It can be set to get a quick failure in case the peer FSP takes too long to respond. Also, it may be beneficial for Consumer, Agent, and Merchant to know that their request has a time limit.
   */
  expiration?: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface QuotesIDPutResponse {
  /**
   * The amount of money that the Payee FSP should receive.
   */
  transferAmount: Money;
  /**
   * The amount of Money that the Payee should receive in the end-to-end transaction. Optional as the Payee FSP might not want to disclose any optional Payee fees.
   */
  payeeReceiveAmount?: Money;
  /**
   * Payee FSP’s part of the transaction fee.
   */
  payeeFspFee?: Money;
  /**
   * Transaction commission from the Payee FSP.
   */
  payeeFspCommission?: Money;
  /**
   * Date and time until when the quotation is valid and can be honored when used in the subsequent transaction.
   */
  expiration: string;
  /**
   * Longitude and Latitude of the Payee. Can be used to detect fraud.
   */
  geoCode?: GeoCode;
  /**
   * The ILP Packet that must be attached to the transfer by the Payer.
   */
  ilpPacket: string;
  /**
   * The condition that must be attached to the transfer by the Payer.
   */
  condition: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface PartyResult {
  /**
   * Party Id type, id, sub ID or type, and FSP Id.
   */
  partyId: PartyIdInfo;
  /**
   * If the Party failed to be added, error information should be provided. Otherwise, this parameter should be empty to indicate success.
   */
  errorInformation?: ErrorInformation;
}
export interface PartyPersonalInfo {
  /**
   * First, middle and last name for the Party.
   */
  complexName?: PartyComplexName;
  /**
   * Date of birth for the Party.
   */
  dateOfBirth?: string;
}
export interface PartyIdInfo {
  /**
   * Type of the identifier.
   */
  partyIdType: string;
  /**
   * An identifier for the Party.
   */
  partyIdentifier: string;
  /**
   * A sub-identifier or sub-type for the Party.
   */
  partySubIdOrType?: string;
  /**
   * FSP ID (if known)
   */
  fspId?: string;
}
export interface PartyComplexName {
  /**
   * Party’s first name.
   */
  firstName?: string;
  /**
   * Party’s middle name.
   */
  middleName?: string;
  /**
   * Party’s last name.
   */
  lastName?: string;
}
export interface Party {
  /**
   * Party Id type, id, sub ID or type, and FSP Id.
   */
  partyIdInfo: PartyIdInfo;
  /**
   * Used in the context of Payee Information, where the Payee happens to be a merchant accepting merchant payments.
   */
  merchantClassificationCode?: string;
  /**
   * Display name of the Party, could be a real name or a nick name.
   */
  name?: string;
  /**
   * Personal information used to verify identity of Party such as first, middle, last name and date of birth.
   */
  personalInfo?: PartyPersonalInfo;
}
export interface PartiesTypeIDPutResponse {
  /**
   * Information regarding the requested Party.
   */
  party: Party;
}
export interface ParticipantsTypeIDSubIDPostRequest {
  /**
   * FSP Identifier that the Party belongs to.
   */
  fspId: string;
  /**
   * Indicate that the provided Currency is supported by the Party.
   */
  currency?: string;
}
export interface ParticipantsTypeIDPutResponse {
  /**
   * FSP Identifier that the Party belongs to.
   */
  fspId?: string;
}
export interface ParticipantsPostRequest {
  /**
   * The ID of the request, decided by the client. Used for identification of the callback from the server.
   */
  requestId: string;
  /**
   * List of PartyIdInfo elements that the client would like to update or create FSP information about.
   */
  partyList: PartyIdInfo[];
  /**
   * Indicate that the provided Currency is supported by each PartyIdInfo in the list.
   */
  currency?: string;
}
export interface ParticipantsIDPutResponse {
  /**
   * List of PartyResult elements that were either created or failed to be created.
   */
  partyList: PartyResult[];
  /**
   * Indicate that the provided Currency was set to be supported by each successfully added PartyIdInfo.
   */
  currency?: string;
}
export interface Money {
  /**
   * Currency of the amount.
   */
  currency: string;
  /**
   * Amount of Money.
   */
  amount: string;
}
export interface IndividualTransferResult {
  /**
   * Identifies messages related to the same /transfers sequence.
   */
  transferId: string;
  /**
   * Fulfilment of the condition specified with the transaction. Note - Either fulfilment or errorInformation should be set, not both.
   */
  fulfilment?: string;
  /**
   * If transfer is REJECTED, error information may be provided. Note - Either fulfilment or errorInformation should be set, not both.
   */
  errorInformation?: ErrorInformation;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface IndividualTransfer {
  /**
   * Identifies messages related to the same /transfers sequence.
   */
  transferId: string;
  /**
   * Transaction amount to be sent.
   */
  transferAmount: Money;
  /**
   * ILP Packet containing the amount delivered to the Payee and the ILP Address of the Payee and any other end-to-end data.
   */
  ilpPacket: string;
  /**
   * Condition that must be fulfilled to commit the transfer.
   */
  condition: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface IndividualQuoteResult {
  /**
   * Identifies quote message.
   */
  quoteId: string;
  /**
   * Information about the Payee in the proposed financial transaction.
   */
  payee?: Party;
  /**
   * Amount that the Payee FSP should receive.
   */
  transferAmount?: Money;
  /**
   * Amount that the Payee should receive in the end-to-end transaction. Optional as the Payee FSP might not want to disclose any optional Payee fees.
   */
  payeeReceiveAmount?: Money;
  /**
   * Payee FSP’s part of the transaction fee.
   */
  payeeFspFee?: Money;
  /**
   * Transaction commission from the Payee FSP
   */
  payeeFspCommission?: Money;
  /**
   * The ILP Packet that must be attached to the transfer by the Payer.
   */
  ilpPacket?: string;
  /**
   * The condition that must be attached to the transfer by the Payer.
   */
  condition?: string;
  /**
   * Error code, category description. Note - receiveAmount, payeeFspFee, payeeFspCommission, expiration, ilpPacket, condition should not be set if errorInformation is set.
   */
  errorInformation?: ErrorInformation;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface IndividualQuote {
  /**
   * Identifies quote message.
   */
  quoteId: string;
  /**
   * Identifies transaction message.
   */
  transactionId: string;
  /**
   * Information about the Payee in the proposed financial transaction.
   */
  payee: Party;
  /**
   * SEND for sendAmount, RECEIVE for receiveAmount.
   */
  amountType: string;
  /**
   * Depending on amountType - If SEND - The amount the Payer would like to send, that is, the amount that should be withdrawn from the Payer account including any fees. The amount is updated by each participating entity in the transaction. If RECEIVE - The amount the Payee should receive, that is, the amount that should be sent to the receiver exclusive any fees. The amount is not updated by any of the participating entities.
   */
  amount: Money;
  /**
   * The fees in the transaction. The fees element should be empty if fees should be non-disclosed. The fees element should be non-empty if fees should be disclosed.
   */
  fees?: Money;
  /**
   * Type of transaction that the quote is requested for.
   */
  transactionType: TransactionType;
  /**
   * Memo that will be attached to the transaction.
   */
  note?: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface GeoCode {
  /**
   * Latitude of the Party.
   */
  latitude: string;
  /**
   * Longitude of the   Party.
   */
  longitude: string;
}
export interface ExtensionList {
  /**
   * Number of Extension elements
   */
  extension: Extension[];
}
export interface Extension {
  /**
   * Extension key.
   */
  key: string;
  /**
   * Extension value.
   */
  value: string;
}
export interface ErrorInformationResponse {
  errorInformation?: ErrorInformation;
}
export interface ErrorInformationObject {
  errorInformation: ErrorInformation;
}
export interface ErrorInformation {
  /**
   * Specific error number.
   */
  errorCode: string;
  /**
   * Error description string.
   */
  errorDescription: string;
  /**
   * Optional list of extensions, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface BulkTransfersPostRequest {
  /**
   * Common ID between the FSPs and the optional Switch for the bulk transfer object, decided by the Payer FSP. The ID should be reused for resends of the same bulk transfer. A new ID should be generated for each new bulk transfer.
   */
  bulkTransferId: string;
  /**
   * ID of the related bulk quote.
   */
  bulkQuoteId: string;
  /**
   * Payer FSP identifier.
   */
  payerFsp: string;
  /**
   * Payee FSP identifier.
   */
  payeeFsp: string;
  /**
   * List of IndividualTransfer elements.
   */
  individualTransfers: IndividualTransfer[];
  /**
   * Expiration time of the transfers.
   */
  expiration: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface BulkTransfersIDPutResponse {
  /**
   * Time and date when the bulk transaction was completed.
   */
  completedTimestamp?: string;
  /**
   * List of IndividualTransferResult elements.
   */
  individualTransferResults?: IndividualTransferResult[];
  /**
   * The state of the bulk transfer.
   */
  bulkTransferState: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface BulkQuotesPostRequest {
  /**
   * Common ID between the FSPs for the bulk quote object, decided by the Payer FSP. The ID should be reused for resends of the same bulk quote. A new ID should be generated for each new bulk quote.
   */
  bulkQuoteId: string;
  /**
   * Information about the Payer in the proposed financial transaction.
   */
  payer: Party;
  /**
   * Longitude and Latitude of the initiating Party. Can be used to detect fraud.
   */
  geoCode?: GeoCode;
  /**
   * Expiration is optional to let the Payee FSP know when a quote no longer needs to be returned.
   */
  expiration?: string;
  /**
   * List of quotes elements.
   */
  individualQuotes: IndividualQuote[];
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface BulkQuotesIDPutResponse {
  /**
   * Fees for each individual transaction, if any of them are charged per transaction.
   */
  individualQuoteResults?: IndividualQuoteResult[];
  /**
   * Date and time until when the quotation is valid and can be honored when used in the subsequent transaction request.
   */
  expiration: string;
  /**
   * Optional extension, specific to deployment.
   */
  extensionList?: ExtensionList;
}
export interface AuthorizationsIDPutResponse {
  /**
   * OTP or QR Code if entered, otherwise empty.
   */
  authenticationInfo?: AuthenticationInfo;
  /**
   * Enum containing response information; if the customer entered the authentication value, rejected the transaction, or requested a resend of the authentication value.
   */
  responseType: string;
}
export interface AuthenticationInfo {
  authentication: string;
  authenticationValue: string;
}
