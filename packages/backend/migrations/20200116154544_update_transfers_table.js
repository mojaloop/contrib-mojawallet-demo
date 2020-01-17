
exports.up = function(knex) {
  return knex.schema.table('transfers', function (table) {
    table.string('accountId')
    table.boolean('isReverted')
  })
}

exports.down = function(knex) {
  return knex.schema.table('transfers', function (table) {
    table.dropColumn('accountId')
    table.dropColumn('isReverted')
  })
}
