var express		= require('express');
var router		= express.Router();

var auth		= require('../general/auth.js');
var mysql		= require('mysql');
var db_config	= require('../config/db_config.js');
var connection	= mysql.createConnection(db_config);

var DEBUG		= true;

/* get_post
 * - validate user, and return post data
 * 
 * POST form data
 * - post_id
 * - category
 * - username
 */
router.post('/get_post', function(req, res, next){ 

	if(!req.body.post_id || !req.body.category || !req.body.username) {
		console.log("param not given");
		return res.sendStatus(404);
	}

	var session		= req.session;

	var post_id		= req.body.post_id;
	var category 	= req.body.category;
	var username	= req.body.username;
	if(DEBUG) {
		console.log();
		console.log("======= POST from data =======");
		console.log("id\t: " + id);
		console.log("category\t: " + category);
		console.log("username\t: " + username);
		console.log();
	}


	if(!auth.validate_user(session, username)) {
	
		console.log("validate_user failed");
		console.log();
		res.send("INVALID");
		return;

	} else {
		
		console.log("validate_user success");
		console.log();
		res.send("VALID");
		
	}

	connection.connect();

	var sql = 'SELECT * FROM POST WHERE post_id=? AND category=?';
	connection.query(sql, [post_id, category], function (err, rows, field){
		if(err) {
			throw err;
		}

		if(rows) {
			res.send(rows);
		} else {
			res.send("No such post");
		}
		
	});

	connection.end();
});


/* write_post
 * - validate user, add post data to db
 *
 * POST form data
 * - post title, data, category, ... ( check database schema )
 * - username
 */
router.post('/write_post', function(req, res, next){
	
	if(!req.body.post_title || !req.)
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
