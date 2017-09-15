var express = require('express');
var session = require('express-session');
var router = express.Router();

var auth = require('../general/auth.js');
var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

/* GET users listing. */
router.get('/', function(req, res, next) {

	// test
	console.log(auth.validate_login(req.session));
	req.session.login = true;
	console.log(auth.validate_login(req.session));
  res.send('respond with a resource');
});

module.exports = router;
