const express = require('express');
const router = express.Router();

const crypto = require('crypto');
const mysql = require('mysql');
const db_config = require('../config/db_config.js');
const connection = mysql.createConnection(db_config);

const email_auth = require('../general/email_auth.js');
const send_response = require('../general/response_manager.js').send_response;

/* login
 * - get username, password from user, authenticate it, and give sessions to user
 * POST form data
 * - username
 * - password
 */
router.post('/login', function(req, res, next) {
    let sess = req.session;
    let username = req.body.username;
    let password = req.body.password;

    // if required fields are not given
    if (!username || !password) {
        return send_response(res, 400, 'Parameters not given');
    }

    if (sess.username) {
        return send_response(res, 400, 'Already signed in');
    }

    connection.query('SELECT l.username, l.salt, l.password, u.email_auth FROM LOGIN l, USER u WHERE u.username=l.username AND l.username=?', username, function(err, rows, field) {
        if (err) {
            console.log(err);
            return send_response(res, 200, 'Internal server error');
        }

        // check username uniqueness
        if (rows && rows.length == 1) {
            let salt = rows[0].salt;
            let pw_hash = rows[0].password;
            let user_hash = crypto.createHash('sha256').update(salt + password).digest('hex');
            let email_auth = rows[0].email_auth;

            // correct password given
            if (!email_auth) {
                return send_response(res, 401, 'No email verification');
            }
            if (pw_hash == user_hash) {
                sess.username = username;
                return send_response(res, 200, 'Login successful');
            } else { // wrong password given
                return send_response(res, 401, 'Wrong info');
            }
        } else { // no matching username
            return send_response(res, 401, 'Wrong info');
        }
    });
});

/* logout
 * - remove sessions from user, and redirect to home directory
 *
 * POST form data
 */
router.post('/logout', function(req, res, next) {
    let sess=req.session;
    if (sess.username) {
        req.session.destroy(function(err) {
            if (err) {
                console.log(err);
                return send_response(res, 500, 'Internal server error');
            } else {
                res.status(301).redirect('/');
            }
        });
    } else {
        // better json?
        return send_response(res, 400, 'Not logged in');
    }
});

/* register
 * - register new user
 *
 * POST form data
 * - username, password, email, ... ( check database schema )
 */
router.post('/register', function(req, res, next) {
    // TODO : add captcha?
    const randomstring = function(length) {
        return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex')
            .slice(0, length);
    };

    let username=req.body.username;
    let password=req.body.password;
    let email=req.body.email;
    let nickname=req.body.nickname;
    let is_club_member=req.body.is_club_member==1;

    if (!username || !password || !email || !nickname) {
        return send_response(res, 400, 'Parameters not given');
    }

    let salt=randomstring(16);
    let password_hash = crypto.createHash('sha256').update(salt + password).digest('hex');

    let usertable_post = {};
    if (is_club_member==true) {
        let phone = req.body.phone;
        let real_name = req.body.real_name;

        if (!phone || !real_name) {
            return send_response(res, 400, 'Parameters not enough');
        }
        usertable_post = {
            username: username,
            nickname: nickname,
            email: email,
            is_club_member: 0,
            is_admin: 0,
            realname: real_name,
            phone: phone,
        };
    } else {
        usertable_post = {
            username: username,
            nickname: nickname,
            email: email,
            is_club_member: 0,
            is_admin: 0,
        };
    }
    let logintable_post={username: username, salt: salt, password: password_hash};

    connection.query('SELECT * FROM USER WHERE username=?', username, function(err, rows, field) {
        if (err) {
            console.log(err);
            return send_response(res, 500, 'Internal server error');
        }
        if (rows.length > 0) {
            return send_response(res, 400, 'Username exists');
        }

        connection.query('INSERT INTO USER SET ?', usertable_post, function(err, result) {
            if (err) {
                console.log(err);
                return send_response(res, 500, 'Internal server error');
            }

            connection.query('INSERT INTO LOGIN SET ?', logintable_post, function(err, result) {
                if (err) {
                    console.log(err);
                    return send_response(res, 400, 'Internal server error');
                }

                // successfully regiestered, send verification email
                email_auth.send_verification_email(username, email, res);
            });
        });
    });
});

/* activate
 *    - activate account ( validating email )
 *
 * GET parameters
 *     - username
 *     - token
 */
router.get('/activate', function(req, res, next) {
    let token = req.query.token;
    let username = req.query.username;
    email_auth.verify_token(username, token, res);
});

module.exports = router;
