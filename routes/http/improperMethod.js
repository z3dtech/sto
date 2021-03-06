'use strict'

const Constants 	 = require('./../../lib/Consts')
const HandleError	 = require('./../../lib/HandleError')

exports.error405 = function( req, res, allow = 'GET' ) {
	res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
	res.setHeader( 'Allow', allow )	
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization )
	let owner = false
	let requestType = Constants.read
	if( typeof req.params.owner_id !== 'undefined' ) {
		owner = req.params.owner_id
	}	
	if( allow !== 'GET' ) {
		requestType = Constants.write
	}
	let err = HandleError( '[API] Improper Method Used', false, 405 )
	apiHandler.logRequest( requestType, owner, apiKey, err.msg )
	res.status(err.code).send(err.msg)
}