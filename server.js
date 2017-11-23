'use strict'

const express		 = require('express')
const https 		 = require('https')
const http 			 = require('http')
const fs 			 = require('fs')
const app			 = express()
const HandleApi         = require( './lib/HandleApi' ) 
const HandleConfig      = require('./lib/HandleConfig')
require( './routes' )(app)
	

module.exports.run = function( config ) {
	let handleConfig = new HandleConfig()
	if( handleConfig.errorCheckConfig( config ) ) {
		let apiHandler = new HandleApi( config )
		app.set( 'apiHandler', apiHandler )
		if( config.SSL_ENABLED === true ) {
			app.use(function(req, res, next) {
				if(!req.secure) {
					return res.redirect(['https://', req.get('Host'), req.url].join(''))
				}
				next()
			});
			https.createServer({
				key: fs.readFileSync( config.SSL_KEY ),
				cert: fs.readFileSync( config.SSL_CERT )
			}, app).listen( config.SSL_PORT )
			http.createServer( (req, res) => {
				res.writeHead(301, { 'Location': 'https://' + req.headers['host'] + req.url });
				res.end();
			}).listen(config.PORT);
		} else {
			app.listen( config.PORT, () => {
				//console.log('\n[SUCCESS] Running on ' + config.PORT + '\n')
			})
		}
	}
			
}
