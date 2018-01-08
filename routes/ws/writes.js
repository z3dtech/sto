'use strict'

const Constants 	 = require('./../../lib/Consts')

exports.insert = ( ws, req, msg ) => {		
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization )
	apiHandler.handleInsertCall( apiKey, msg ).then((data) => {
		apiHandler.logRequest( Constants.write, msg.owner, apiKey, false )
		ws.status(201).send( data )
	}).catch( (err) => {
		apiHandler.logRequest( Constants.write, msg.owner, apiKey, err.msg )
		ws.send(err.msg)
	})
}
	
exports.update = ( ws, req, msg ) => {		
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization )
	apiHandler.handleUpdateCall( apiKey, msg ).then((data) => {
		apiHandler.logRequest( Constants.write, msg.owner, apiKey, false )
		ws.send( data )
	}).catch( (err) => {
		apiHandler.logRequest( Constants.write, msg.owner, apiKey, err.msg )
		ws.send(err.msg)
	})
}

exports.delete = ( ws, req, msg ) => {		
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization )
	apiHandler.handleDeleteCall( apiKey, msg ).then((data) => {
		apiHandler.logRequest( Constants.write, msg.owner, apiKey, false )
		ws.send( data )
	}).catch( (err) => {
		apiHandler.logRequest( Constants.write, msg.owner, apiKey, err.msg )
		ws.send(err.msg)
	})
}

