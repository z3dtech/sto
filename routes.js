'use strict'

const bodyParser     = require('body-parser')
const helmet 		 = require('helmet')
const express 		 = require('express')
const router 		 = express.Router()

const HandleError	 = require('./lib/HandleError')
const improperMethod = require('./routes/http/improperMethod')
const validateKey	 = require('./routes/http/validateKey')
const writes	 	 = require('./routes/http/writes')
const reads 		 = require('./routes/http/reads')

module.exports = function(app) {

	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(bodyParser.json())
	app.use(helmet())

	app.get( '/', (req, res) => {
		res.sendStatus(200)
	})

	router.get( '/v1/validateKey', (req, res) => {
		validateKey( req, res )
	})

	router.use( '/v1/validateKey', ( req, res ) => { 
		improperMethod( req, res ) 	
	})


	/* 
		ALTER DATA
	*/

	router.post( '/v1/insert', ( req, res ) => { 
		writes.insert( req, res ) 	
	})

	router.use( '/v1/insert', ( req, res ) => { 
		improperMethod( req, res, 'POST' ) 	
	})

	router.put( '/v1/update', ( req, res ) => { 
		writes.update( req, res ) 	
	})

	router.use( '/v1/update', ( req, res ) => {  
		improperMethod( req, res, 'PUT' ) 	
	})

	router.delete( '/v1/delete/', ( req, res ) => { 
		writes.delete( req, res ) 	
	})
	router.use( '/v1/delete/', ( req, res ) => { 
		improperMethod( req, res, 'DELETE' ) 	
	})
	

	// READ

	// id

	router.get( '/v1/id/:_id', (req, res) => {
		reads.readId( req, res ) 
	})

	router.use( '/v1/id/:_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.get( '/v1/:collection/id/:_id', (req, res) => {
		reads.readId( req, res )
	})

	router.use( '/v1/:collection/id/:_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	// count

	router.get( '/v1/count/', (req, res) => {
		reads.readCount( req, res )
	})

	router.get( '/v1/count/:owner_id', (req, res) => {
		reads.readCount( req, res)
	})

	router.get( '/v1/:collection/count/', (req, res) => {
		reads.readCount( req, res )
	})

	router.get( '/v1/:collection/count/:owner_id', (req, res) => {
		reads.readCount( req, res  )
	})

	router.use( '/v1/count/', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.use( '/v1/count/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.use( '/v1/:collection/count/', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.use( '/v1/:collection/count/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	// hash | hashData

	router.get( '/v1/hash/:hash', (req, res) => {
		reads.readHash( req, res )
	})

	router.use( '/v1/hash/:hash', (req, res) => {
		improperMethod( req, res ) 
	})

	router.get( '/v1/hash/:hash/:owner_id', (req, res) => {
		reads.readHash( req, res )
	})

	router.use( '/v1/hash/:hash/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.get( '/v1/:collection/hash/:hash', (req, res) => {
		reads.readHash( req, res )
	})

	router.use( '/v1/:collection/hash/:hash', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.get( '/v1/:collection/hash/:hash/:owner_id', (req, res) => {
		reads.readHash( req, res )
	})

	router.use( '/v1/:collection/hash/:hash/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	// last | newest | most recent

	router.get( '/v1/last/:owner_id', (req, res) => {
		reads.readOwner( req, res )
	})

	router.get( '/v1/last/:owner_id/:limit', (req, res) => {
		reads.readOwner( req, res ) 
	})

	router.get( '/v1/last/:owner_id/:limit/page/:page', (req, res) => {
		reads.readOwner( req, res ) 
	})

	router.use( '/v1/last/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.use( '/v1/last/:owner_id/:limit', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.use( '/v1/last/:owner_id/:limit/page/:page', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.get( '/v1/:collection/last/:owner_id', (req, res) => {
		reads.readOwner( req, res )
	})

	router.get( '/v1/:collection/last/:owner_id/:limit', (req, res) => {
		reads.readOwner( req, res )
	})

	router.get( '/v1/:collection/last/:owner_id/:limit/page/:page', (req, res) => {
		reads.readOwner( req, res ) 
	})
	
	router.use( '/v1/:collection/last/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.use( '/v1/:collection/last/:owner_id/:limit', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.use( '/v1/:collection/last/:owner_id/:limit/page/:page', ( req, res ) => { 
		improperMethod( req, res ) 
	})
	
	// first | oldest

	router.get( '/v1/first/:owner_id', (req, res) => {
		reads.readOwner( req, res, 1 )
	})

	router.get( '/v1/first/:owner_id/:limit', (req, res) => {
		reads.readOwner( req, res, 1 ) 
	})

	router.get( '/v1/first/:owner_id/:limit/page/:page', (req, res) => {
		reads.readOwner( req, res, 1 )
	})

	router.use( '/v1/first/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.use( '/v1/first/:owner_id/:limit', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.use( '/v1/first/:owner_id/:limit/page/:page', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.get( '/v1/:collection/first/:owner_id', (req, res) => {
		reads.readOwner( req, res, 1 )
	})

	router.get( '/v1/:collection/first/:owner_id/:limit', (req, res) => {
		reads.readOwner( req, res, 1 )
	})

	router.get( '/v1/:collection/first/:owner_id/:limit/page/:page', (req, res) => {
		reads.readOwner( req, res, 1 )
	})
	
	router.use( '/v1/:collection/first/:owner_id', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.use( '/v1/:collection/first/:owner_id/:limit', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	router.use( '/v1/:collection/first/:owner_id/:limit/page/:page', ( req, res ) => { 
		improperMethod( req, res ) 
	})

	// 404 everything else 
	
	router.use(( req, res ) => { 
		res.setHeader( 'Content-Type', 'application/vnd.api+json' )
		let apiHandler = req.router.get( 'apiHandler' )
		let apiKey = apiHandler.parseApiKey( req.headers.authorization )	
		let err = HandleError( '[API] Path does not exist', false, 404 )
		apiHandler.logRequest( err.code, err.code, apiKey, err.msg )
		res.status(err.code).send(err.msg)
	})

	app.use( "/", router )
}