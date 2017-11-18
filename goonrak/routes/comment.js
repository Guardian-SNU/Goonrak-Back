var express = require('express');
var router = express.Router();

var auth = require('../general/user_auth.js');
var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

var send_response	= require('../general/response_manager.js').send_response;

/* get_comments
 * - validate user, and return comments of the post
 * 
 * POST form data
 * - post_id
 */
router.post('/get_comments', function(req, res, next){	
	var param = req.body.post_id;
	if(!param) {
		return sent_response(res, 400, "Parameters not given");
	}
	
	var post_id	= req.body.post_id;

	console.log(req.body);

	var get_comments = "SELECT comment_id, username, post_id, content, comment_time, is_reply, parent_comment_id FROM COMMENT WHERE post_id=?";
	var q_param	= [post_id];

	connection.query(get_comments, q_param, function(err, rows, fields) {
		if(err) {
			console.log(err);
			return send_response(res, 500, "Internal server error");
		}

		if(0 < rows.length) {
			return send_response(res, 200, "", rows);			
		} else {
			return send_response(res, 400, "No such post");
		}
	});

});


/* write_comment
 * - validate user, add comment data to db
 *
 * POST form data
 * - post id, username, comment_data, ... ( check database schema )
 */
router.post('/write_comment', function(req, res, next){
	var param = req.body.post_id & (req.body.content != null);
	if(!param) {
		return send_response(res, 400, "Parameters not given");
	}

	var username	= req.body.username;
	var post_id	= req.body.post_id;
	var content	= req.body.content;
	
	console.log(req.body);

	var w_comment	= "INSERT INTO COMMENT (username, post_id, content, is_reply) VALUES ?";
	var q_param	= [[username, post_id, content, 0]];

	connection.query(w_comment, [q_param], function(err, result) {
		if(err) {
			console.log(err);
			return send_response(res, 500, "Internal server error");
		}

		return send_response(res, 200, "Write comment successful");
	});

});


/* edit_comment
 * - validate user, fix comment data in db
 *
 * POST form data
 * - post id, username, comment_data, ... ( check datagbase schema )
 */
router.post('/edit_comment', function(req, res, next){
	var param = req.body.comment_id & (req.body.content != null);
	if(!param) {
		return send_response(res, 400, "Parameters not given");
	}

	var comment_id	= req.body.comment_id;
	var content	= req.body.content;

	var e_comment	= "UPDATE COMMENT SET content=? WHERE comment_id=?";
	var q_param	= [content, comment_id];

	connection.query(e_comment, q_param, function(err, result) {
		if(err) {
			console.log(err);
			return send_status(res, 500, "Internal server error");
		}

		return send_response(res, 200, "Edit comment successful");
	});

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
 	var param = req.body.comment_id;
	if(!param) {
		return send_response(res, 400, "Parameters not given");
	}

	var comment_id = req.body.comment_id;

	var d_comment	= "DELETE FROM COMMENT WHERE comment_id=?";
	var q_param	= [[comment_id]];

	connection.query(d_comment, [q_param], function(err, result) {
		if(err) {
			console.log(err);
			return send_response(res, 500, "Internal server error");
		}

		return send_response(res, 200, "Delete comment successful");
	});

});

module.exports = router;
