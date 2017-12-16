'use strict'

const bodyParser     = require('body-parser')
const helmet 		 = require('helmet')
const HandleError	 = require('./lib/HandleError')
const improperMethod = require('./routes/http/improperMethod')

const writes	 	 = require('./routes/http/writes')
const reads 		 = require('./routes/http/reads')

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

	app.use( '/v1/validateKey', ( req, res ) => { 
		improperMethod( req, res ) 	
	})


	/* 
		ALTER DATA
	*/

	app.post( '/v1/insert', ( req, res ) => { 
		writes.insert( req, res ) 	
	})

	app.use( '/v1/insert', ( req, res ) => { 
		improperMethod( req, res, 'POST' ) 	
	})

	app.put( '/v1/update', ( req, res ) => { 
		writes.update( req, res ) 	
	})

	app.use( '/v1/update', ( req, res ) => {  
		improperMethod( req, res, 'PUT' ) 	
	})

	app.delete( '/v1/delete/', ( req, res ) => { 
		writes.delete( req, res ) 	
	})
	app.use( '/v1/delete/', ( req, res ) => { 
		improperMethod( req, res, 'DELETE' ) 	
	})
	

	// READ

	// id

	app.get( '/v1/id/:_id', (req, res) => {
		reads.readId( req, res ) 
	})

	app.use( '/v1/id/:_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	app.get( '/v1/:collection/id/:_id', (req, res) => {
		reads.readId( req, res )
	})

	app.use( '/v1/:collection/id/:_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	// count

	app.get( '/v1/count/', (req, res) => {
		reads.readCount( req, res )
	})

	app.get( '/v1/count/:owner_id', (req, res) => {
		reads.readCount( req, res)
	})

	app.get( '/v1/:collection/count/', (req, res) => {
		reads.readCount( req, res )
	})

	app.get( '/v1/:collection/count/:owner_id', (req, res) => {
		reads.readCount( req, res  )
	})

	app.use( '/v1/count/', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	app.use( '/v1/count/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	app.use( '/v1/:collection/count/', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	app.use( '/v1/:collection/count/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	// hash | hashData

	app.get( '/v1/hash/:hash', (req, res) => {
		reads.readHash( req, res )
	})

	app.use( '/v1/hash/:hash', (req, res) => {
		improperMethod( req, res ) 
	})

	app.get( '/v1/hash/:hash/:owner_id', (req, res) => {
		reads.readHash( req, res )
	})

	app.use( '/v1/hash/:hash/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	app.get( '/v1/:collection/hash/:hash', (req, res) => {
		reads.readHash( req, res )
	})

	app.use( '/v1/:collection/hash/:hash', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	app.get( '/v1/:collection/hash/:hash/:owner_id', (req, res) => {
		reads.readHash( req, res )
	})

	app.use( '/v1/:collection/hash/:hash/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	// last | newest | most recent

	app.get( '/v1/last/:owner_id', (req, res) => {
		reads.readOwner( req, res )
	})

	app.get( '/v1/last/:owner_id/:limit', (req, res) => {
		reads.readOwner( req, res ) 
	})

	app.get( '/v1/last/:owner_id/:limit/page/:page', (req, res) => {
		reads.readOwner( req, res ) 
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

	app.get( '/v1/:collection/last/:owner_id', (req, res) => {
		reads.readOwner( req, res )
	})

	app.get( '/v1/:collection/last/:owner_id/:limit', (req, res) => {
		reads.readOwner( req, res )
	})

	app.get( '/v1/:collection/last/:owner_id/:limit/page/:page', (req, res) => {
		reads.readOwner( req, res ) 
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
	
	// first | oldest

	app.get( '/v1/first/:owner_id', (req, res) => {
		reads.readOwner( req, res, 1 )
	})

	app.get( '/v1/first/:owner_id/:limit', (req, res) => {
		reads.readOwner( req, res, 1 ) 
	})

	app.get( '/v1/first/:owner_id/:limit/page/:page', (req, res) => {
		reads.readOwner( req, res, 1 )
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

	app.get( '/v1/:collection/first/:owner_id', (req, res) => {
		reads.readOwner( req, res, 1 )
	})

	app.get( '/v1/:collection/first/:owner_id/:limit', (req, res) => {
		reads.readOwner( req, res, 1 )
	})

	app.get( '/v1/:collection/first/:owner_id/:limit/page/:page', (req, res) => {
		reads.readOwner( req, res, 1 )
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

	// 404 everything else 
	
	app.use(( req, res ) => { 
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )
		let apiHandler = req.app.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Path does not exist', false, 404 )
		apiHandler.logRequest( err.code, err.code, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	})
}