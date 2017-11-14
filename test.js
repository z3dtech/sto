'use strict'
// Test Config File

const request				 = require('request');
const expect 		 		 = require('chai').expect
const jsonfile				 = require('jsonfile')
const Constants 	 		 = require('./lib/Consts')
const HandleConfig			 = require('./lib/HandleConfig')
const HandleError 			 = require('./lib/HandleError')
const configfile 		 	 = './'+Constants.configFileName //__dirname + '/' + Constants.configFileName

const testOwner = 'test'
const testCollection = 'testdbonly'
const testApiKey = 'testkey'

describe( 'HTTP API Tests', function() {
	let port, config, data, hash
	it('Config File is Readable', function(done) {
		jsonfile.readFile( configfile, function( err, configRead ) {
				if( err ) {
					HandleError( '[TEST] Unable to read or parse config file: ' + configfile + '\n Run the setup function to rebuild it: sto setup' )
					done()
				} else {
					expect( configRead ).to.not.be.an('undefined')
					let handleConfig = new HandleConfig()
					expect( handleConfig.errorCheckConfig(configRead) ).to.equal(true)
					config = configRead
					port = configRead.PORT
					done()	
				}
			})
	})

	it('Port is set', function(done) {
		expect(port).to.be.a('number')
		done()
	})

	it( 'Server is Up', function(done) {
		request({
				url: 'http://localhost:' + port + '/'
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				done()
			})
	} )
	
	it('Insert Call Test ', function(done) {
		data = {rand:Math.random()}
		request.post({
				  headers: {
				  	'content-type' : 'application/json',
				  	authorization: "Basic api_key="+testApiKey
				  },
				  url:     'http://localhost:' + port + '/v1/insert',
				  form:    { data: data,
				  			owner: testOwner,
				  			collection: testCollection },
				  json: true
				}, (err, res) => {
					expect( err ).to.be.a('null')
					expect( res.statusCode ).to.equal(201)
					let body = res.body
					expect( body.data.inserted ).to.be.a('string')
	  				hash = body.data.inserted
					done()
				})
	 });
	it('Insert Duplicate Data Works as Expected', function(done) {
		request.post({
		  headers: {
		  	'content-type' : 'application/json',
		  	authorization: "Basic api_key="+testApiKey
		  },
		  url:     'http://localhost:' + port + '/v1/insert',
		  form:    { data: data,
		  			owner: testOwner,
		  			collection: testCollection },
		  json: true
		}, (err, res) => {
			if( config.STORE_DUPLICATES === false ) {
				expect( err ).to.be.a('null')
				expect( res.body.errors ).to.be.an('array')
			} else {
				expect( err ).to.be.a('null')
				expect( res.body.data.inserted ).to.be.a('string')
			}
			done()
		})
	})
	it('Last Call works as expected', function(done) {
		let uri = 'http://localhost:' + port + '/v1/' + testCollection + '/last/' + testOwner 
		request({
				headers: {
				  	authorization: "Basic api_key="+testApiKey
				  },
				url: uri
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let lastBody = JSON.parse( res.body )
				expect( lastBody.data.hashData ).to.equal(hash)
				expect( parseFloat( lastBody.data.content.rand ) ).to.equal( data.rand )
				done()
			})		
	})

	it('Fetch by hash works as expected', function(done) {
		let uri = 'http://localhost:' + port + '/v1/' + testCollection + '/hash/' + hash 
		request({
				headers: {
				  	authorization: "Basic api_key="+testApiKey
				  },
				url: uri
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let hashBody = JSON.parse( res.body )
				expect( hashBody.data.hashData ).to.equal(hash)
				expect( parseFloat( hashBody.data.content.rand ) ).to.equal( data.rand )
				done()
			})		
	})

});