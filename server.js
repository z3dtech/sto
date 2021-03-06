'use strict'

const express		 = require('express')
const app			 = express()
const expressWs 	 = require('express-ws')(app, null, {leaveRouterUntouched: true});
const https 		 = require('https')
const http 			 = require('http')
const fs 			 = require('fs')
const log4js 		 = require('log4js')
const cors 			 = require('cors')
const HandleApi      = require( './lib/HandleApi' ) 
const HandleConfig 	 = require('./lib/HandleConfig')
const router 		 = require( './routes' )(app)
const routerWs	 	 = require( './ws-routes' )
const error404 		 = require('./routes/http/404')
const success 		 = log4js.getLogger('success')


module.exports.run = function( config ) {
	let handleConfig = new HandleConfig()
	if( handleConfig.errorCheckConfig( config ) ) {
		let apiHandler = new HandleApi( config )
		app.set( 'apiHandler', apiHandler )	
		if( apiHandler.config.CORS_ENABLED === true ) {
			app.use(cors())
		}
		app.use( "/v1/", router )
		app.use( "/", (req, res) => {
			error404.error404( req, res )
		})
		if( config.WS_ENABLED === true ) {
			expressWs.applyTo( router )
			routerWs( app, apiHandler )
		}
		if( config.SSL_ENABLED === true ) {
			app.use(function(req, res, next) {
				if(!req.secure) {
					return res.redirect(['https://', req.get('Host'), req.url].join(''))
				}
				next()
			})
			https.createServer({
				key: fs.readFileSync( config.SSL_KEY ),
				cert: fs.readFileSync( config.SSL_CERT )
			}, app).listen( config.SSL_PORT )
			http.createServer( (req, res) => {
				res.writeHead(301, { 'Location': 'https://' + req.headers['host'] + req.url })
				res.end()
			}).listen(config.PORT)
		} else {
			app.listen( config.PORT, () => {
				success.info( '[SUCCESS] Running on port ' + config.PORT + '\n' )
			})
		}
	} 		
}
