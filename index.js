'use strict';

const Path = require('path');
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const dev = process.env.ENVIRONMENT == "DEV" ? true : false;
const db = require('./database.js');


const init = async () => {
	const server = Hapi.server({
		port: 3000,
		host: 'localhost',
		routes: {
			files: { // for Inert
				relativeTo: Path.join(__dirname, 'public')
			}
		}
	});

	await server.register(Inert);

	// Serve home page
	server.route({
		method: 'GET',
		path: '/',
		handler:  (request, h) => {
			dev && console.log("GET /");
			return h.file('index.html');
		}
	});

	// Serve static assets from /public/<file>
	server.route({
		method: 'GET',
		path: '/public/{filename}',
		handler:  (request, h) => {
			dev && console.log(`GET /public/${filename}`);
			return h.file(request.params.filename);
		}
	});

	// Get everything
	server.route({
		method: 'GET',
		path: '/all_orders',
		handler:  (request, h) => {
			return new Promise((resolve, reject) => {
				dev && console.log(`GET /all_orders`);
				const query = `SELECT
									id, 
									asset_type,
									ticker,
									asset_name,
									datetime,
									fee,
									price_per_unit,
									quantity,
									buy_sell,
									industry,
									price_per_unit * quantity AS cost
								FROM investments
								ORDER BY datetime DESC;`;
				db.query(query, [], (err, results) => {
					const response = {
						headers: {
							'Access-Control-Allow-Origin': '*',
							'Access-Control-Allow-Credentials': true,
							'Cache-Control': 'no-cache'
						},
				        statusCode: 200
				    };
					if (err) {
						response.statusCode = 503;
					} else {
						response.body = JSON.stringify(results);
					}
					return resolve(response);
				});
			})
		}
	});


	await server.start();
	console.log(`Server running on %s`, server.info.uri);
};

process.on('unhandledRejection', (err) => {
	console.log("Unhandled Rejection !! Error: ", err);
	process.exit(1);
});

init();