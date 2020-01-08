exports.up = function (knex) {
  return knex.schema
    .createTable('mojaTransactions', function (table) {
      table.uuid('id').primary()
      table.timestamps()
    })

};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("mojaTransactions")
};
