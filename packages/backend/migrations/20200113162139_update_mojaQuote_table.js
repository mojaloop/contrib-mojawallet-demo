
exports.up = function(knex) {
  return knex.schema.table('mojaQuote', function (table) {
    table.uuid('transactionRequestId')
    table.json('payee')
    table.json('payer')
    table.string('amountType')
    table.json('amount')
    table.json('fees')
    table.json('transactionType')
    table.dropColumn('quoteResponse')
  })
}

exports.down = function(knex) {
  return knex.schema.table('mojaQuote', function (table) {
    table.dropColumn('transactionRequestId')
    table.dropColumn('payee')
    table.dropColumn('payer')
    table.dropColumn('amountType')
    table.dropColumn('amount')
    table.dropColumn('fees')
    table.dropColumn('transactionType')
    table.text('quoteResponse')
  })
}
