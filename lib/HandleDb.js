'use strict' 

const MongoClient  	 = require('mongodb').MongoClient
const Constants 	 = require('./Consts')
const HandleError	 = require('./HandleError')
const HandleApi 	 = require('./HandleApi')

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
						HandleError( '[MONGO] ' + err.message, true )
						reject()
					} else {
						this.db = db
						clearTimeout(x)
						resolve(true)
					}
				})
				let x = setTimeout(function() {
					HandleError('[MONGO] Unable to connect to Mongo URI - timed out after ' + 15 + ' seconds', true);
					reject()
		        }, 15000); 
			})
		}

		this.testConnect = function( ) {
			return new Promise( ( resolve, reject ) => {
					MongoClient.connect( this.uri ).then( ( db ) => {
						clearTimeout(x)
						resolve(true)
					}, function( err ) {
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
			let query = { error: false, type: type, limiter: ( limiter === 'owner' ? owner : api_key ) } 
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
				this.db.collection( collection ).insert( data, ( err, suc ) => {
					if( err ) {
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
				this.db.collection( collection ).deleteMany( {hashData: hashData}, ( err, suc ) => {
					if( err ) {
						let error = '[DB] Failed Delete for hashData: ' + hashData;
						reject( HandleError( error, false, 400, err.errmsg ) )
					} else {
						resolve( hashData )
					}
				})		
			})
		}

		this.deleteOwner = function( owner, collection ) {
			return new Promise( (resolve, reject) => {
				this.db.collection( collection ).deleteMany( {owner: owner}, ( err, suc ) => {
					if( err ) {
						let error = '[DB] Failed Delete for owner: ' + owner;
						reject( HandleError( error, false, 400, err.errmsg ) )
					} else {
						resolve( hashData )
					}
				})		
			})
		}


		this.findLatest = function( owner_id, limit, collection, page = false ) {
			return new Promise( (resolve, reject) => {
				if( page === false || page < 1 ) {
					this.db.collection( collection ).find( { owner: owner_id }, { sort: {createdAt: -1}, limit: limit }).toArray( ( err, data ) => {
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
					this.db.collection( collection ).find( { owner: owner_id }, { sort: {createdAt: -1}, limit: limit*page }).toArray( ( err, allData ) => {
						if( err || !allData ) {
							let error = '[DB] Issue Finding Data'
							reject( HandleError( error, false, 400, err.errmsg ) )
						} else {
							let pageVal = allData.pop()
							this.db.collection( collection ).find( { owner: owner_id, createdAt: { $lt: pageVal.createdAt }, hashData: { $ne: pageVal.hashData } }, { sort: {createdAt: -1}, limit: limit }).toArray( ( err, data ) => {
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

	}

}