const mysql = require('mysql');

const connectionSemantics = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PW,
	database: process.env.DB_NAME
};

exports.query = function (query, params, callback) {
	if (typeof query != "string" || query.length < 4) {
		return callback(`Invalid query: ${query}`);
	}
	const connection = mysql.createConnection(connectionSemantics);
	const q = mysql.format(query, params);
	connection.query(q, function (err, results) {
		connection.end(e => {
			console.log("*****\n\nError ending DB connection\n\n*****");
		});
		if (err) {
			console.log("Error returned from query: ", err);
			return callback(err);
		}
		return callback(null, results);
	})
};