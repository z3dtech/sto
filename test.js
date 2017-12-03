'use strict'
// Test Config File

const request				 = require('request');
const expect 				 = require('chai').expect
const it 					 = require('mocha').it
const describe 				 = require('mocha').describe
const jsonfile				 = require('jsonfile-commentless')
const Constants				 = require('./lib/Consts')
const HandleConfig			 = require('./lib/HandleConfig')
const HandleError			 = require('./lib/HandleError')
const configfile 			 = './'+Constants.configFileName //__dirname + '/' + Constants.configFileName

const testOwner = 'test'
const testCollection = 'testdbonly'
const testApiKey = 'testkey'

describe( 'HTTP API Tests', function() {
	let port, config, data, hash, hash2, protocol, id
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
					if( config.SSL_ENABLED === true) {
						protocol = 'https'
					} else {
						protocol = 'http'
					}
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
				url: protocol + '://localhost:' + port + '/'
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				done()
			})
	} )
	
	it('Insert Call Test ', function(done) {
		data = {rand:Math.random()}
		insertRandom(data.rand).then((suc)=>{
			hash = suc.data.inserted.hashData
			done()
		}).catch((err)=>{
			expect( err ).to.be.a('null')
			done()
		})
	});



	it('Count should be 1', function(done) {
		let uri = protocol + '://localhost:' + port + '/v1/' + testCollection + '/count/' + testOwner 
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
					url: protocol+'://localhost:' + port + '/v1/insert',
					form: { 
						data: data,
						owner: testOwner,
						collection: testCollection 
					},
					json: true
				}, (err, res) => {
					if( config.STORE_DUPLICATES === false ) {
						expect( err ).to.be.a('null')
						expect( res.body.errors ).to.be.an('array')
					} else {
						expect( err ).to.be.a('null')
						expect( res.body.data.inserted.hashData ).to.be.a('string')
					}
					done()
				})
	})

	it('Last Call works as expected', function(done) {
		let uri = protocol+'://localhost:' + port + '/v1/' + testCollection + '/last/' + testOwner 
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
		let uri = protocol+'://localhost:' + port + '/v1/' + testCollection + '/hash/' + hash 
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


	it('Handle 5 sto write calls in <2seconds', function(done) {
		Promise.all([insertRandom(),insertRandom(),insertRandom(),insertRandom()]).then((suc) => {
			expect( suc.length ).to.equal(4)
			return insertRandom()
		}).then((suc) => {
			hash2 = suc.data.inserted.hashData
			done()
		}).catch((err)=>{
			expect( err ).to.be.a('null')
			expect( false ).to.be(true)
			done()
		})
	})

	it('Pagination works as expected', function(done) {
		let uri = protocol+'://localhost:' + port + '/v1/' + testCollection + '/last/' + testOwner + '/4/page/1'
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
	
	it('First call works as expected', function(done) {
		let uri = protocol+'://localhost:' + port + '/v1/' + testCollection + '/first/' + testOwner
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
		let uri = protocol+'://localhost:' + port + '/v1/' + testCollection + '/count/' + testOwner 
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
		let deleteOwner = { collection: testCollection, owner: testOwner, skip: 2 }
		let uri = protocol+'://localhost:' + port + '/v1/delete'
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

	it('Skip delete works as expected -- only the last 2 inserted values remains', function(done) {
		let uri = protocol+'://localhost:' + port + '/v1/' + testCollection + '/last/' + testOwner + '/5'
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
				expect( lastBody.data.length).to.equal(2)
				expect( lastBody.data[0].hashData ).to.equal(hash2)
				id = lastBody.data[1]['_id']
				hash = lastBody.data[1].hash
				done()
			})		
	})


	it('Skip delete works as expected -- count should now be 2', function(done) {
		let uri = protocol+'://localhost:' + port + '/v1/' + testCollection + '/count/' + testOwner 
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
				expect( count.data.count ).to.equal(2)
				done()
			})		
	})



	it('Find by Id works as expected', function(done) {
		let uri = protocol+'://localhost:' + port + '/v1/' + testCollection + '/id/' + id 
		request({
				headers: {
					authorization: "Basic api_key="+testApiKey
				},
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				let data = res.body
				expect( data.hashData ).to.equal(hash)
				done()
			})	
	})

	
	it('Update by id works as expected', function(done) {
		let data = {rand:37}
		let uri = protocol+'://localhost:' + port + '/v1/update'
		request.put({
				headers: {
					authorization: "Basic api_key="+testApiKey
				},
				form: { 
						data: data,
						id: id,
						collection: testCollection 
					},
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				done()
			})	
	})


	it('Find by Id works as expected again [second update verification]', function(done) {
		let uri = protocol+'://localhost:' + port + '/v1/' + testCollection + '/id/' + id 
		request({
				headers: {
					authorization: "Basic api_key="+testApiKey
				},
				url: uri,
				json: true
			}, (err,res) => {
				expect( err ).to.be.a('null')
				expect( res.statusCode ).to.equal(200)
				expect( res.body.data.content.rand ).to.equal('37')
				done()
			})		
	})

	
	it('Delete by Id should work as expected', function(done) {
		
		let deleteId = { collection: testCollection, id: id }
		let uri = protocol+'://localhost:' + port + '/v1/delete'
		request.delete({
			headers: {
				authorization: "Basic api_key="+testApiKey
			},
			form: deleteId,
			json: true,
			url: uri
		}, (err,res) => {
			expect( err ).to.be.a('null')
			expect( res.statusCode ).to.equal(200)
			let deletedBody = res.body
			expect( deletedBody.data.deleted.id ).to.equal(id)
			done()
		})
	})



	it('Also count should be 1 regardless of ownership', function(done) {
		let uri = protocol+'://localhost:' + port + '/v1/' + testCollection + '/count/'
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
		let uri = protocol+'://localhost:' + port + '/v1/delete'
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
			expect( lastBody.data[0].deleted.hashData ).to.equal(hash2)
			done()
		})
	})


	it('Empty table -- count should be 0', function(done) {
		let uri = protocol+'://localhost:' + port + '/v1/' + testCollection + '/count/' +testOwner
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
	
	// clearLogs for testKey?

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
					url: protocol+'://localhost:' + port + '/v1/insert',
					form: { 
						data: data,
						owner: testOwner,
						collection: testCollection 
					},
					json: true
				}, function(err,res) {
					expect( err ).to.be.a('null')
					if( err !== null ) {
						reject(err)
					}
					expect( res.statusCode ).to.equal(201)
					let body = res.body
					expect( body.data.inserted.hashData ).to.be.a('string')
					//expect( body.data.inserted.id ).to.be.a('string')
					resolve(body)
				})
		})
	}

});
