'use strict' 

const MongoClient  	 = require('mongodb').MongoClient
const HandleError	 = require('./HandleError')

module.exports = function( type, uri, defaultTable = false ) {
	// leaving room to support alternatives with sequelize
	this.type = type
	this.uri = uri
	this.defaultTable = defaultTable
	this.indexed = {}

	this.createTimeout = function( seconds, request_message, callback ) {
		return setTimeout( function() {
			callback( request_message + '- timed out after ' + seconds + ' seconds')
		}, seconds*1000 )
	}

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
			return new Promise( ( resolve ) => { 
			// no reject function because config file will treat anything other than true as a rejection
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
				this.logs.insert( { type: type, owner: owner, api_key: api_key, error: error, createdAt: new Date() } )		
			}
		}

		this.checkLogs = function( type, limiter, length ) {
			let query = { error: false, type: type, limiter: limiter } 
			if( length === 'HOUR' ) {
				query.createdAt =  { $gt: ( new Date( new Date().getTime() - 1000 * 60 * 60) ) } 	
			} else if( length === 'DAY' ) {
				query.createdAt = { $gt: ( new Date( new Date().getTime() - 1000 * 60 * 60 * 24) ) } 
			} else if( length === 'MONTH' ) {
				query.createdAt = { $gt: ( new Date( new Date().getYear(), new Date().getMonth(), 1 ) ) } 
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
						resolve( ( typeof data.hashData !== 'undefined' ? data.hashData : data ) )
					}
				})		
			})
		}

		this.deleteHashData = function( hashData, collection ) {
			return new Promise( (resolve, reject) => {
				this.db.collection( collection ).deleteMany( {hashData: hashData}, ( err ) => {
					if( err ) {
						let error = '[DB] Failed Delete for hashData: ' + hashData;
						reject( HandleError( error, false, 400, err.errmsg ) )
					} else {
						resolve( hashData )
					}
				})		
			})
		}

		this.findByOwner = function( owner_id, limit, collection, page = false, sort = -1 ) {
			return new Promise( (resolve, reject) => {
				if( page === false || page < 1 ) {
					let options = { sort: {createdAt: sort} }
					if( limit !== false ) {
						options.limit = limit 
					}
					this.db.collection( collection ).find( { owner: owner_id }, options).toArray( ( err, data ) => {
						if( err ) {
							let error = '[DB] Issue Finding Data'
							reject( HandleError( error, false, 400, err.errmsg ) )
						}  else if( !data ) {
							let error = '[DB] No Data'
							reject( HandleError( error, false ) )
						} else {
							resolve( data )
						}
					})	
				} else {
					let options = { sort: {createdAt: sort} }
					if( limit !== false ) {
						options.limit = limit * page 
					}
					this.db.collection( collection ).find( { owner: owner_id }, options).toArray( ( err, allData ) => {
						if( err || !allData ) {
							let error = '[DB] Issue Finding Data'
							reject( HandleError( error, false, 400, err.errmsg ) )
						} else {
							let pageVal = allData.pop()
							let query = { owner: owner_id, createdAt: { $lt: pageVal.createdAt }, hashData: { $ne: pageVal.hashData } }
							if( sort === 1 ) {
								query.createdAt =  { $gt: pageVal.createdAt }
							}
							let params = { sort: {createdAt: sort}, limit: limit }
							this.db.collection( collection ).find( query, params).toArray( ( err, data ) => {
								if( err ) {
									let error = '[DB] Issue Finding Data'
									reject( HandleError( error, false, 400, err.errmsg ) )
								}  else if( !data ) {
									let error = '[DB] No Data'
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

		this.findByHash = function( hashData, collection ) {
			return new Promise( (resolve, reject) => {
				this.db.collection( collection ).findOne( { hashData: hashData }, ( err, data ) => {
					if( err ) {
						let error = '[DB] Issue Finding Data'
						reject( HandleError( error, false, 400, err.errmsg ) )
					} else if( !data ) {
						let error = '[DB] No Data'
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
						let error = '[DB] Issue Finding Data'
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