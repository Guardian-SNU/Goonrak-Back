const user_auth = require('../general/user_auth.js');
const mysql = require('mysql');
const db_config = require('../config/db_config.js');
const connection = mysql.createConnection(db_config);

const validate_read = async function(session, username, board_id) {
    return new Promise(async function(resolve, reject) {
        if (!await user_auth.validate_user(session, username)) {
            return resolve(false);
        }

        const sql = 'SELECT read_level FROM BOARD WHERE board_id=?';
        const q_param = [board_id];

        connection.query(sql, q_param, async function(err, rows, fields) {
            if (err) {
                return resolve(false);
            }

            if (rows.length > 0) {
                const level = rows[0].read_level;
                const validated = await user_auth.validate_user_level(session, username, level);

                if (validated) {
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


const validate_write = function(session, username, board_id) {
    return new Promise(async function(resolve, reject) {
        if (!await user_auth.validate_user(session, username)) {
            return resolve(false);
        }

        const sql = 'SELECT write_level FROM BOARD WHERE board_id=?';
        const q_param = [board_id];

        connection.query(sql, q_param, async function(err, rows, fields) {
            if (err) {
                return resolve(false);
            }

            if (rows.length > 0) {
                const level = rows[0].write_level;
                const validated = await user_auth.validate_user_level(session, username, level);

                if (validated) {
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
    validate_read: validate_read,
    validate_write: validate_write,
};
