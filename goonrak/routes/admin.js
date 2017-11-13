var express		= require('express');
var router		= express.Router();

var auth		= require('../general/user_auth.js');
var mysql		= require('mysql');
var db_config	= require('../config/db_config.js');
var connection	= mysql.createConnection(db_config);

var send_response = require('../general/response_manager.js').send_response;

/* get_user_list
 * - return list of guardian members
 *
 * GET parameters
 * - type
 *   - all or NOT GIVEN : return all users' data
 *   - member : return regular, ob members' data
 *   - regular : return regular members' data
 *   - ob : return ob members' data
 */
router.get('/get_user_list', async function(req, res, next){ 

	var session	= req.session;
	var type = req.query.type;

	// if type not given, set it to all
	if(!type){
		type = 'all';
	}

	// type is invalid
	if(['all', 'member', 'regular', 'ob'].indexOf(type) == -1){
		return send_response(res, 400, "Invalid type");
	}
	
	// not admin
	if(!session.username || !(await auth.validate_user_level(session, session.username, auth.ADMIN_LEVEL))){
		return send_response(res, 401, "Not admin");
	}

	var query = '';
	switch(type){
		case 'all'			: query = 'SELECT * FROM USER'; break;
		case 'member'		: query = 'SELECT * FROM USER WHERE is_club_member > 0 ORDER BY is_club_member'; break;
		case 'regular'		: query = 'SELECT * FROM USER WHERE is_club_member = 1'; break;
		case 'ob'			: query = 'SELECT * FROM USER WHERE is_club_member = 2'; break;
	}

	connection.query(query, function (err, rows, field){
		if(err) {
			return send_response(res, 500, "Internal server error");
		}

		if(rows && rows.length > 0) {
			return send_response(res, 200, "", rows);
		} else {
			return send_response(res, 500, "Internal server error");
		}
		
	});
});


/* edit_user_type
 *	- edit user level not_member, regular, ob
 *
 * POST form data
 *  - username : user to be changed
 * 	- type : member type that user will become
 * 		- basic : not a member
 * 		- regular : normal member
 * 		- ob : ob member
 */
router.post('/edit_user_type', async function(req, res, next){
	
	var session	= req.session;
	var username = req.body.username;
	var type = req.body.type;

	var member_types = {
		'basic': '0',
		'regular': '1',
		'ob': '2',
	}

	if(!type || !username){
		return send_response(res, 400, "Parameters not Given");
	}

	// type is invalid
	if(['basic', 'regular', 'ob'].indexOf(type) == -1){
		return send_response(res, 400, "Invalid type");
	}

	// not admin
	if(!session.username || !(await auth.validate_user_level(session, session.username, auth.ADMIN_LEVEL))){
		return send_response(res, 401, "Not admin");
	}

	var query = 'UPDATE USER SET is_club_member = ? WHERE username = ?';

	connection.query(query, [member_types[type], username], function (err, result){
		if(err) {
			return send_response(res, 500, "Internal server error");
		}

		return send_response(res, 200, "Successfully updated");
	});

});

/* delete_user
 *	- delete user
 *
 * POST form data
 *  - username : user to be deleted
 *
 */
router.post('/delete_user', async function(req, res, next){
	
	var session	= req.session;
	var username = req.body.username;

	if(!username){
		return send_response(res, 400, "Parameters not given");
	}

	// not admin
	if(!session.username || !(await auth.validate_user_level(session, session.username, auth.ADMIN_LEVEL))){
		return send_response(res, 401, "Not admin");
	}

	var query = "DELETE u, l FROM USER u, LOGIN l WHERE u.username=l.username AND u.username=?";

	connection.query(query, username, function (err, result){
		if(err) {
			console.log(err);
			return send_response(res, 500, "Internal server error");
		}

		return send_resopnse(res, 200, "Successfully deleted");
	});

});


module.exports = router;
