
exports.up = function(knex) {
  return knex.schema
    .createTable('mojaOtp', function (table) {
      table.increments('id').primary()
      table.string('userId').notNullable()
      table.integer('accountId').notNullable()
      table.string('otp').notNullable()
      table.boolean('isUsed').notNullable()
      table.integer('expiresAt').notNullable()
    })
}

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('mojaOtp')
}
