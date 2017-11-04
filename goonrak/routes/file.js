var express		= require('express');
var router		= express.Router();

var multer = require('multer');
var fs = require('fs');
var upload_directory = "/srv/www/";

var auth		= require('../general/user_auth.js');
var mysql		= require('mysql');
var db_config	= require('../config/db_config.js');
var connection	= mysql.createConnection(db_config);

/* upload
 * - upload file 
 * 
 * POST form data
 * - file : 'upload_file'
 * - type : file is for 'post' or for 'problem'
 * - parent : where file belongs to, post_id if type is post, problem_id if type is problem
 * TODO: support post upload
 */
router.post('/upload', multer({ dest: upload_directory }).single('upload_file'), async function(req, res, next){ 

	if(!(req.file && req.body.parent && req.body.type)) {
		fs.unlinkSync(file.path);
		return res.status(401).json({"resultcode": 401, "message": "Parameters not given."});
	}

	var session			= req.session;
	var parent			= req.body.parent;
	var type			= req.body.type;
	var file			= req.file;

	// currently, only admin can upload file
	if(!await auth.validate_user_level(session, session.username, auth.ADMIN_LEVEL)){
		fs.unlinkSync(file.path);
		return res.status(403).json({"resultcode": 403, "message": "Not admin"});	
	}


	// TODO: not supported yet
	if(type == 'post'){
		fs.unlinkSync(file.path);
		return res.status(500).json({"resultcode": 500, "message": "Not supported yet"});
	}

	else if(type == 'problem'){
		connection.query('SELECT * FROM PROBLEM WHERE problem_id=?', [parent], function (err, rows, field){
			if(err) {
				fs.unlinkSync(file.path);
				throw err;
			}

			if(rows.length == 0) {
				fs.unlinkSync(file.path);
				res.status(401).json({"resultcode": 401, "message": "Problem/Post not exists"});
			}

			var param = [[type, session.username, parent, file.originalname, file.path, file.size]];
			connection.query('INSERT INTO ATTACHMENT (type, uploader, parent, filename, path, size) VALUES ?', [param], function(err, result){
				if(err){
					fs.unlinkSync(file.path);
					throw err;
				}

				return res.status(200).json({"resultcode": 200, "message": "Successfully uploaded"});
			});
		});
	}

	else {
		return res.status(401).json({"resultcode": 401, "message": "Invalid type"});
	}

});

/* download
 * 
 * type : post/problem
 * parent : post_id or problem_id
 * file : filename
 * TODO: support post download
 */
router.get('/download/:type/:parent/:file', async function(req, res, next){

	var type = req.params.type;
	var parent = req.params.parent;
	var file = req.params.file;

	console.log(type, parent, file);
	if(type == 'post'){
		return res.status(500).json({"resultcode": 500, "message": "Not supported yet"});
	}

	else if (type == 'problem'){
		connection.query('SELECT path FROM ATTACHMENT WHERE parent=? AND filename=?', [parent, file], function(err, rows, field){
			if(err){
				throw err;
			}

			// file not exists
			if(rows.length == 0){
				return res.status(400).json({"resultcode": 400, "message": "File not exists"});
			}

			fs.access(rows[0].path, function(err, fd){
				// server does not have the file ( error )
				if(err){
					return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
				}

				var file = rows[0].path;
				return res.download(file);
			});

		});
	}

	else {
		return res.status(400).json({"resultcode": 401, "message": "Invalid type"});
	}
});

module.exports = router;
