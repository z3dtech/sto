'use strict'

const Constants 	 = require('./../../lib/Consts')

exports.insert = (req, res) => {
	res.setHeader( 'Content-Type', 'application/vnd.api+json' )		
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization )
	apiHandler.handleInsertCall( apiKey, req.body ).then((data) => {
		apiHandler.logRequest( Constants.write, req.body.owner, apiKey, false )
		res.status(201).send( data )
	}).catch( (err) => {
		apiHandler.logRequest( Constants.write, req.body.owner, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	})
}
	
exports.update = (req, res) => {
	res.setHeader( 'Content-Type', 'application/vnd.api+json' )		
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization )
	apiHandler.handleUpdateCall( apiKey, req.body ).then((data) => {
		apiHandler.logRequest( Constants.write, req.body.owner, apiKey, false )
		res.send( data )
	}).catch( (err) => {
		apiHandler.logRequest( Constants.write, req.body.owner, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	})
}

exports.delete = (req, res) => {
	res.setHeader( 'Content-Type', 'application/vnd.api+json' )		
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization )
	apiHandler.handleDeleteCall( apiKey, req.body ).then((data) => {
		apiHandler.logRequest( Constants.write, req.body.owner, apiKey, false )
		res.send( data )
	}).catch( (err) => {
		apiHandler.logRequest( Constants.write, req.body.owner, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	})
}

