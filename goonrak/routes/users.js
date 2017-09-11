var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

/* GET users listing. */
router.get('/', function(req, res, next) {

	connection.query('SELECT * FROM test', function(err, rows, field){

		if(err) console.log(err);

		console.log('db func', rows);
		res.send(rows);
	});

  //res.send('respond with a resource');
});

module.exports = router;
