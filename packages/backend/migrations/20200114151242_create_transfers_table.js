
exports.up = function(knex) {
  return knex.schema
    .createTable('transfers', function (table) {
       table.increments('id').primary()
       table.uuid('transferId')
       table.uuid('quoteId')
       table.uuid('transactionId')
       table.uuid('transactionRequestId')
       table.text('response')
       table.text('error')
    })
};

exports.down = function(knex) {
  return knex.schema
      .dropTableIfExists("transfers")
};
