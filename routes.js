'use strict'

const bodyParser     = require('body-parser')
const Constants 	 = require('./lib/Consts')
const HandleError	 = require('./lib/HandleError')


module.exports = function(app) {

	app.use(bodyParser.urlencoded({ extended: true }));

	app.get( '/', (req, res) => {
		res.sendStatus(200)
	});

	/* 
		WRITE DATA
	*/

	app.post( '/v1/insert', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )		
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization ) 
		if( apiKey === false ) {
			( typeof req.body.api_key !== 'undefined' ? req.body.api_key : false )
		}
		apiHandler.handleInsertCall( apiKey, req.body ).then((data) => {
			res.status(201).send( data )
		}, (err) => {
			res.status(err.code).send(err.msg)
		})
	});


	app.use( '/v1/insert', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'POST' )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		res.status(err.code).send(err.msg)
	});

	/* 
		DELETE DATA 
	*/

	app.delete( '/v1/delete/', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )		
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleDeleteCall( apiKey, req.body ).then((data) => {
			res.send( data )
		}, (err) => {
			res.status(err.code).send(err.msg)
		})
	});

	app.use( '/v1/delete/', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'DELETE' )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		res.status(err.code).send(err.msg)
	});
	/*
		READ DEFAULT COLLECTION
	*/

	app.get( '/v1/last/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindLastCall( apiKey, false, req.params.owner_id, 1 ).then( (data) => {
			res.send( data )
		}, (err) => {
			res.status(err.code).send(err.msg)
		}) 
	})


	app.use( '/v1/last/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		res.status(err.code).send(err.msg)
	});

	app.get( '/v1/last/:owner_id/:limit', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindLastCall( apiKey, false, req.params.owner_id, parseInt( req.params.limit ) ).then( (data) => {
			res.send( data )
		}, (err) => {
			res.status(err.code).send(err.msg)
		}) 
	})


	app.use( '/v1/last/:owner_id/:limit', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		res.status(err.code).send(err.msg)
	});


	app.get( '/v1/last/:owner_id/:limit/page/:page', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindLastCall( apiKey, false, req.params.owner_id, parseInt( req.params.limit ), parseInt( req.params.page ) ).then( (data) => {
			res.send( data )
		}, (err) => {
			res.status(err.code).send(err.msg)
		}) 
	})


	app.use( '/v1/last/:owner_id/:limit/page/:page', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		res.status(err.code).send(err.msg)
	});


	app.get( '/v1/hash/:hash', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindHashCall(  apiKey, false, req.params.hash ).then( (data) => {
			res.send( data )
		}, (err) => {
			res.status(err.code).send(err.msg)
		})
	})

	app.use( '/v1/hash/:hash', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		res.status(err.code).send(err.msg)
	});



	/*
		READ CUSTOM COLLECTION
	*/


	app.get( '/v1/:collection/last/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindLastCall( apiKey, req.params.collection, req.params.owner_id, 1 ).then( (data) => {
			res.send( data )
		}, (err) => {
			res.status(err.code).send(err.msg)
		}) 
	})


	app.get( '/v1/:collection/last/:owner_id/:limit', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindLastCall( apiKey, req.params.collection, req.params.owner_id, parseInt( req.params.limit ) ).then( (data) => {
			res.send( data )
		}, (err) => {
			res.status(err.code).send(err.msg)
		}) 	
	})


	app.get( '/v1/:collection/last/:owner_id/:limit/page/:page', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindLastCall( apiKey, req.params.collection, req.params.owner_id, parseInt( req.params.limit ), parseInt( req.params.page ) ).then( (data) => {
			res.send( data )
		}, (err) => {
			res.status(err.code).send(err.msg)
		}) 
	})

	app.get( '/v1/:collection/hash/:hash', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindHashCall(  apiKey, req.params.collection, req.params.hash ).then( (data) => {
			res.send( data )
		}, (err) => {
			res.status(err.code).send(err.msg)
		})
	})

	app.use( '/v1/:collection/hash/:hash', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		res.status(err.code).send(err.msg)
	});

	app.use( '/v1/:collection/last/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		res.status(err.code).send(err.msg)
	});

	app.use( '/v1/:collection/last/:owner_id/:limit', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		res.status(err.code).send(err.msg)
	});

	app.use( '/v1/:collection/last/:owner_id/:limit/page/:page', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		res.status(err.code).send(err.msg)
	});

	app.use(function (req, res, next) {
		let apiHandler = req.app.get( 'apiHandler' )
		apiHandler.logRequest( 404, 404, 404, '[API] 404 on ' + req.originalUrl )
		res.setHeader('Content-Type', 'application/vnd.api+json')
		res.status(404).send({Error: '[API] Path does not exist'})
	})
};