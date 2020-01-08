
exports.up = function(knex) {
  return knex.schema.table('mojaTransactionRequest', function (table) {
    table.integer('userId')
  })
}

exports.down = function(knex) {
  return knex.schema.table('mojaTransactionRequest', function (table) {
    table.dropColumn('userId')
  })
}
