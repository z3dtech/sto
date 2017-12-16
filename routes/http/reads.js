'use strict'

const Constants 	 = require('./../../lib/Consts')

exports.readId = ( req, res, collection = false ) => {
	res.setHeader( 'Content-Type', 'application/vnd.api+json' )
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization )
	if( typeof req.params.collection !== "undefined" ) {
		collection = req.params.collection
	}
	apiHandler.handleFindIdCall( apiKey, collection, req.params['_id'] ).then( (data) => {
		apiHandler.logRequest( Constants.read, req.params['_id'], apiKey, false )
		res.send( data )
	}).catch( (err) => {
		apiHandler.logRequest( Constants.read, req.params['_id'], apiKey, err.msg )
		res.status(err.code).send(err.msg)
	}) 
}
exports.readCount = ( req, res, collection = false, owner = false ) => {
	res.setHeader('Content-Type', 'application/vnd.api+json')
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization )
	if( typeof req.params.collection !== "undefined" ) {
		collection = req.params.collection
	}
	if( typeof req.params.owner_id!== "undefined" ) {
		owner = req.params.owner_id
	}
	apiHandler.handleFindCountCall( apiKey, collection, owner ).then( (data) => {
		apiHandler.logRequest( Constants.read, owner, apiKey, false )
		res.send( data )
	}).catch( (err) => {
		apiHandler.logRequest( Constants.read, owner, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	})
}

exports.readHash = ( req, res, collection = false, owner = false, hashData = false ) => {
	res.setHeader('Content-Type', 'application/vnd.api+json')
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization )
	if( typeof req.params.collection !== "undefined" ) {
		collection = req.params.collection
	}
	if( typeof req.params.owner_id !== "undefined" ) {
		owner = req.params.owner_id
	}
	if( typeof req.params.hash !== "undefined" ) {
		hashData = req.params.hash
	}
	apiHandler.handleFindHashCall( apiKey, collection, hashData ).then( (data) => {
		apiHandler.logRequest( Constants.read, owner, apiKey, false )
		res.send( data )
	}).catch( (err) => {
		apiHandler.logRequest( Constants.read, owner, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	})
}

exports.readOwner = ( req, res, sort = -1, collection = false, owner = false, limit = 1, page = false ) => {
	res.setHeader('Content-Type', 'application/vnd.api+json')
	let apiHandler = req.app.get( 'apiHandler' )
	let apiKey = apiHandler.parseApiKey( req.headers.authorization )
	if( typeof req.params.collection !== "undefined" ) {
		collection = req.params.collection
	}
	if( typeof req.params.owner_id !== "undefined" ) {
		owner = req.params.owner_id
	}
	if( typeof req.params.limit !== "undefined" ) {
		limit = parseInt( req.params.limit )
	}
	if( typeof req.params.page !== "undefined" ) {
		page = parseInt( req.params.page )
	}
	apiHandler.handleFindOwnerCall( apiKey, collection, owner, limit, page, sort ).then( (data) => {
		apiHandler.logRequest( Constants.read, owner, apiKey, false )
		res.send( data )
	}).catch( (err) => {
		apiHandler.logRequest( Constants.read, owner, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	}) 
}
	
	