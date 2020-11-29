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
									industry
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

	// Add order
	server.route({
		method: 'POST',
		path: '/add_order',
		handler:  (request, h) => {
			return new Promise((resolve, reject) => {
				dev && console.log(`POST /add_order`);
				const response = {
					headers: {
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Credentials': true,
						'Cache-Control': 'no-cache'
					},
			        statusCode: 200
			    };
				const payload 		 = request.payload;
				if (!payload) {
					response.statusCode = 400;
					response.message = "Missing request payload";
					return resolve(response);
				}
				const asset_type 	 = payload.asset_type;
				const ticker 		 = payload.ticker;
				const asset_name 	 = payload.asset_name;
				const datetime 		 = payload.datetime;
				const fee 			 = payload.fee || 0;
				const price_per_unit = payload.price_per_unit;
				const quantity 		 = payload.quantity;
				const buy_sell 		 = payload.buy_sell;
				const industry 		 = payload.industry;

				if (!asset_type || !ticker || !asset_name || !datetime|| !price_per_unit || !quantity || !buy_sell || !industry) {
					response.statusCode = 400;
					response.message = `Missing one or more of:
										asset_type: ${asset_type}
										ticker: ${ticker}
										asset_name: ${asset_name}
										datetime: ${datetime}
										price_per_unit: ${price_per_unit}
										quantity: ${quantity}
										buy_sell: ${buy_sell}
										industry: ${industry}`;
					return resolve(response);
				}

				const query = `INSERT INTO investments (
									asset_type,
									ticker,
									asset_name,
									datetime,
									fee,
									price_per_unit,
									quantity,
									buy_sell,
									industry
								)
								VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;
				const params = [asset_type, ticker, asset_name, datetime, fee, price_per_unit, quantity, buy_sell, industry]
				db.query(query, params, (err, results) => {
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