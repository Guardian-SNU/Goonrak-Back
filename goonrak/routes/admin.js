var express		= require('express');
var router		= express.Router();

var auth		= require('../general/auth.js');
var mysql		= require('mysql');
var db_config	= require('../config/db_config.js');
var connection	= mysql.createConnection(db_config);

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
router.get('/get_user_list', function(req, res, next){ 

	var session	= req.session;
	var type = req.query.type;

	// if type not given, set it to all
	if(!type){
		type = 'all';
	}

	// type is invalid
	if(['all', 'member', 'regular', 'ob'].indexOf(type) == -1){
		return res.status(400).json({"resultcode": 400, "message": "Invalid type"});
	}
	/*
	// not admin
	if(!session.username || !auth.validate_user_level(session, session.username, 2)){
		return res.status(401).json({"resultcode": 401, "message": "Not admin"});
	}
	*/

	var sql = '';
	switch(type){
		case 'all'		: sql = 'SELECT * FROM USER'; break;
		case 'member'	: sql = 'SELECT * FROM USER WHERE is_club_member > 0 ORDER BY is_club_member'; break;
		case 'regular': sql = 'SELECT * FROM USER WHERE is_club_member = 1'; break;
		case 'ob'			: sql = 'SELECT * FROM USER WHERE is_club_member = 2'; break;
	}

	connection.query(sql, function (err, rows, field){
		if(err) {
			return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
		}

		if(rows) {
			return res.status(200).json({"resultcode": 200, "data": rows});
		} else {
			return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
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
router.post('/edit_user_type', function(req, res, next){
	
	var session	= req.session;
	var username = req.body.username;
	var type = req.body.type;

	var member_types = {
		'basic': '0',
		'regular': '1',
		'ob': '2',
	}

	if(!type || !username){
		res.status(400).json({"resultcode": 400, "message": "Parameters not Given"});
	}

	// type is invalid
	if(['basic', 'regular', 'ob'].indexOf(type) == -1){
		return res.status(400).json({"resultcode": 400, "message": "Invalid type"});
	}

	/*
	// not admin
	if(!session.username || !auth.validate_user_level(session, session.username, 2)){
		return res.status(401).json({"resultcode": 401, "message": "Not admin"});
	}
	*/

	var sql = 'update USER set is_club_member = ? where username = ?';

	connection.query(sql, [member_types[type], username], function (err, rows, field){
		if(err) {
			return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
		}

		if(rows) {
			return res.status(200).json({"resultcode": 200, "message": "successfully updated"});
		} else {
			return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
		}
		
	});

});

module.exports = router;
