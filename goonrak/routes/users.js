var express = require('express');
var session = require('express-session');
var router = express.Router();

var auth = require('../general/auth.js');
var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var email = require('../general/email_auth.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
	// test2
	email.send_verification_email('1', 'highnoo70@gmail.com', res);
	//email.verify_token('1', '519', res);
});

module.exports = router;
