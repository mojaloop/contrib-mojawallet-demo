
exports.up = function (knex, Promise) {
    return knex.schema
        .createTable('signupSessions', function (table) {
            table.string('id').primary()
            table.string('userId').unique().notNullable()
            table.integer('expiresAt').notNullable()
        })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTableIfExists('signupSessions')
}
