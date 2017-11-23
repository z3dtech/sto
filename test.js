'use strict'
// Test Config File

const request				 = require('request');
const expect 		 		 = require('chai').expect
const jsonfile				 = require('jsonfile-commentless')
const Constants 	 		 = require('./lib/Consts')
const HandleConfig			 = require('./lib/HandleConfig')
const HandleError 			 = require('./lib/HandleError')
const configfile 		 	 = './'+Constants.configFileName //__dirname + '/' + Constants.configFileName

const testOwner = 'test'
const testCollection = 'testdbonly'
const testApiKey = 'testkey'

describe( 'HTTP API Tests', function() {
	let port, config, data, hash, hash2
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
		insertRandom(data.rand).then((suc)=>{
			hash = suc.data.inserted
			done()
		}).catch((err)=>{done()})
	 });



	it('Count should be 1', function(done) {
		let uri = 'http://localhost:' + port + '/v1/' + testCollection + '/count/' + testOwner 
		request({
				headers: {
				  	authorization: "Basic api_key="+testApiKey
				  },
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let count = res.body
				expect( count.data.count ).to.equal(1)
				done()
			})		
	})


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
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let lastBody = res.body
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
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let hashBody = res.body
				expect( hashBody.data.hashData ).to.equal(hash)
				expect( parseFloat( hashBody.data.content.rand ) ).to.equal( data.rand )
				done()
			})		
	})


	it('Pagination works as expected', function(done) {
		insertRandom().then((suc)=>{
			return insertRandom()
		}).then((suc)=>{
			return insertRandom()
		}).then((suc)=>{
			return insertRandom()
		}).then((suc)=>{
			return insertRandom()
		}).then((suc)=>{
			hash2 = suc.data.inserted
			let uri = 'http://localhost:' + port + '/v1/' + testCollection + '/last/' + testOwner + '/4/page/1'
			request({
				headers: {
				  	authorization: "Basic api_key="+testApiKey
				  },
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let lastBody = res.body
				expect( lastBody.data[1].hashData ).to.equal(hash)
				done()
			})
		})
	})
	
	it('First call works as expected', function(done) {
		let uri = 'http://localhost:' + port + '/v1/' + testCollection + '/first/' + testOwner
		request({
				headers: {
				  	authorization: "Basic api_key="+testApiKey
				  },
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let firstBody = res.body
				expect( firstBody.data.hashData ).to.equal(hash)
				done()
			})		
	})

	it('Fetch count works as expected', function(done) {
		let uri = 'http://localhost:' + port + '/v1/' + testCollection + '/count/' + testOwner 
		request({
				headers: {
				  	authorization: "Basic api_key="+testApiKey
				  },
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let count = res.body
				expect( count.data.count ).to.equal(6)
				done()
			})		
	})

	it('Delete by owner works as expected [includes half second delay]', function(done) {
		let deleteOwner = { collection: testCollection, owner: testOwner, skip: 1 }
		let uri = 'http://localhost:' + port + '/v1/delete'
		request.delete({
			headers: {
			  	authorization: "Basic api_key="+testApiKey
			  },
			form: deleteOwner,
		    json: true,
			url: uri
		}, (err,res) => {
			expect( err ).to.be.a('null')
			expect( res.statusCode ).to.equal(200)
			let lastBody = res.body
			expect( lastBody.data.deleted.indexOf( hash ) ).to.not.equal(-1)
			expect( lastBody.data.deleted.indexOf( hash2 ) ).to.equal(-1)
			setTimeout( function() {
				done()
			}, 500 ) // sometimes takes a second
		})
	})

	it('Skip delete works as expected -- only the last inserted value remains', function(done) {
		let uri = 'http://localhost:' + port + '/v1/' + testCollection + '/last/' + testOwner 
		request({
				headers: {
				  	authorization: "Basic api_key="+testApiKey
				  },
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let lastBody = res.body
				expect( lastBody.data.hashData ).to.equal(hash2)
				done()
			})		
	})


	it('Skip delete works as expected -- count should now be 1', function(done) {
		let uri = 'http://localhost:' + port + '/v1/' + testCollection + '/count/' + testOwner 
		request({
				headers: {
				  	authorization: "Basic api_key="+testApiKey
				  },
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let count = res.body
				expect( count.data.count ).to.equal(1)
				done()
			})		
	})

	it('Also count should be 1 regardless of ownership', function(done) {
		let uri = 'http://localhost:' + port + '/v1/' + testCollection + '/count/'
		request({
				headers: {
				  	authorization: "Basic api_key="+testApiKey
				  },
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let count = res.body
				expect( count.data.count ).to.equal(1)
				done()
			})		
	})


	it('Delete by hash works as expected', function(done) {
		let deleteHash = { collection: testCollection, hashData: hash2 }
		let uri = 'http://localhost:' + port + '/v1/delete'
		request.delete({
			headers: {
			  	authorization: "Basic api_key="+testApiKey
			  },
			form: deleteHash,
		    json: true,
			url: uri
		}, (err,res) => {
			expect( err ).to.be.a('null')
			expect( res.statusCode ).to.equal(200)
			let lastBody = res.body
			expect( lastBody.data[0].deleted ).to.equal(hash2)
			done()
		})
	})


	it('Empty table -- count should be 0', function(done) {
		let uri = 'http://localhost:' + port + '/v1/' + testCollection + '/count/' +testOwner
		request({
				headers: {
				  	authorization: "Basic api_key="+testApiKey
				  },
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let count = res.body
				expect( count.data.count ).to.equal(0)
				done()
			})		
	})



	// clearLogs for testKey

	const insertRandom = function( rand = false ) {
		if( !rand ) {
			rand = Math.random()
		}
		data = {rand:rand}
		return new Promise( ( resolve, reject) => {
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
				}, function(err,res) {
					expect( err ).to.be.a('null')
					if( err !== null ) {
						reject(err)
					}
					expect( res.statusCode ).to.equal(201)
					let body = res.body
					expect( body.data.inserted ).to.be.a('string')
					resolve(body)
				})
		})
	}

});