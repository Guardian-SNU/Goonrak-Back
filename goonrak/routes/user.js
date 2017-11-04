var express = require('express');
var router = express.Router();

var auth = require('../general/user_auth.js');
var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

/* get_info
 * - validate user, and return user info
 *
 * GET parameter
 * - username
 */
router.get('/get_info', function(req, res, next){	
	// TODO : implement
});


/* edit_info
 * - validate user, fix user data in db
 *
 * POST form data
 * - nickname, password, phone
 * - username
 */
router.post('/edit_info', function(req, res, next){
	// TODO : implement
});

/* get_problem_list
 * - get problems that user solved, challenged
 *
 * POST form data
 * - username
 */
router.post('/get_problem_list', function(req, res, next){
	// TODO : implement
});

module.exports = router;
