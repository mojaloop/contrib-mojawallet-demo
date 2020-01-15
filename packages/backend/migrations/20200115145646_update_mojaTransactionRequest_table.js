
exports.up = function(knex) {
  return knex.schema.table('mojaTransactionRequest', function (table) {
    table.dropColumn('valid')
  })
}

exports.down = function(knex) {
  return knex.schema.table('mojaTransactionRequest', function (table) {
    table.boolean('valid')
  })
}
