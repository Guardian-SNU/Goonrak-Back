const express = require('express');
const router = express.Router();

// const auth = require('../general/user_auth.js');
const crypto = require('crypto');
const mysql = require('mysql');
const db_config = require('../config/db_config.js');
const connection = mysql.createConnection(db_config);
const send_response = require('../general/response_manager.js').send_response;

router.get('/get_info', function(req, res, next) {
    const sess = req.session;
    let username = sess.username;

    connection.query('SELECT username, nickname, register_time, email, is_club_member, phone, realname FROM USER WHERE username=?', username, function(err, rows, field) {
        if (err) {
            console.log(err);
            return send_response(res, 500, 'Internal server error');
        }

        // check username uniqueness
        if (rows && rows.length == 1) {
            return send_response(res, 200, '', rows[0]);
        } else { // no matching username
            return send_response(res, 401, 'Wrong info');
        }
    });
});

router.post('/edit_info', function(req, res, next) {
    const sess = req.session;
    let username = sess.username;
    let password = req.body.password;
    let nickname = req.body.nickname;
    let phone = req.body.phone;

    if (!nickname) {
        return send_response(res, 400, 'Parameters not given');
    }

    connection.query('SELECT * FROM USER WHERE username=?', username, function(err, rows, field) {
        if (err) {
            console.log(err);
            return send_response(res, 500, 'Internal server error');
        }

        // check username uniqueness
        if (rows && rows.length == 1) {
            // update password
            if (!(password == null) && !(password.length == 0)) {
                connection.query('SELECT salt FROM LOGIN WHERE username=?', [username], function(err, rows, field) {
                    if (err) {
                        return send_response(res, 500, 'Internal server error');
                    }

                    if (rows && rows.length == 1) {
                        let salt = rows[0].salt;
                        let updated_pw = crypto.createHash('sha256').update(salt+password).digest('hex');

                        connection.query('UPDATE LOGIN SET password=? WHERE username=?', [updated_pw, username], function(err, result) {
                            if (err) {
                                return send_response(res, 500, 'Internal server error');
                            }

                            connection.query('UPDATE USER SET nickname=?, phone=? WHERE username=?', [nickname, phone, username], function(err, result) {
                                if (err) {
                                    return send_response(res, 500, 'Internal server error');
                                }

                                return send_response(res, 200, '');
                            });
                        });
                    } else {
                        return send_response(res, 401, 'Wrong info');
                    }
                });
            } else {
                connection.query('UPDATE USER SET nickname=?, phone=? WHERE username=?', [nickname, phone, username], function(err, result) {
                    if (err) {
                        return send_response(res, 500, 'Internal server error');
                    }

                    return send_response(res, 200, '');
                });
            }
        } else { // no matching username
            return send_response(res, 401, 'Wrong info');
        }
    });
});


module.exports = router;
