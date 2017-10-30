var express = require('express');
var router = express.Router();

var auth = require('../general/auth.js');
var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

/* get_comments
 * - validate user, and return comments of the post
 * 
 * POST form data
 * - post_id
 * - username
 */
router.post('/get_comments', function(req, res, next){	
	// TODO : implement
});


/* write_comment
 * - validate user, add comment data to db
 *
 * POST form data
 * - post id, username, comment_data, ... ( check database schema )
 */
router.post('/write_comment', function(req, res, next){
	// TODO : implement
});


/* edit_comment
 * - validate user, fix comment data in db
 *
 * POST form data
 * - post id, username, comment_data, ... ( check datagbase schema )
 */
router.post('/edit_comment', function(req, res, next){
	// TODO : implement
});


/* delete_comment
 * - validate user, delete comment data from db
 *
 * POST form data
 * - post id,
 * - comment_id,
 * - username
 */
router.post('/delete_comment', function(req, res, next){
 	// TODO : implement
});

module.exports = router;
