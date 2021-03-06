'use strict' 

const mongodb 		 = require('mongodb')
const MongoClient  	 = require('mongodb').MongoClient
const HandleError	 = require('./HandleError')

module.exports = function( type, uri, defaultTable = false ) {
	this.type = type
	this.uri = uri
	this.defaultTable = defaultTable
	this.indexed = {}

	// will convert this into an interface with typescript
	// then extend with specific classes for mongo, sequelize, aurora, etc.
	if( this.type === 'MONGO' ) {
		this.connect = function() {
			return new Promise( (resolve, reject) => {
				MongoClient.connect( this.uri, ( err, db ) => {
					if( err ) {
						reject(HandleError( '[MONGO] ' + err.message, true ))
					} else {
						this.db = db
						clearTimeout(x)
						resolve(true)
					}
				})
				let x = setTimeout(function() {
					reject(HandleError('[MONGO] Unable to connect to Mongo URI - timed out after ' + 15 + ' seconds', true))
				}, 15000); 
			})
		}

		this.testConnect = function( ) {
			return new Promise( ( resolve ) => { // no reject function necessary because config handler will treat anything other than true as a rejection
					MongoClient.connect( this.uri ).then( ( ) => {
						clearTimeout(x)
						resolve(true)
					}).catch( ( err ) => {
						resolve( 'Unable to connect to Mongo URI : ' + err.message )
					})
					let x = setTimeout(function() {
						resolve('Unable to connect to Mongo URI - timed out after ' + 15 + ' seconds');
					}, 15000);
				})
		}

		this.indexCollection = function( collection = false ) {
			if( typeof this.db !== 'undefined' ) {
				let checkedCollection = this.db.collection( collection )
				if( this.indexed[collection] !== true ) {
					checkedCollection.createIndex( { owner: 1, createdAt: -1 } )
					checkedCollection.createIndex( { hashData: 1 } )
					this.indexed[collection] = true	
				}
			}
		}

		this.setLogCollection = function( collection ) {
			this.logs = this.db.collection( collection )
			this.logs.createIndex( { createdAt: -1, log_key: 1 } )
		}

		this.log = function( type, owner, api_key, error = false ) {
			if( this.logs ) {
				this.logs.insert( { type: type, owner: owner, api_key: api_key, error: error, createdAt: new Date().getTime() } )		
			}
		}

		this.checkLogs = function( type, length, limiter, limit ) {
			let query = { error: false, type: type }
			query[limiter] = limit 
			let now = new Date()
			if( length === 'HOUR' ) {
				query.createdAt =  { $gt: ( new Date( now.getTime() - 1000 * 60 * 60) ).getTime() } 	
			} else if( length === 'DAY' ) {
				query.createdAt = { $gt: ( new Date( now.getTime() - 1000 * 60 * 60 * 24) ).getTime() } 
			} else if( length === 'MONTH' ) {
				query.createdAt = { $gt: ( new Date( now.getFullYear(), now.getMonth(), 1 ).getTime() ) } 
			}
			return this.logs.find( query ).count()
		}

		this.insert = function( data, collection ) {
			return new Promise( (resolve, reject) => {
				this.db.collection( collection ).insert( data, ( err ) => {
					if( err && err !== null ) {
						let error = '[DB] Failed Insert for ' + data.owner;
						reject( HandleError( error, false, 400, err.errmsg ) )
					} else {
						resolve( { hashData: ( typeof data.hashData !== 'undefined' ? data.hashData : false ), id: data['_id'] } )
					}
				})		
			})
		}

		this.update = function( id, data, collection ) {
			return new Promise( (resolve, reject) => {
				this.db.collection( collection ).update( {_id: new mongodb.ObjectId(id)}, { $set: data }, {upsert: false, multi: false}, ( err ) => {
					if( err && err !== null ) {
						let error = '[DB] Failed Update for ' + data.id;
						reject( HandleError( error, false, 400, err.errmsg ) )
					} else {
						resolve( {hashData: ( typeof data.hashData !== 'undefined' ? data.hashData : data ), id: id } )
					}
				})		
			})
		}
		
		this.updateOwner = function( new_owner, old_owner, collection ) {
			return new Promise( (resolve, reject) => {
				this.db.collection( collection ).update( {owner: old_owner}, { $set: {owner: new_owner} }, {upsert: false, multi: true}, ( err ) => {
					if( err && err !== null ) {
						let error = '[DB] Failed Update for ' + old_owner
						reject( HandleError( error, false, 400, err.errmsg ) )
					} else {
						resolve( {owner: new_owner, prev: old_owner} )
					}
				})		
			})
		}


		this.deleteIdData = function( id, collection ) {
			return new Promise( (resolve, reject) => {
				let query = { _id:  new mongodb.ObjectId(id) }
				this.db.collection( collection ).deleteOne( query, ( err ) => {
					if( err ) {
						let error = '[DB] Failed Delete for id: ' + id;
						reject( HandleError( error, false, 400, err.errmsg ) )
					} else {
						resolve( {id: id} )
					}
				})		
			})
		}

		this.deleteHashData = function( hashData, collection, owner = false ) {
			return new Promise( (resolve, reject) => {
				let query = { hashData: hashData }
				if( owner !== false ) {
					query.owner = owner
				}
				this.db.collection( collection ).deleteMany( query, ( err ) => {
					if( err ) {
						let error = '[DB] Failed Delete for hashData: ' + hashData;
						reject( HandleError( error, false, 400, err.errmsg ) )
					} else {
						resolve( {hashData: hashData} )
					}
				})		
			})
		}


		// this method might be a little too complicated
		this.findByOwner = function( owner_id, limit, collection, page = false, sort = -1 ) {
			return new Promise( (resolve, reject) => {
				let options = { sort: {createdAt: sort} }
				if( limit !== false ) {
					options.limit = limit 
				}
				if( page === false || page < 1 ) { // if theres no pagination
					this.db.collection( collection ).find( { owner: owner_id }, options).toArray( ( err, data ) => {
						if( err ) {
							let error = '[DB] Issue Finding Data For Owner ' + owner_id + ' (There Was An Error)'
							reject( HandleError( error, false, 400, err.errmsg ) )
						}  else if( !data ) {
							let error = '[DB] No Data For Owner ' + owner_id
							reject( HandleError( error, false ) )
						} else {
							resolve( data )
						}
					})	
				} else { // if here is pagination
					options.limit = options.limit * page
					this.db.collection( collection ).find( { owner: owner_id }, options).toArray( ( err, allData ) => {
						if( err || !allData || typeof allData[0] === 'undefined' ) {
							let error = '[DB] Issue Finding Data For Owner ' + owner_id + ' (There Was An Error)'
							reject( HandleError( error, false, 400, ( err ? err.errmsg : false )) )
						} else {
							let pageVal = allData.pop()
							let query = { owner: owner_id, createdAt: { $lt: pageVal.createdAt }, hashData: { $ne: pageVal.hashData } }
							if( sort === 1 ) {
								query.createdAt =  { $gt: pageVal.createdAt }
							}
							let params = { sort: {createdAt: sort}, limit: limit }
							this.db.collection( collection ).find( query, params).toArray( ( err, data ) => {
								if( err ) {
									let error = '[DB] Issue Finding Data For Owner ' + owner_id + ' (There Was An Error)'
									reject( HandleError( error, false, 400, err.errmsg ) )
								}  else if( !data ) {
									let error = '[DB] No Data For Owner ' + owner_id
									reject( HandleError( error, false ) )
								} else {
									resolve( data )
								}
							})
						}	
					})
				}
			})
		}

		this.findByHash = function( hashData, collection, owner = false ) {
			return new Promise( (resolve, reject) => {
				let query = { hashData: hashData }
				if( owner !== false ) {
					query.owner = owner
				}
				this.db.collection( collection ).findOne( query, ( err, data ) => {
					if( err ) {
						let error = '[DB] Issue Finding Data For Hash ' + hashData
						reject( HandleError( error, false, 400, err.errmsg ) )
					} else if( !data ) {
						let error = '[DB] No Data For Hash ' + hashData
						reject( HandleError( error, false, 410 ) )
					} else {		
						resolve( data )
					}
				})	
			})
		}


		this.findById = function( id, collection ) {
			return new Promise( (resolve, reject) => {
				let query = { _id: new mongodb.ObjectId(id) }
				this.db.collection( collection ).findOne( query, ( err, data ) => {
					if( err ) {
						let error = '[DB] Issue Finding Data For Id ' + id
						reject( HandleError( error, false, 400, err.errmsg ) )
					} else if( !data ) {
						let error = '[DB] No Data For Id ' + id
						reject( HandleError( error, false, 410 ) )
					} else {		
						resolve( data )
					}
				})	
			})
		}


		this.findCount = function( owner, collection ) {
			return new Promise( (resolve, reject) => {
				let params = []
				if( owner !== false ) {
					params.push( { $match: {owner: owner} })
				}
				params.push( { $group: { _id: null, count: { $sum: 1 } } } )
				this.db.collection( collection ).aggregate( params, ( err, count ) => {
					if( err ) {
						let error = '[DB] Issue Finding Data For Count'
						reject( HandleError( error, false, 400, err.errmsg ) )
					} else if( !count ) {
						let error = '[DB] No Data'
						reject( HandleError( error, false, 410 ) )
					} else {	
						if( count.length === 0 ) {
							resolve( 0 )
						} else {
							resolve( count[0].count ) 
						}
					}
				})	
			})
		}


	}

}