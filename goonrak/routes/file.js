const express = require('express');
const router = express.Router();

const multer = require('multer');
const fs = require('fs');
const upload_directory = '/srv/www/';

const auth = require('../general/user_auth.js');
const mysql = require('mysql');
const db_config = require('../config/db_config.js');
const connection = mysql.createConnection(db_config);

const send_response = require('../general/response_manager.js').send_response;

/* upload
 * - upload file
 *
 * POST form data
 * - file : 'upload_file'
 * - type : file is for 'post' or for 'problem'
 * - parent : where file belongs to, post_id if type is post, problem_id if type is problem
 * TODO: support post upload
 */
router.post('/upload', multer({dest: upload_directory}).single('upload_file'), async function(req, res, next) {
    if (!(req.file && req.body.parent && req.body.type)) {
        fs.unlinkSync(file.path);
        return send_response(res, 401, 'Parameters not given');
    }

    const session = req.session;
    let parent = req.body.parent;
    let type = req.body.type;
    let file = req.file;

    // currently, only admin can upload file
    if (!await auth.validate_user_level(session, session.username, auth.ADMIN_LEVEL)) {
        fs.unlinkSync(file.path);
        return send_response(res, 401, 'Not admin');
    }


    // TODO: not supported yet
    if (type == 'post') {
        fs.unlinkSync(file.path);
        return res.status(500).json({'resultcode': 500, 'message': 'Not supported yet'});
    } else if (type == 'problem') {
        connection.query('SELECT * FROM PROBLEM WHERE problem_id=?', [parent], function(err, rows, field) {
            if (err) {
                fs.unlinkSync(file.path);
                throw err;
            }

            if (rows.length == 0) {
                fs.unlinkSync(file.path);
                return send_response(res, 401, 'Problem/Post not exists');
            }

            const param = [[type, session.username, parent, file.originalname, file.path, file.size]];
            connection.query('INSERT INTO ATTACHMENT (type, uploader, parent, filename, path, size) VALUES ?', [param], function(err, result) {
                if (err) {
                    fs.unlinkSync(file.path);
                    throw err;
                }

                return send_response(res, 200, 'Successfully uploaded');
            });
        });
    } else {
        return send_response(res, 401, 'Invalid type');
    }
});

/* download
 *
 * type : post/problem
 * parent : post_id or problem_id
 * file : filename
 * TODO: support post download
 */
router.get('/download/:type/:parent/:file', async function(req, res, next) {
    let type = req.params.type;
    let parent = req.params.parent;
    let file = req.params.file;

    console.log(type, parent, file);
    if (type == 'post') {
        return res.status(500).json({'resultcode': 500, 'message': 'Not supported yet'});
    } else if (type == 'problem') {
        connection.query('SELECT path FROM ATTACHMENT WHERE parent=? AND filename=?', [parent, file], function(err, rows, field) {
            if (err) {
                throw err;
            }

            // file not exists
            if (rows.length == 0) {
                return send_response(res, 400, 'File not exists');
            }

            fs.access(rows[0].path, function(err, fd) {
                // server does not have the file ( error )
                if (err) {
                    return send_response(res, 500, 'Internal server error');
                }

                let file = rows[0].path;
                return res.download(file);
            });
        });
    } else {
        return send_response(res, 400, 'Invalid type');
    }
});

module.exports = router;
