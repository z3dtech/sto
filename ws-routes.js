'use strict'

const bodyParser     = require('body-parser')
const helmet 		 = require('helmet')

const reads 		 = require('./routes/ws/reads')
const writes	 	 = require('./routes/ws/writes')

module.exports = function(app) {

	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(bodyParser.json())
	app.use(helmet())

	/* 
		ALTER DATA
	*/


	app.ws( '/insert', ( ws, req ) => { 
		ws.on('message', (msg) => {
			writes.insert( ws, req, msg ) 
		})	
	})

	
	app.ws( '/update', ( ws, req ) => { 
		ws.on('message', (msg) => {
			writes.update( ws, req, msg ) 
		})
	})

	
	app.ws( '/delete/', ( ws, req ) => { 
		ws.on('message', (msg) => {
			writes.delete( ws, req, msg ) 
		})
	})
		
	

	// READ

	// id

	app.ws( '/id/:_id', (ws, req) => {
		reads.readId( ws, req ) 
	})

	
	app.ws( '/:collection/id/:_id', (ws, req) => {
		reads.readId( ws, req )
	})

	
	// count

	app.ws( '/count/', (ws, req) => {
		reads.readCount( ws, req )
	})

	app.ws( '/count/:owner_id', (ws, req) => {
		reads.readCount( ws, req)
	})

	app.ws( '/:collection/count/', (ws, req) => {
		reads.readCount( ws, req )
	})

	app.ws( '/:collection/count/:owner_id', (ws, req) => {
		reads.readCount( ws, req  )
	})

	
	
	
	
	// hash | hashData

	app.ws( '/hash/:hash', (ws, req) => {
		reads.readHash( ws, req )
	})

	
	app.ws( '/hash/:hash/:owner_id', (ws, req) => {
		reads.readHash( ws, req )
	})

	
	app.ws( '/:collection/hash/:hash', (ws, req) => {
		reads.readHash( ws, req )
	})

	
	app.ws( '/:collection/hash/:hash/:owner_id', (ws, req) => {
		reads.readHash( ws, req )
	})

	
	// last | newest | most recent

	app.ws( '/last/:owner_id', (ws, req) => {
		reads.readOwner( ws, req )
	})

	app.ws( '/last/:owner_id/:limit', (ws, req) => {
		reads.readOwner( ws, req ) 
	})

	app.ws( '/last/:owner_id/:limit/page/:page', (ws, req) => {
		reads.readOwner( ws, req ) 
	})

	
	
	
	app.ws( '/:collection/last/:owner_id', (ws, req) => {
		reads.readOwner( ws, req )
	})

	app.ws( '/:collection/last/:owner_id/:limit', (ws, req) => {
		reads.readOwner( ws, req )
	})

	app.ws( '/:collection/last/:owner_id/:limit/page/:page', (ws, req) => {
		reads.readOwner( ws, req ) 
	})
	
	
	
		
	// first | oldest

	app.ws( '/first/:owner_id', (ws, req) => {
		reads.readOwner( ws, req, 1 )
	})

	app.ws( '/first/:owner_id/:limit', (ws, req) => {
		reads.readOwner( ws, req, 1 ) 
	})

	app.ws( '/first/:owner_id/:limit/page/:page', (ws, req) => {
		reads.readOwner( ws, req, 1 )
	})

	
	
	
	app.ws( '/:collection/first/:owner_id', (ws, req) => {
		reads.readOwner( ws, req, 1 )
	})

	app.ws( '/:collection/first/:owner_id/:limit', (ws, req) => {
		reads.readOwner( ws, req, 1 )
	})

	app.ws( '/:collection/first/:owner_id/:limit/page/:page', (ws, req) => {
		reads.readOwner( ws, req, 1 )
	})
	
}