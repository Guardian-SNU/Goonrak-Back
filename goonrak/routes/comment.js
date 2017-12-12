const express = require('express');
const router = express.Router();

const auth = require('../general/user_auth.js');
const mysql = require('mysql');
const db_config = require('../config/db_config.js');
const connection = mysql.createConnection(db_config);

const send_response = require('../general/response_manager.js').send_response;
const board_auth = require('../general/board_auth.js');

/* get_comments
 * - validate user, and return comments of the post
 *
 * POST form data
 * - post_id
 */
router.post('/get_comments', async function(req, res, next) {
    const param = req.body.post_id;
    if (!param) {
        return send_response(res, 400, 'Parameters not given');
    }

    const session = req.session;
    let username = session.username;
    let post_id = req.body.post_id;
    let board = await get_board_from_post(post_id);
    if (board == -1) {
        return send_response(res, 400, 'No such post');
    }

    let can_get = await board_auth.validate_read(session, username, board);

    if (can_get) {
        const get_comments = 'SELECT comment_id, username, post_id, content, comment_time, is_reply, parent_comment_id FROM COMMENT WHERE post_id=?';
        const q_param = [post_id];

        connection.query(get_comments, q_param, function(err, rows, fields) {
            if (err) {
                console.log(err);
                return send_response(res, 500, 'Internal server error');
            }

            return send_response(res, 200, '', rows);
        });
    } else {
        return send_response(res, 401, 'User auth fail');
    }
});


/* write_comment
 * - validate user, add comment data to db
 *
 * POST form data
 * - post id, username, comment_data, ... ( check database schema )
 */
router.post('/write_comment', async function(req, res, next) {
    const param = req.body.post_id && req.body.content && req.body.username;
    if (!param) {
        return send_response(res, 400, 'Parameters not given');
    }

    const session = req.session;
    let username = req.body.username;
    let post_id = req.body.post_id;
    let content = req.body.content;

    let board = await get_board_from_post(post_id);
    if (board == -1) {
        return send_status(res, 400, 'No such post');
    }

    let can_write = await board_auth.validate_write(session, username, board);

    if (can_write) {
        let w_comment = 'INSERT INTO COMMENT (username, post_id, content, is_reply) VALUES ?';
        let q_param = [[username, post_id, content, 0]];

        connection.query(w_comment, [q_param], function(err, result) {
            if (err) {
                console.log(err);
                return send_response(res, 500, 'Internal server error');
            }

            return send_response(res, 200, 'Write comment successful');
        });
    } else {
        return send_response(res, 401, 'User auth fail');
    }
});


/* edit_comment
 * - validate user, fix comment data in db
 *
 * POST form data
 * - post id, username, comment_data, ... ( check datagbase schema )
 */
router.post('/edit_comment', async function(req, res, next) {
    let param = (req.body.username != null) & (req.body.post_id != null) & (req.body.comment_id != null) & (req.body.content != null);
    if (!param) {
        console.log(req.body);
        return send_response(res, 400, 'Parameters not given');
    }

    const session = req.session;
    let username = req.body.username;
    let post_id = req.body.post_id;
    let comment_id = req.body.comment_id;
    let content = req.body.content;

    let board = await get_board_from_post(post_id);
    if (board == -1) {
        return send_response(res, 400, 'No such post');
    }

    let can_edit = await board_auth.validate_read(session, username, board);

    if (can_edit) {
        const g_comment = 'SELECT username FROM COMMENT WHERE comment_id=?';
        const g_param = [comment_id];

        connection.query(g_comment, g_param, function(err, rows, fields) {
            if (err) {
                console.log(err);
                return send_response(res, 500, 'Internal server error');
            }

            if (rows.length == 0) {
                return send_response(res, 400, 'No such comment');
            }

            if (rows[0].post_id != post_id) {
                return send_response(res, 400, 'Wrong post id');
            }

            if (rows[0].username != username) {
                return send_response(res, 401, 'User auth fail');
            }

            const e_comment = 'UPDATE COMMENT SET content=? WHERE comment_id=?';
            const e_param = [content, comment_id];

            connection.query(e_comment, e_param, function(err, result) {
                if (err) {
                    console.log(err);
                    return send_status(res, 500, 'Internal server error');
                }

                return send_response(res, 200, 'Edit comment successful');
            });
        });
    } else {
        return send_response(res, 401, 'User auth fail');
    }
});


/* delete_comment
 * - validate user, delete comment data from db
 *
 * POST form data
 * - post id,
 * - comment_id,
 * - username
 */
router.post('/delete_comment', async function(req, res, next) {
    let param = req.body.comment_id;
    if (!param) {
        return send_response(res, 400, 'Parameters not given');
    }

    const session = req.session;
    let username = req.body.username;
    let post_id = req.body.post_id;
    let comment_id = req.body.comment_id;

    let board = await get_board_from_post(post_id);
    if (board == -1) {
        return send_response(res, 400, 'No such post');
    }

    let can_delete = await board_auth.validate_read(session, username, board);

    if (can_delete) {
        const g_comment = 'SELECT username FROM COMMENT WHERE COMMENT_id=?';
        const g_param = [comment_id];

        connection.query(g_comment, g_param, async function(err, rows, fields) {
            if (err) {
                console.log(err);
                return send_response(res, 500, 'Internal server error');
            }

            if (rows.length == 0) {
                return send_response(res, 400, 'No such comment');
            }

            if (rows[0].post_id != post_id) {
                return send_response(res, 400, 'Wrong post id');
            }

            if (rows[0].username != username && !(await auth.validate_user_level(session, username, auth.ADMIN_LEVEL))) {
                return send_response(res, 401, 'User auth fail');
            }

            const d_comment = 'DELETE FROM COMMENT WHERE comment_id=?';
            const q_param = [comment_id];

            connection.query(d_comment, q_param, function(err, result) {
                if (err) {
                    console.log(err);
                    return send_response(res, 500, 'Internal server error');
                }

                return send_response(res, 200, 'Delete comment successful');
            });
        });
    } else {
        return send_response(res, 401, 'User auth fail');
    }
});

const get_board_from_post = function(post_id) {
    return new Promise(function(resolve, reject) {
        const query = 'SELECT board FROM POST WHERE post_id=?';
        const param = [post_id];
        connection.query(query, param, function(err, rows, fields) {
            if (err) {
                console.log(err);
                return resolve(-1);
            }

            if (0 < rows.length) {
                return resolve(rows[0].board);
            } else {
                return resolve(-1);
            }
        });
    });
};

module.exports = router;
