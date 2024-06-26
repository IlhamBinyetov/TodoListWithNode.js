const path = require("path");
require('dotenv').config({
    override: true,
    path: path.join(__dirname, '../development.env')
});
const { Pool } = require("pg");


const connectionString = `postgresql://${process.env.USER}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.PORT}/${process.env.DATABASE}`;
console.log(connectionString);

const pool = new Pool({
    connectionString: connectionString
    
});

console.log('pool ',pool);

module.exports = { pool };

