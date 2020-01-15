
exports.up = function(knex) {
  return knex.schema
    .createTable('mojaQuotesResponse', function (table) {
       table.increments('id').primary()
       table.uuid('quoteId')
       table.json('transferAmount')
       table.datetime('expiration')
       table.text('ilpPacket')
       table.text('condition')
       table.json('error')
    })
};

exports.down = function(knex) {
  return knex.schema
      .dropTableIfExists("mojaQuotesResponse")
};
