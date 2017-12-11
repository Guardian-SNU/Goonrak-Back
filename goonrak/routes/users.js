var express = require('express');
var session = require('express-session');
var router = express.Router();

var auth = require('../general/user_auth.js');
var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var email = require('../general/email_auth.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
	// test2
	email.send_verification_email('1', 'highnoo70@gmail.com', res);
	//email.verify_token('1', '519', res);
});


router.post('/get_info', function(req, res, next){
    // TODO : implement
	var sess=req.session;
	var username=sess.username;
    connection.query('SELECT * FROM USER WHERE username=?', username, function(err, rows, field){

        if(err){
            console.log(err)
            return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
            // TODO : NEED SOME ERROR HANDLEING
        }

        // check username uniqueness
        if(rows && rows.length == 1){
            var is_club_member = rows[0].is_club_member;
            var email = rows[0].email;
            send_data["resultcode"]=200;
            send_data["message"]="Get info success";

            // info : email, is_clubmember
            send_data["info"]={username:username,email:email,is_club_member:is_club_member};
            res.status(200).json(send_data);
            // correct password given

        }

        // no matching username
        else{
            // TODO : send JSON
            send_data["resultcode"]=200;
            send_data["success"]=0;
            send_data["message"]='Wrong info';
            res.status(200).json(send_data);
            //res.send("WRONG INFO");
        }
    });
});

router.post('/edit_info', function(req, res, next){
    // TODO : implement
    var sess=req.session;
    var username=sess.username;
    connection.query('SELECT * FROM USER WHERE username=?', username, function(err, rows, field){

        if(err){
            console.log(err)
            return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
            // TODO : NEED SOME ERROR HANDLEING
        }

        // check username uniqueness
        if(rows && rows.length == 1){
            //var is_club_member = rows[0].is_club_member;
            var email = req.body.email;
			var password = req.body.password;
            var salt = rows[0].salt;
            var update_pw_hash = crypto.createHash('sha256').update(salt + password).digest('hex');

            // update only : password (cant username, email, is_club_member)
			connection.query('UPDATE USER set password=? where username=?',[update_pw_hash,username],function(err,rows,field){
                if(err){
                    console.log(err)
                    return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
                    // TODO : NEED SOME ERROR HANDLEING
                }
			})



            send_data["resultcode"]=200;
            send_data["message"]="Update info success";

            res.status(200).json(send_data);
            // correct password given

        }

        // no matching username
        else{
            // TODO : send JSON
            send_data["resultcode"]=200;
            send_data["success"]=0;
            send_data["message"]='Wrong info';
            res.status(200).json(send_data);
            //res.send("WRONG INFO");
        }
    });
});


module.exports = router;
