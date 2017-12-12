const express = require('express');
const router = express.Router();

const auth = require('../general/user_auth.js');
const mysql = require('mysql');
const db_config = require('../config/db_config.js');
const connection = mysql.createConnection(db_config);

const board_auth = require('../general/board_auth.js');
const send_response = require('../general/response_manager.js').send_response;

/* get_posts
 * - validate user, and return posts
 *
 * GET parameters
 * - board
 * - page
 */
router.get('/get_post_list', async function(req, res, next) {
    let posts_per_page = 15;

    if (!(req.query.board && req.query.page)) {
        return send_response(res, 400, 'Parameters not given');
    }

    const session = req.session;
    let username = session.username;
    let board = req.query.board;
    let page = req.query.page;

    // no authentication to access the board
    if (!await board_auth.validate_read(session, username, board)) {
        return send_response(res, 401, 'User auth fail');
    }

    const query = 'SELECT post_id, user_id, username, board, title, post_time, hit FROM POST WHERE board=? ORDER BY post_time DESC LIMIT ?,?';
    connection.query(query, [board, (page-1)*posts_per_page, posts_per_page], function(err, rows, fields) {
        if (err) {
            return send_response(res, 500, 'Internal server error');
        }

        return send_response(res, 200, '', rows);
    });
});


/* get_post
 * - validate user, and return post data
 *
 * GET parameters
 * - id
 * - board
 */
router.get('/get_post', async function(req, res, next) {
    let param = req.query.id && req.query.board;
    if (!param) {
        return send_response(res, 400, 'Parameters not given');
    }

    const session = req.session;
    let username = session.username;
    let board = req.query.board;
    let post_id = req.query.id;

    let can_get = await board_auth.validate_read(session, username, board);
    if (can_get) {
        const get_post = 'SELECT post_id, username, board, title, content, post_time, hit FROM POST WHERE board=? AND post_id=?';
        const q_param = [board, post_id];

        connection.query(get_post, q_param, function(err, rows, fields) {
            if (err) {
                // throw err;
                console.log(err);
                return send_response(res, 500, 'Internal server error');
            }

            if (rows.length > 0) {
                const get_boardname = 'SELECT board_name FROM BOARD WHERE board_id=?';
                connection.query(get_boardname, [board], function(err, r, fields) {
                    if (err) {
                        return send_response(res, 500, 'Internal server error');
                    }

                    if (r.length > 0) {
                        rows[0].board_name = r[0].board_name;
                        return send_response(res, 200, '', rows);
                    } else {
                        return send_response(res, 500, 'Internal server error');
                    }
                });
            } else {
                return send_response(res, 400, 'No such post');
            }
        });
    } else {
        return send_response(res, 401, 'User auth fail');
    }
});


/* write_post
 * - validate user, add post data to db
 *
 * POST form data
 * - username
 * - board
 * - title
 * - content
 */
router.post('/write_post', async function(req, res, next) {
    const param = req.body.username && req.body.board && req.body.title && req.body.content;
    if (!param) {
        return send_response(res, 400, 'Parameters not given');
    }

    const session = req.session;
    let username = req.body.username;
    let board = req.body.board;
    let title = req.body.title;
    let content = req.body.content;

    let can_write = await board_auth.validate_write(session, username, board);

    if (can_write) {
        const write_post = 'INSERT INTO POST (username, board, title, content, hit) VALUES ?';
        const q_param = [[username, board, title, content, 0]];

        connection.query(write_post, [q_param], function(err, result) {
            if (err) {
                // throw err;
                console.log(err);
                return send_response(res, 500, 'Internal server error');
            }
            return send_response(res, 200, 'Write post successful');
        });
    } else {
        return send_response(res, 401, 'User auth fail');
    }
});


/* edit_post
 * - validate user, fix post data in db
 *
 * POST form data
 * - post title, data, category, ... ( check datagbase schema )
 * - username
 */
router.post('/edit_post', async function(req, res, next) {
    const param = req.body.username && req.body.board && req.body.post_id && req.body.content;
    if (!param) {
        return send_response(res, 400, 'Parameters not given');
    }

    const session = req.session;
    let username = req.body.username;
    let board = req.body.board;
    let post_id = req.body.post_id;
    let title = req.body.title;
    let content = req.body.content;

    let can_edit = await board_auth.validate_write(session, username, board);

    if (can_edit) {
        const check = 'SELECT * FROM POST WHERE board=? AND post_id=?';
        const c_param = [board, post_id];

        connection.query(check, c_param, function(err, rows, fields) {
            if (err) {
                // throw err;
                console.log(err);
                return send_response(res, 500, 'Internal server error');
            }

            // No matching post
            if (rows.length == 0) {
                return send_response(res, 400, 'No such post');
            }

            // Not the post that user wrote
            if (rows[0].username != username) {
                return send_response(res, 401, 'User auth fail');
            }

            const edit_post = 'UPDATE POST SET title=?, content=? WHERE board=? AND post_id=?';
            const e_param = [title, content, board, post_id];

            connection.query(edit_post, e_param, function(err, rows, fields) {
                if (err) {
                    // throw err;
                    console.log(err);
                    return send_response(res, 500, 'Internal server error');
                }

                return send_response(res, 200, 'Edit post successful');
            });
        });
    } else {
        return send_response(res, 401, 'User auth fail');
    }
});


/* delete_post
 * - validate user, delete post data from db
 *
 * POST form data
 * - post id,
 * - username
 * - board
 */
router.post('/delete_post', async function(req, res, next) {
    const param = req.body.username && req.body.board && req.body.post_id;
    if (!param) {
        return send_response(res, 400, 'Parameters not given');
    }

    const session = req.session;
    let username = req.body.username;
    let board = req.body.board;
    let post_id = req.body.post_id;

    let can_delete = await board_auth.validate_write(session, username, board);

    if (can_delete) {
        const check = 'SELECT * FROM POST WHERE board=? AND post_id=?';
        const c_param = [board, post_id];

        connection.query(check, c_param, async function(err, rows, fields) {
            if (err) {
                // throw err;
                console.log(err);
                return send_response(res, 500, 'Internal server error');
            }

            // No matching post
            if (rows.length == 0) {
                return send_response(res, 400, 'No such post');
            }

            // Not the user wrote and user is not admin
            if (rows[0].username != username && !(await auth.validate_user_level(session, username, auth.ADMIN_LEVEL))) {
                return send_response(res, 401, 'User auth fail');
            }

            const delete_post = 'DELETE FROM POST WHERE board=? AND post_id=?';
            const d_param = [board, post_id];

            connection.query(delete_post, d_param, function(err, result) {
                if (err) {
                    // throw err;
                    console.log(err);
                    return send_response(res, 500, 'Internal server error');
                }

                return send_response(res, 200, 'Delete post successful');
            });
        });
    } else {
        return send_response(res, 401, 'User auth fail');
    }
});

module.exports = router;
