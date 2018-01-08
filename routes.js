'use strict'

const bodyParser     = require('body-parser')
const helmet 		 = require('helmet')
const express 		 = require('express')
const router 		 = express.Router()

const improperMethod = require('./routes/http/improperMethod')
const error404 		 = require('./routes/http/404')
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
	

	router.get( '/validateKey', (req, res) => {
		validateKey.validate( req, res )
	})

	router.use( '/validateKey', ( req, res ) => { 
		improperMethod.error405( req, res ) 	
	})


	/* 
		ALTER DATA
	*/

	router.post( '/insert', ( req, res ) => { 
		writes.insert( req, res ) 	
	})


	router.put( '/update', ( req, res ) => { 
		writes.update( req, res ) 	
	})

	router.delete( '/delete/', ( req, res ) => { 
		writes.delete( req, res ) 	
	})

	router.use( '/insert', ( req, res ) => { 
		improperMethod.error405( req, res, 'POST' ) 	
	})
	
	router.use( '/update', ( req, res ) => {  
		improperMethod.error405( req, res, 'PUT' ) 	
	})

	router.use( '/delete/', ( req, res ) => { 
		improperMethod.error405( req, res, 'DELETE' ) 	
	})
	

	// READ

	// id

	router.get( '/id/:_id', (req, res) => {
		reads.readId( req, res ) 
	})

	router.get( '/:collection/id/:_id', (req, res) => {
		reads.readId( req, res )
	})

	router.use( '/id/:_id', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/:collection/id/:_id', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	// count

	router.get( '/count/', (req, res) => {
		reads.readCount( req, res )
	})

	router.get( '/count/:owner_id', (req, res) => {
		reads.readCount( req, res)
	})

	router.get( '/:collection/count/', (req, res) => {
		reads.readCount( req, res )
	})

	router.get( '/:collection/count/:owner_id', (req, res) => {
		reads.readCount( req, res  )
	})

	router.use( '/count/', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/count/:owner_id', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/:collection/count/', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/:collection/count/:owner_id', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	// hash | hashData

	router.get( '/hash/:hash', (req, res) => {
		reads.readHash( req, res )
	})

	router.get( '/hash/:hash/:owner_id', (req, res) => {
		reads.readHash( req, res )
	})

	router.get( '/:collection/hash/:hash', (req, res) => {
		reads.readHash( req, res )
	})

	router.get( '/:collection/hash/:hash/:owner_id', (req, res) => {
		reads.readHash( req, res )
	})

	router.use( '/hash/:hash', (req, res) => {
		improperMethod.error405( req, res ) 
	})

	router.use( '/hash/:hash/:owner_id', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/:collection/hash/:hash', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/:collection/hash/:hash/:owner_id', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	// last | newest | most recent

	router.get( '/last/:owner_id', (req, res) => {
		reads.readOwner( req, res )
	})

	router.get( '/last/:owner_id/:limit', (req, res) => {
		reads.readOwner( req, res ) 
	})

	router.get( '/last/:owner_id/:limit/page/:page', (req, res) => {
		reads.readOwner( req, res ) 
	})

	router.use( '/last/:owner_id', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/last/:owner_id/:limit', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/last/:owner_id/:limit/page/:page', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	// -- Additional Collections

	router.get( '/:collection/last/:owner_id', (req, res) => {
		reads.readOwner( req, res )
	})

	router.get( '/:collection/last/:owner_id/:limit', (req, res) => {
		reads.readOwner( req, res )
	})

	router.get( '/:collection/last/:owner_id/:limit/page/:page', (req, res) => {
		reads.readOwner( req, res ) 
	})
	
	router.use( '/:collection/last/:owner_id', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/:collection/last/:owner_id/:limit', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/:collection/last/:owner_id/:limit/page/:page', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})
	
	// first | oldest

	router.get( '/first/:owner_id', (req, res) => {
		reads.readOwner( req, res, 1 )
	})

	router.get( '/first/:owner_id/:limit', (req, res) => {
		reads.readOwner( req, res, 1 ) 
	})

	router.get( '/first/:owner_id/:limit/page/:page', (req, res) => {
		reads.readOwner( req, res, 1 )
	})

	router.use( '/first/:owner_id', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/first/:owner_id/:limit', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/first/:owner_id/:limit/page/:page', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})


	// -- Custom Collections


	router.get( '/:collection/first/:owner_id', (req, res) => {
		reads.readOwner( req, res, 1 )
	})

	router.get( '/:collection/first/:owner_id/:limit', (req, res) => {
		reads.readOwner( req, res, 1 )
	})

	router.get( '/:collection/first/:owner_id/:limit/page/:page', (req, res) => {
		reads.readOwner( req, res, 1 )
	})
	
	router.use( '/:collection/first/:owner_id', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/:collection/first/:owner_id/:limit', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	router.use( '/:collection/first/:owner_id/:limit/page/:page', ( req, res ) => { 
		improperMethod.error405( req, res ) 
	})

	// 404 everything else 
	
	router.use(( req, res ) => { 
		error404.error404( req, res )
	})

	return router
}