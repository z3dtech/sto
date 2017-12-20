'use strict'

const HandleError	 = require('./../../lib/HandleError')

exports.error404 = function( req, res ) {
	res.setHeader( 'Content-Type', 'application/vnd.api+json' )
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
	let err = HandleError( '[API] Path does not exist', false, 404 )
	apiHandler.logRequest( err.code, err.code, apiKey, err.msg )
	res.status(err.code).send(err.msg)
}