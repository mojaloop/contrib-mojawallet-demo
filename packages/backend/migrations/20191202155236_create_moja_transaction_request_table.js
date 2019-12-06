
exports.up = function(knex) {
  return knex.schema
    .createTable('mojaTransactionRequest', function (table) {
       table.increments('id').primary()
       table.uuid('transactionRequestId')
       table.string('serializedRequest')
       table.boolean('valid')
    })
  
};

exports.down = function(knex) {
  return knex.schema
      .dropTableIfExists("mojaTransactionRequest")
};
