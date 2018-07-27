var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'AdamTest',
    password : 'AdamTest',
    database : 'SecurityTheoryMap'
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;
