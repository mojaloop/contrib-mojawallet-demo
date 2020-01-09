
exports.up = function(knex) {
  return knex.schema.table('mojaQuote', function (table) {
    table.text('quoteResponse')
  })
}

exports.down = function(knex) {
  return knex.schema.table('mojaQuote', function (table) {
    table.dropColumn('quoteResponse')
  })
}
