var express = require('express');
var router = express.Router();

var auth = require('../general/auth.js');
var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

/* get_post
 * - validate user, and return post data
 * 
 * POST form data
 * - id
 * - category
 * - username
 */
router.post('/get_post', function(req, res, next){	
	// TODO : implement
});


/* write_post
 * - validate user, add post data to db
 *
 * POST form data
 * - post title, data, category, ... ( check database schema )
 * - username
 */
router.post('/write_post', function(req, res, next){
	// TODO : implement
});


/* edit_post
 * - validate user, fix post data in db
 *
 * POST form data
 * - post title, data, category, ... ( check datagbase schema )
 * - username
 */
router.post('/edit_post', function(req, res, next){
	// TODO : implement
});


/* delete_post
 * - validate user, delete post data from db
 *
 * POST form data
 * - post id,
 * - username
 */
router.post('/delete_post', function(req, res, next){
 	// TODO : implement
});

module.exports = router;
