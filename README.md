# Goonrak Backend

Members : 김세희, 남예현, 최경재

Port Allocated : 9999, 9998, 9997 ( Base port 9999 )

## Initial Setting

> git clone https://github.com/Guardian-SNU/Goonrak-Back.git

> cd goonrak

> npm install

## How to run

> npm start

> PORT=any_port npm start ( if arbitrary port is demanded )

## Notice

> please copy 'config' folder individually ( not uploaded on github )

## Response Format

		{
			"resultcode": 200 ( for successful requests ), 40x ( for abnormal requests ),
			"message": "error description message",
			...
		}

## APIs (updating)

	- /inout
		- /register
		- /login
		- /logout
	
	- /board
		- /get_post
		- /write_post
		- /edit_post
		- /delete_post
	
