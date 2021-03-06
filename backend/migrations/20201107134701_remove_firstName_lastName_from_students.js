const { tableStudents } = require('../src/models/student')

exports.up = function(knex, Promise) {
    return knex.schema.table(tableStudents, (table) => {
        table.dropUnique(['PhoneNumber', 'FirstName', 'LastName']);
        table.dropColumn('FirstName');
        table.dropColumn('LastName');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table(tableStudents, (table) => {
        table.text('FirstName').notNullable().defaultTo('')
        table.text('LastName').notNullable().defaultTo('')
        table.unique(['PhoneNumber', 'FirstName', 'LastName'])
    });
};
