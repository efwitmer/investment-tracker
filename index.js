'use strict';

const Path = require('path');
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Mysql = require('mysql');
const dev = process.env.environment == "DEV" ? true : false;


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

	await server.start();
	console.log(`Server running on %s`, server.info.uri);
};

process.on('unhandledRejection', (err) => {
	console.log("Unhandled Rejection !! Error: ", err);
	process.exit(1);
});

init();