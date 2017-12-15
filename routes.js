'use strict'

const bodyParser     = require('body-parser')
const helmet 		 = require('helmet')
const HandleError	 = require('./lib/HandleError')
const Constants 	 = require('./lib/Consts')
const improperMethod = require('./routes/http/improperMethod')
const writes	 	 = require('./routes/http/writes/writes')

module.exports = function(app) {

	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(bodyParser.json())
	app.use(helmet())

	app.get( '/', (req, res) => {
		res.sendStatus(200)
	})

	app.get( '/v1/validateKey', (req, res) => {
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization ) 
		apiHandler.handleKeyValidation( apiKey ).then((data) => {
			res.status(200).send( data )
		}).catch( (err) => {
			res.status(err.code).send(err.msg)
		})
	})

	/* 
		WRITE DATA
	*/

	app.post( '/v1/insert', writes.insert)


	app.use( '/v1/insert', ( req, res ) => { 
		improperMethod( req, res, 'POST' ) 	
	})

	/* 
		UPDATE DATA
	*/

	app.put( '/v1/update', writes.update )


	app.use( '/v1/update', ( req, res ) => {  
		improperMethod( req, res, 'PUT' ) 	
	})

	/* 
		DELETE DATA 
	*/

	app.delete( '/v1/delete/', writes.delete )

	app.use( '/v1/delete/', ( req, res ) => { 
		improperMethod( req, res, 'DELETE' ) 	
	})
	
	/*
		READ DEFAULT COLLECTION
	*/



	app.get( '/v1/id/:_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindIdCall( apiKey, false, req.params['_id'] ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params['_id'], apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params['_id'], apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 
	})


	app.use( '/v1/id/:_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})



	/*

		READ LATEST DATA

	*/

	app.get( '/v1/last/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindOwnerCall( apiKey, false, req.params.owner_id, 1 ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 
	})

	app.get( '/v1/last/:owner_id/:limit', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindOwnerCall( apiKey, false, req.params.owner_id, parseInt( req.params.limit ) ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 
	})

	app.get( '/v1/last/:owner_id/:limit/page/:page', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindOwnerCall( apiKey, false, req.params.owner_id, parseInt( req.params.limit ), parseInt( req.params.page ) ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 
	})


	app.use( '/v1/last/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})
	app.use( '/v1/last/:owner_id/:limit', ( req, res ) => { 
		improperMethod( req, res ) 
	})
	app.use( '/v1/last/:owner_id/:limit/page/:page', ( req, res ) => { 
		improperMethod( req, res ) 
	})


	/*

		READ OLDEST DATA

	*/


	app.get( '/v1/first/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindOwnerCall( apiKey, false, req.params.owner_id, 1, false, 1 ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 
	})


	app.get( '/v1/first/:owner_id/:limit', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindOwnerCall( apiKey, false, req.params.owner_id, parseInt( req.params.limit ), false, 1).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 
	})


	app.get( '/v1/first/:owner_id/:limit/page/:page', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindOwnerCall( apiKey, false, req.params.owner_id, parseInt( req.params.limit ), parseInt( req.params.page ), 1 ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 
	})



	app.use( '/v1/first/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})


	app.use( '/v1/first/:owner_id/:limit', ( req, res ) => { 
		improperMethod( req, res ) 
	})



	app.use( '/v1/first/:owner_id/:limit/page/:page', ( req, res ) => { 
		improperMethod( req, res ) 
	})


	/*

		READ BY HASH

	*/


	app.get( '/v1/hash/:hash', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindHashCall(  apiKey, false, req.params.hash ).then( (data) => {
			apiHandler.logRequest( Constants.read, false, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, false, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		})
	})

	app.use( '/v1/hash/:hash', (req, res) => {
		improperMethod( req, res ) 
	})

	app.get( '/v1/hash/:hash/:owner_id', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindHashCall(  apiKey, false, req.params.hash, req.params.owner_id ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		})
	})

	app.use( '/v1/hash/:hash/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	/*
		READ COUNT
	*/


	app.get( '/v1/count/', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleCountCall( apiKey, false, false ).then( (data) => {
			apiHandler.logRequest( Constants.read, false, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, false, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		})
	})

	app.get( '/v1/count/:owner_id', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleCountCall( apiKey, false, req.params.owner_id ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		})
	})


	app.use( '/v1/count/', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	app.use( '/v1/count/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})


	/*
		READ CUSTOM COLLECTION
	*/

	app.get( '/v1/:collection/id/:_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindIdCall( apiKey, req.params.collection, req.params['_id'] ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params['_id'], apiKey, false ) // check data for owner?
			res.send( data ) 
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params['_id'], apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 
	})


	app.use( '/v1/:collection/id/:_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})



	/*

		READ LATEST DATA

	*/

	app.get( '/v1/:collection/last/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindOwnerCall( apiKey, req.params.collection, req.params.owner_id, 1 ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 
	})

	app.get( '/v1/:collection/last/:owner_id/:limit', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindOwnerCall( apiKey, req.params.collection, req.params.owner_id, parseInt( req.params.limit ) ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 	
	})

	app.get( '/v1/:collection/last/:owner_id/:limit/page/:page', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindOwnerCall( apiKey, req.params.collection, req.params.owner_id, parseInt( req.params.limit ), parseInt( req.params.page ) ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 
	})
	
	app.use( '/v1/:collection/last/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	app.use( '/v1/:collection/last/:owner_id/:limit', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	app.use( '/v1/:collection/last/:owner_id/:limit/page/:page', ( req, res ) => { 
		improperMethod( req, res ) 
	})
	


	/*

		READ OLDEST DATA

	*/

	app.get( '/v1/:collection/first/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindOwnerCall( apiKey, req.params.collection, req.params.owner_id, 1, false, 1 ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 
	})

	app.get( '/v1/:collection/first/:owner_id/:limit', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindOwnerCall( apiKey, req.params.collection, req.params.owner_id, parseInt( req.params.limit ), false, 1 ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 	
	})


	app.get( '/v1/:collection/first/:owner_id/:limit/page/:page', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindOwnerCall( apiKey, req.params.collection, req.params.owner_id, parseInt( req.params.limit ), parseInt( req.params.page ), 1 ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		}) 
	})
	
	
	app.use( '/v1/:collection/first/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	app.use( '/v1/:collection/first/:owner_id/:limit', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	app.use( '/v1/:collection/first/:owner_id/:limit/page/:page', ( req, res ) => { 
		improperMethod( req, res ) 
	})
	
	/*
		READ BY HASH
	*/


	app.get( '/v1/:collection/hash/:hash', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindHashCall( apiKey, req.params.collection, req.params.hash ).then( (data) => {
			apiHandler.logRequest( Constants.read, false, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, false, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		})
	})

	app.use( '/v1/:collection/hash/:hash', ( req, res ) => { 
		improperMethod( req, res ) 
	})


	app.get( '/v1/:collection/hash/:hash/:owner_id', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindHashCall( apiKey, req.params.collection, req.params.hash, req.params.owner_id ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		})
	})

	app.use( '/v1/:collection/hash/:hash/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})


	/*
		READ COUNT
	*/


	app.get( '/v1/:collection/count/', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindCountCall( apiKey, req.params.collection, false ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, false, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		})
	})

	app.get( '/v1/:collection/count/:owner_id', (req, res) => {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )
		apiHandler.handleFindCountCall(  apiKey, req.params.collection, req.params.owner_id ).then( (data) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		})
	})

	app.use( '/v1/:collection/count/', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	app.use( '/v1/:collection/count/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
} )

	app.use(( req, res ) => { // 404 everything else
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Path does not exist', false, 404 )
		apiHandler.logRequest( err.code, err.code, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	})
}