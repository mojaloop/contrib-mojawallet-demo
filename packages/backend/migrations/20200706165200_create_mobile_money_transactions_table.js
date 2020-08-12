
exports.up = function(knex) {
  return knex.schema.createTable('mobileMoneyTransactions', function (table) {
    table.uuid('transactionReference').primary()
    table.string('amount')
    table.string('currency')
    table.string('type')
    table.string('debtorMSISDN')
    table.string('creditorMSISDN')
    table.string('creditorAccountId')
    table.string('oneTimeCode').nullable()
    table.string('transactionStatus')
    table.string('mojaTransactionId').nullable()
  })
};

exports.down = function(knex) {
  return knex.schema
      .dropTableIfExists("mobileMoneyTransactions")
};
