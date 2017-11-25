'use strict'

const bodyParser     = require('body-parser')
const HandleError	 = require('./lib/HandleError')
const Constants 	 = require('./lib/Consts')


module.exports = function(app) {

	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json())

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
		apiHandler.handleInsertCall( apiKey, req.body ).then((data) => {
			apiHandler.logRequest( Constants.write, req.body.owner, apiKey, false )
			res.status(201).send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.write, req.body.owner, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		})
	});


	app.use( '/v1/insert', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'POST' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.write, req.body.owner, apiKey, err.msg )
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
			apiHandler.logRequest( Constants.write, req.body.owner, apiKey, false )
			res.send( data )
		}).catch( (err) => {
			apiHandler.logRequest( Constants.write, req.body.owner, apiKey, err.msg )
			res.status(err.code).send(err.msg)
		})
	});

	app.use( '/v1/delete/', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'DELETE' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.write, req.body.owner, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});
	
	/*
		READ DEFAULT COLLECTION
	*/


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


	app.use( '/v1/last/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});

	app.use( '/v1/last/:owner_id/:limit', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});


	app.use( '/v1/last/:owner_id/:limit/page/:page', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});


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



	app.use( '/v1/first/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});


	app.use( '/v1/first/:owner_id/:limit', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});



	app.use( '/v1/first/:owner_id/:limit/page/:page', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});


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
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, false, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});

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

	app.use( '/v1/hash/:hash/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});

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


	app.use( '/v1/count/', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});

	app.use( '/v1/count/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});


	/*
		READ CUSTOM COLLECTION
	*/

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
	
	app.use( '/v1/:collection/last/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});

	app.use( '/v1/:collection/last/:owner_id/:limit', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});

	app.use( '/v1/:collection/last/:owner_id/:limit/page/:page', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});
	


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
	
	
	app.use( '/v1/:collection/first/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});


	app.use( '/v1/:collection/first/:owner_id/:limit', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});

	app.use( '/v1/:collection/first/:owner_id/:limit/page/:page', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});
	
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

	app.use( '/v1/:collection/hash/:hash', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, false, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});


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

	app.use( '/v1/:collection/hash/:hash/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, false, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});


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

	app.use( '/v1/:collection/count/', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, false, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});


	app.use( '/v1/:collection/count/:owner_id', (req, res) => {
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )	
		res.setHeader( 'Allow', 'GET' )	
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Improper Method Used', false, 405 )
		apiHandler.logRequest( Constants.read, req.params.owner_id, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	});



	app.use(function (req, res ) {
		res.setHeader('Content-Type', 'application/vnd.api+json')
		let apiHandler = req.app.get( 'apiHandler' )
		apiHandler.logRequest( 404, 404, 404, '[API] 404 on ' + req.originalUrl )
		res.status(404).send({Error: '[API] Path does not exist'})
	})
};