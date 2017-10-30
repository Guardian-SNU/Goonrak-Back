var express	= require('express');
var router	= express.Router();

var auth	= require('../general/auth.js');
var mysql	= require('mysql');
var db_config	= require('../config/db_config.js');
var connection	= mysql.createConnection(db_config);

var board_auth	= require('../general/board_auth.js');

/* get_post
 * - validate user, and return post data
 * 
 * GET parameters
 * - id
 * - board
 */
router.get('/get_post', async function (req, res, next) { 

	var param = req.query.id && req.query.board;
	if (!param) {
		return res.status(400).json({"resultcode": 400, "message": "Parameters not Given"});
	}

	var session		= req.session;
	var username	= session.username;
	var board		= req.query.board;
	var post_id		= req.query.id;

	var can_get	= await board_auth.validate_read(session, username, board);
	if (can_get) {
		var get_post = "SELECT post_id, username, board, title, content, post_time, hit FROM POST WHERE board=? AND post_id=?";
		var q_param	= [board, post_id];

		connection.query(get_post, q_param, function (err, rows, fields) {
			if(err) {
				//throw err;
				console.log(err);
				return res.status(500).json({"resultcode": 500, "message": "Internal Server Error"});
			}

			if(rows.length > 0) {
				return res.status(200).json({"resultcode": 200, "data": rows});
			} else {
				return res.status(400).json({"resultcode": 400, "message": "No Such Post"});
			}
		});
	} else {
		return res.status(401).json({"resultcode": 401, "message": "User Auth Fail"});
	}
});


/* write_post
 * - validate user, add post data to db
 *
 * POST form data 
 * - username
 * - board
 * - title
 * - content
 */
router.post('/write_post', async function(req, res, next){
	
	var param = req.body.username && req.body.board && req.body.title && req.body.content; 
	if (!param) {
		return res.status(400).json({"resultcode": 400, "message": "Parameters not Given"});
	}

	var session		= req.session;
	var username	= req.body.username;
	var board		= req.body.board;
	var title		= req.body.title;
	var content		= req.body.content;

	var can_write	= await board_auth.validate_write(session, username, board);
	
	if (can_write) {
		var write_post = "INSERT INTO POST (username, board, title, content, hit) VALUES ?";
		var	q_param	= [[username, board, title, content, 0]];

		connection.query(write_post, [q_param], function (err, result) {
			if(err) {
				//throw err;
				console.log(err);
				return res.status(500).json({"resultcode": 500, "message": "Internal Server Error"});
			}

			return res.status(200).json({"resultcode": 200, "message": "Write Post Successful"});
		});
	} else {
		return res.status(401).json({"resultcode": 401, "message": "User Auth Fail"});
	}

});


/* edit_post
 * - validate user, fix post data in db
 *
 * POST form data
 * - post title, data, category, ... ( check datagbase schema )
 * - username
 */
router.post('/edit_post', async function(req, res, next){
	
	var param = req.body.username && req.body.board && req.body.post_id && req.body.content;
	if (!param) {
		return res.status(400).json({"resultcode": 400, "message": "Parameters not Given"});
	}

	var session		= req.session;
	var username	= req.body.username;
	var board		= req.body.board;
	var post_id		= req.body.post_id;
	var title		= req.body.title;
	var content		= req.body.content;

	var can_edit	= await board_auth.validate_write(session, username, board);

	if (can_edit) {
		var check	= "SELECT * FROM POST WHERE board=? AND post_id=?";
		var c_param	= [board, post_id];

		connection.query(check, c_param, function (err, rows, fields) {
			if (err) {
				//throw err;
				console.log(err);
				return res.status(500).json({"resultcode": 500, "message": "Internal Server Error"});
			}

			// No matching post
			if (rows.length == 0) {
				return res.status(400).json({"resultcode": 400, "message": "No Such Post"});
			}

			// Not the post that user wrote
			if (rows[0].username != username){
				return res.status(401).json({"resultcode": 401, "message": "No Authority to Edit"});
			}

			var edit_post	= "UPDATE POST SET title=?, content=? WHERE board=? AND post_id=?";
			var e_param	= [title, content, board, post_id];

			connection.query(edit_post, e_param, function (err, rows, fields) {
				if(err) {
					//throw err;
					console.log(err);
					return res.status(500).json({"resultcode": 500, "message": "Internal Server Error"});
				}

				return res.status(200).json({"resultcode": 200, "message": "Edit Post Successful"});
			});
		});

	} else {
		return res.status(401).json({"resultcode": 401, "message": "User Auth Fail"});
	}

});


/* delete_post
 * - validate user, delete post data from db
 *
 * POST form data
 * - post id,
 * - username
 * - board
 */
router.post('/delete_post', async function(req, res, next){
 	
	var param = req.body.username && req.body.board && req.body.post_id;
	if(!param) {
		return res.status(400).json({"resultcode": 400, "message": "Parameters not Given"});
	}

	var session		= req.session;
	var username	= req.body.username;
	var board		= req.body.board;
	var post_id		= req.body.post_id;

	var can_delete	= await board_auth.validate_write(session, username, board);

	if (can_delete) {
		var check	= "SELECT * FROM POST WHERE board=? AND post_id=?";
		var c_param	= [board, post_id];

		connection.query(check, c_param, async function (err, rows, fields) {
			if(err) {
				//throw err;
				console.log(err);
				return res.status(500).json({"resultcode": 500, "message": "Internal Server Error"});
			}

			// No matching post
			if(rows.length == 0) {	
				return res.status(400).json({"resultcode": 400, "message": "No Such Post"});
			}

			// Not the user wrote and user is not admin
			if(rows[0].username != username && !(await auth.validate_user_level(session, username, auth.ADMIN_LEVEL))){	
				return res.status(401).json({"resultcode": 401, "message": "No Authority to Edit"});
			}

			var delete_post	= "DELETE FROM POST WHERE board=? AND post_id=?";
			var d_param	= [board, post_id];

			connection.query(delete_post, d_param, function (err, result) {
				
				if(err) {
					//throw err;
					console.log(err);
					return res.status(500).json({"resultcode": 500, "message": "Internal Server Error"});
				}

				return res.status(200).json({"resultcode": 200, "message": "Delete Post Successful"});
			});
		});

	} else {
		return res.status(403).json({"resultcode": 403, "message": "User Auth Fail"});
	}
});

module.exports = router;
