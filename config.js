const dotenv = require('dotenv');
//const assert = require('assert');

dotenv.config();

const {HOST,HOST_URL,SQL_USER,SQL_PASSWORD,SQL_DATABASE,SQL_SERVER} = process.env;

const sqlEncrypt = process.env.ENCRYPT === "true";

//assert(PORT, 'PORT is Required');
//assert(HOST, 'HOST is Required');

module.exports = {
    port : 8080,
    host : '127.0.0.1',
    url : 'http://localhost:8080',
    sql: {
        server: '34.122.183.198',
        database: 'db_srizon',
        user: 'sqlServer',
        password: 'Admin@srizon1',
        options: {
            encrypt: sqlEncrypt,
            "trustServerCertificate": true,
            port: 1433
        }
    }
}