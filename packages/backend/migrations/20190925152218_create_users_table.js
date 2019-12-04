
exports.up = function (knex, Promise) {
  return knex.schema
    .createTable('users', function (table) {
      table.increments('id').unsigned().primary()
      table.string('username').unique()
      table.string('password')
    })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTableIfExists('users')
}
