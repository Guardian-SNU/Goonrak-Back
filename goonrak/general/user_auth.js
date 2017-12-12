const mysql = require('mysql');
const Promise = require('promise');
const db_config = require('../config/db_config.js');
const connection = mysql.createConnection(db_config);

const USER_LEVEL = 0;
const MEMBER_LEVEL = 1;
const ADMIN_LEVEL = 2;

// check user is logged in
const validate_login = async function(session) {
    let login = session.login;

    return new Promise(function(resolve, reject) {
        if (login) {
            return resolve(true);
        } else {
            return resolve(false);
        }
    });
};

// check user's username
const validate_user = async function(session, username) {
    let user = session.username;

    return new Promise(function(resolve, reject) {
        if (user && user === username) {
            return resolve(true);
        } else {
            return resolve(false);
        }
    });
};

// check user's level
const validate_user_level = async function(session, username, level) {
    return new Promise(async function(resolve, reject) {
        // if username is wrong, return false
        if (!await validate_user(session, username)) {
            return resolve(false);
        }

        // if level is USER_LEVEL ( open to all ) return true
        if (level == USER_LEVEL) {
            return resolve(true);
        }

        connection.query('SELECT is_club_member, is_admin FROM USER where username=?', username, function(err, rows, fields) {
            if (err) {
                return resolve(false);
            }

            if (rows.length > 0) {
                if (level == MEMBER_LEVEL && (rows[0].is_club_member || rows[0].is_admin)) {
                    return resolve(true);
                } else if (level == ADMIN_LEVEL && rows[0].is_admin) {
                    return resolve(true);
                } else {
                    return resolve(false);
                }
            } else {
                return resolve(false);
            }
        });
    });
};


module.exports = {
    validate_login: validate_login,
    validate_user: validate_user,
    validate_user_level: validate_user_level,

    USER_LEVEL: USER_LEVEL,
    MEMBER_LEVEL: MEMBER_LEVEL,
    ADMIN_LEVEL: ADMIN_LEVEL,
};
