var express		= require('express');
var router		= express.Router();

var auth		= require('../general/auth.js');
var mysql		= require('mysql');
var db_config	= require('../config/db_config.js');
var connection	= mysql.createConnection(db_config);

var board_auth	= require('./board_auth.js');

/* get_post
 * - validate user, and return post data
 * 
 * POST form data
 * - post_id
 * - category
 * - username
 */
router.post('/get_post', function (req, res, next) { 

	var param = req.body.username & req.body.board & req.body.post_id;
	if (!param) {
		console.log("param not given");
		return res.sendStatus(404);
	}


	var session	= req.session;
	var username	= req.body.username;
	var board	= req.body.board;
	var post_id	= req.body.post_id;

	var can_get	= board_auth.validate_read(session, username, board);

	//connection.connect();

	if (can_get) {
		var get_post	= "SELECT * FROM POST WHERE board=? AND post_id=?";
		var q_param	= [board, post_id];

		connection.query(get_post, q_param, function (err, rows, fields) {
			if(err) {
				throw err;
			}

			if(rows) {
				res.send(rows);
				return res.sendStatus(200);
			} else {
				res.send("NO POST");
				return res.sendStatus(404);
			}
		});
	} else {
		res.send("NO AUTH");
		return res.sendStatus(404);
	}

	//connection.end();

});


/* write_post
 * - validate user, add post data to db
 *
 * POST form data
 * -  
 * - username
 */
router.post('/write_post', function(req, res, next){
	
	var param = req.body.username & req.body.board & req.body.title & req.body.content; 
	if (!param) {
		console.log("param not given");
		return res.sendStatus(404);
	}

	var session	= req.session;
	var username	= req.body.username;
	var board	= req.body.board;
	var title	= req.body.title;
	var content	= req.body.content;

	var can_write	= board_auth.validate_write(session, username, board);
	
	//connection.connect();
	if (can_write) {
		var write_post = "INSERT INTO POST (user_id, username, board, title, content, hit) VALUES ?";
		var	q_param	= [[NULL, username, board, title, content, 0]];

		connection.query(write_post, [q_param], function (err, result) {
			if(err) {
				throw err;
			}

			console.log(result);
			return res.sendStatus(200);
		});
	} else {
		res.send("NO AUTH");
		return res.sendStatus(404);
	}

	//connection.end();

});


/* edit_post
 * - validate user, fix post data in db
 *
 * POST form data
 * - post title, data, category, ... ( check datagbase schema )
 * - username
 */
router.post('/edit_post', function(req, res, next){
	
	var param = req.body.username & req.body.board & req.body.post_id & req.body.content;
	if (!param) {
		console.log("param not given");
		return res.sendStatus(404);
	}

	var session	= req.session;
	var username	= req.body.username;
	var board	= req.body.board;
	var post_id	= req.body.post_id;
	var content	= req.body.content;

	var can_edit	= board_auth.validate_write(session, username, board);
	var post_exists	= false;

	//connection.connect();
	if (can_edit) {
		var check	= "SELECT * FROM POST WHERE board=? AND post_id=?";
		var c_param	= [board, post_id];

		connection.query(check, c_param, function (err, rows, fields) {
			if (err) {
				throw err;
			}

			if (rows) {
				post_exists = true;
			} else {
				post_exists = false;
			}
		});

	} else {
		res.send("NO AUTH");
		return res.sendStatus(404);
	}


	if (post_exists) {
		var edit_post	= "UPDATE POST SET content=? WHERE board=? AND post_id=?";
		var e_param	= [content, board, post_id];

		connection.query(edit_post, e_param, function (err, rows, fields) {
			if(err) {
				throw err;
			}

			return res.sendStatus(404);
		});

	} else {
		res.send("NO POST");
		return res.sendStatus(404);
	}
	
	//connection.end();

});


/* delete_post
 * - validate user, delete post data from db
 *
 * POST form data
 * - post id,
 * - username
 */
router.post('/delete_post', function(req, res, next){
 	
	var param = req.body.username & req.body.board & req.body.post_id;
	if(!param) {
		console.log("param not given");
		return res.sendStatus(404);
	}

	var session	= req.session;
	var username	= req.body.username;
	var board	= req.body.board;
	var post_id	= req.body.post_id;

	var can_delete	= board_auth.validate_write(session, username, board);
	var post_exists	= false;

	//connection.connect();
	if (can_delete) {
		var check	= "SELECT * FROM POST WHERE board=? AND post_id=?";
		var c_param	= [board, post_id];

		connection.query(check, c_param, function (err, rows, fields) {
			if(err) {
				throw err;
			}

			if(rows) {
				post_exists = true;
			} else {
				post_exists = false;
			}
		});
	} else {
		res.send("NO AUTH");
		return res.sendStatus(404);
	}


	if (post_exists) {
		var delete_post	= "DELETE FROM POST WHERE board=? AND post_id=?";
		var d_param	= [];

		connection.query(delete_post, d_param, function (err, result) {
			if(err) {
				throw err;
			}

			res.sendStaus(200);
		});

	} else {
		res.send("NO POST");
		return res.sendStatus(404);
	}

	//connection.end();

});

module.exports = router;
