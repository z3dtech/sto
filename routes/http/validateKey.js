'use strict'

module.export = function( req, res ) {
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization ) 
	apiHandler.handleKeyValidation( apiKey ).then((data) => {
		res.status(200).send( data )
	}).catch( (err) => {
		res.status(err.code).send(err.msg)
	})
}