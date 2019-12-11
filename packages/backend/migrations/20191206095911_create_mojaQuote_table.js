
exports.up = function(knex) {
  return knex.schema
    .createTable('mojaQuote', function (table) {
       table.increments('id').primary()
       table.uuid('quoteId')
       table.uuid('transactionId')
       table.string('serializedQuote')
    })
};

exports.down = function(knex) {
  return knex.schema
      .dropTableIfExists("mojaQuote")
};
