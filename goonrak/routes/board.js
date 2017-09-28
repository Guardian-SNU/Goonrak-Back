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

	if(!req.body.post_id || !req.body.board || !req.body.username) {
		console.log("param not given");
		return res.sendStatus(404);
	}

	var session		= req.session;

	var post_id		= req.body.post_id;
	var board	 	= req.body.board;
	var username	= req.body.username;
	if(DEBUG) {
		console.log();
		console.log("======= POST from data =======");
		console.log("id\t: " + id);
		console.log("board\t: " + board);
		console.log("username\t: " + username);
		console.log();
	}


	if(!auth.validate_user(session, username)) {
	
		console.log("validate_user fail");
		return res.sendStatus(404);

	} else {
		
		console.log("validate_user succ");
		
	}

	connection.connect();

	var sql = 'SELECT * FROM POST WHERE post_id=? AND board=?';
	connection.query(sql, [post_id, board], function (err, rows, field){
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
 * -  
 * - username
 */
router.post('/write_post', function(req, res, next){
	
	var param = req.body.board & req.body.title & req.body.content & req.body.username; 
	if(!param) {
		console.log("param not given");
		returen res.sendStatus(404);
	}

	var session	= req.session;

	var board		= req.body.board;
	var title		= req.body.title;
	var content		= req.body.content;
	var username 	= req.body.username;

	if(!auth.validate_user(session, username)) {
		
		console.log("validate_user fail");
		return res.sendStatus(404);
	
	} else {

		console.log("validate_user succ");

	}

	connection.connect();

	var insert = 'INSERT INTO POST (user_id, username, board, title, content, hit) VALUES ?';
	var values = [NULL, username, board, title, content, 0];
	connection.query(insert, [values], function (err, result){
		if(err) {
			throw err;
		}
		console.log(result);
	});

	connection.end();
});


/* edit_post
 * - validate user, fix post data in db
 *
 * POST form data
 * - post title, data, category, ... ( check datagbase schema )
 * - username
 */
router.post('/edit_post', function(req, res, next){
	
	var param = req.body.board & req.body.post_id & req.body.content & req.body.username;
	if(!param) {
		console.log("param not given");
		return res.sendStatus(404);
	}

	var session = req.session;

	var board		= req.body.board;
	var post_id		= req.body.post_id;
	var content		= req.body.content;
	var username	= req.body.username;

	if(!auth.validate_user(session, username)) {

		console.log("validate_user fail");
		return res.sendStatus(404);
	
	} else {

		console.log("validate_user succ");
	
	}

	connection.connect();

	var post_exists;
	var check 	= 'SELECT * FROM POST WHERE post_id=? AND board=?';
	var update 	= 'UPDATE POST SET content=? WHERE post_id=? AND board=?';
	
	connection.query(check, [post_id, board], function (err, rows, field) {
		if(err) {
			throw err;
		}

		if(rows) {
			post_exists = true;
		} else {
			post_exists = false;
			console.log("no such post");

			connection.end();
			return res.sendStatus(404);
		}
	});

	
	if(post_exists)
	connection.query(update, [content, post_id, board], function (err, result) {
		if(err) {
			throw err;
		}
	});

	connection.end()
});


/* delete_post
 * - validate user, delete post data from db
 *
 * POST form data
 * - post id,
 * - username
 */
router.post('/delete_post', function(req, res, next){
 	var param = req.body.board & req.body.post_id & req.body.username;
	if(!param) {
		console.log("param not given");
		return res.sendStatus(404);
	}

	var session = req.session;

	var board		= req.body.board;
	var post_id		= req.body.post_id;
	var username	= req.body.username;

	if(!auth.validate_user(session, username) {
		console.log("validate_user fail");
		return res.sendStatus(404);
	} else {
		console.log("validate_user succ");
	}

	connection.connect();

	var post_exists
	var check 	= 'SELECT * FROM POST WHERE board=? AND post_id=?';
	var delete	= 'DELETE FROM POST WHERE board=? AND post_id=?';
	
	connection.query(check, [board, post_id], function (err, rows, field) {
		if(err) {
			throw err;
		}
		
		if(rows) {
			post_exists = true;
		} else {
			post_exists = false;
			console.log("no such post");
			
			connection.end();
			return res.sendStatus(404);
		}
	});

	if(post_exists)
	connection.query(delete, [board, post_id], function (err, result) {
		if(err) {
			throw err;
		}
	});

	connection.end();
});

module.exports = router;
