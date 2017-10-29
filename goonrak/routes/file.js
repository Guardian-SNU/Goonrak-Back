var express		= require('express');
var router		= express.Router();

var multer = require('multer');
var upload_directory = "/src/www/";

var auth		= require('../general/auth.js');
var mysql		= require('mysql');
var db_config	= require('../config/db_config.js');
var connection	= mysql.createConnection(db_config);

/* upload_file
 * - upload file
 * 
 * POST form data
 * - file
 * - directory
 */
router.post('/upload_file', multer({ dest: upload_directory }).single('upload_file'), function(req, res, next){ 

	if(!req.file || !req.body.directory) {
		return res.status(401).json({"resultcode": 401, "message": "File or Parameter not given."});
	}

	var session		= req.session;
	var directory = req.body.direcotry;
	var file = req.file;

	if(!auth.validate_user(session, session.username)) {
		return res.status(404).json({"resultcode": 404, "message": "Not logged in"});
	}


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

});

router.get('/:directory/:filename',

module.exports = router;
