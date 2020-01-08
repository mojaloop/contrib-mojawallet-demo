exports.up = function (knex) {
  return knex.schema
    .createTable('mojaTransactionRequest', function (table) {
      table.increments('id').primary()
      table.uuid('transactionRequestId')
      table.string('serializedRequest')
      table.string('transactionId')
      table.json('transactionType')
      table.json('payee')
      table.json('payer')
      table.json('amount')
      table.enum('state', ['RECEIVED', 'ACCEPTED', 'REJECTED'])
      table.boolean('valid')
    })

};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("mojaTransactionRequest")
};
