var express = require('express');
var router = express.Router();

var auth = require('../general/user_auth.js');
var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

var send_response	= require('../general/response_manager.js').send_response;
var board_auth	= require('../general/board_auth.js');

/* get_comments
 * - validate user, and return comments of the post
 * 
 * POST form data
 * - post_id
 */
router.post('/get_comments', async function(req, res, next){	
	var param = req.body.post_id;
	if(!param) {
		return send_response(res, 400, "Parameters not given");
	}

	var session	= req.session;
	var username	= session.username;
	var post_id	= req.body.post_id;
	var board = await get_board_from_post(post_id);
	if(board == -1) {
		return send_response(res, 400, "No such post");
	}
	
	var can_get = await board_auth.validate_read(session, username, board);

	if(can_get) {
		var get_comments = "SELECT comment_id, username, post_id, content, comment_time, is_reply, parent_comment_id FROM COMMENT WHERE post_id=?";
		var q_param	= [post_id];

		connection.query(get_comments, q_param, function(err, rows, fields) {
			if(err) {
				console.log(err);
				return send_response(res, 500, "Internal server error");
			}

			return send_response(res, 200, "", rows);			
		});

	} else {
		return send_response(res, 401, "User auth fail");
	}

});


/* write_comment
 * - validate user, add comment data to db
 *
 * POST form data
 * - post id, username, comment_data, ... ( check database schema )
 */
router.post('/write_comment', async function(req, res, next){
	var param = req.body.post_id && req.body.content && req.body.username;
	if(!param) {
		return send_response(res, 400, "Parameters not given");
	}

	var session     = req.session;
	var username    = req.body.username;
	var post_id     = req.body.post_id;
	var content     = req.body.content;
	
	var board	= await get_board_from_post(post_id);
	if(board == -1) {
		return send_status(res, 400, "No such post");
	}

	var can_write = await board_auth.validate_write(session, username, board);
	
	if(can_write) {
		var w_comment	= "INSERT INTO COMMENT (username, post_id, content, is_reply) VALUES ?";
		var q_param	= [[username, post_id, content, 0]];
	
		connection.query(w_comment, [q_param], function(err, result) {
			if(err) {
				console.log(err);
				return send_response(res, 500, "Internal server error");
			}
	
			return send_response(res, 200, "Write comment successful");
		});
	} else {
		return send_response(res, 401, "User auth fail");
	}
});


/* edit_comment
 * - validate user, fix comment data in db
 *
 * POST form data
 * - post id, username, comment_data, ... ( check datagbase schema )
 */
router.post('/edit_comment', async function(req, res, next){
	var param = (req.body.username != null) & (req.body.post_id != null) & (req.body.comment_id != null) & (req.body.content != null);
	if(!param) {
		console.log(req.body);
		return send_response(res, 400, "Parameters not given");
	}

	var session	= req.session;
	var username	= req.body.username;
	var post_id	= req.body.post_id;
	var comment_id	= req.body.comment_id;
	var content	= req.body.content;
	
	var board = await get_board_from_post(post_id);
	if(board == -1) {
		return send_response(res, 400, "No such post");
	}

	var can_edit	= await board_auth.validate_read(session, username, board);

	if(can_edit) {
		var g_comment	= "SELECT username FROM COMMENT WHERE comment_id=?"
		var g_param	= [comment_id];

		connection.query(g_comment, g_param, function(err, rows, fields) {
			if(err) {
				console.log(err);
				return send_response(res, 500, "Internal server error");
			}

			if(rows.length == 0) {
				return send_response(res, 400, "No such comment");
			}

            if(rows[0].post_id != post_id){
                return send_response(res, 400, "Wrong post id");
            }

			if(rows[0].username != username) {
				return send_response(res, 401, "User auth fail");
			}

			var e_comment	= "UPDATE COMMENT SET content=? WHERE comment_id=?";
			var e_param	= [content, comment_id];
	
			connection.query(e_comment, e_param, function(err, result) {
				if(err) {
					console.log(err);
					return send_status(res, 500, "Internal server error");
				}
	
				return send_response(res, 200, "Edit comment successful");
			});
		});
	
	} else {
		return send_response(res, 401, "User auth fail");
	}
});


/* delete_comment
 * - validate user, delete comment data from db
 *
 * POST form data
 * - post id,
 * - comment_id,
 * - username
 */
router.post('/delete_comment', async function(req, res, next){
 	var param = req.body.comment_id;
	if(!param) {
		return send_response(res, 400, "Parameters not given");
	}

	var session = req.session;
	var username	= req.body.username;
	var post_id	= req.body.post_id;
	var comment_id = req.body.comment_id;

	var board = await get_board_from_post(post_id);
	if(board == -1) {
		return send_response(res, 400, "No such post");
	}

	var can_delete = await board_auth.validate_read(session, username, board);

	if(can_delete) {
		var g_comment	= "SELECT username FROM COMMENT WHERE COMMENT_id=?";
		var g_param	= [comment_id];

		connection.query(g_comment, g_param, function(err, rows, fields) {
			if(err) {
				console.log(err);
				return send_response(res, 500, "Internal server error");
			}

			if(rows.length == 0) {
				return send_response(res, 400, "No such comment");
			}

            if(rows[0].post_id != post_id){
                return send_response(res, 400, "Wrong post id");
            }

			if(rows[0].username != username) {
				return send_response(res, 401, "User auth fail");
			}

			var d_comment	= "DELETE FROM COMMENT WHERE comment_id=?";
			var q_param	= [comment_id];
	
			connection.query(d_comment, q_param, function(err, result) {
				if(err) {
					console.log(err);
					return send_response(res, 500, "Internal server error");
				}
		
				return send_response(res, 200, "Delete comment successful");
			});
		});

	} else {
		return send_response(res, 401, "User auth fail");
	}

});

var get_board_from_post = function(post_id) {
	return new Promise(function(resolve, reject) {
		var query = "SELECT board FROM POST WHERE post_id=?";
		var param = [post_id];
		connection.query(query, param, function(err, rows, fields) {
			if(err) {
				console.log(err);
				return resolve(-1);
			}

			if(0 < rows.length) {
				return resolve(rows[0].board);
			} else {
				return resolve(-1);
			}
		});
	});
};

module.exports = router;
