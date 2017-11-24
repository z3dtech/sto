'use strict' 

const hash 			 = require('object-hash')
const sizeOf 		 = require('object-sizeof')
const isObj 		 = require('isobject')

const Constants 	 = require('./Consts')
const HandleError	 = require('./HandleError')
const HandleDB	 	 = require('./HandleDb')
const HandleCache 	 = require('./HandleCache')


process.on('unhandledRejection', (reason, p) => {
	//console.log('Unhandled Rejection at: Promise ----- \n\n', p ,' \n\n\nreason:', reason , '\n\n\n');
	let err = "Unexpected Promise Rejection"
	let code = 400
	if( isObj( p ) ) {
		p = p.toString()
	}
	if( p === false ) {
		p = ''
	}
	if( isObj( reason ) ) {
		reason = reason.toString()
	}
	HandleError(err, code, p+"::"+reason)
 });


module.exports = function( config ) {
	
	// to do: 
	// write docs

	// reaches:
	// callback function option? [Lambda]
	// configure automatedssl with greenlock? [SSL]
	// web socket support? (ws-express)
	// mqtt support? (mosca)
	// handle file uploads?

	this.config = config
	if( config.MONGO !== false ) {
		this.sto = new HandleDB( 'MONGO', config.MONGO, config.DEFAULT_COLLECTION )
		this.sto.connect().then( (  ) => {
			if( this.config.LOGGING_ENABLED ) {
				this.sto.setLogCollection( this.config.LOGGING_COLLECTION )
			}
		}).catch( ( err ) => {
			HandleError( '[DB] Connection failed' + err, true, err )
		})
	}
	this.cache = new HandleCache()
	this.keyRequired = config.API_AUTH_ENABLED

	this.parseApiKey = function( auth ) {
		if( !auth || auth === '' ) {
			return false
		} else {
			let authtype = auth.split( ' ' )
			if( authtype[0] !== 'Basic' ) {
				return false
			} else {
				let key = authtype[1].split('=')
				if( key[0].trim() === 'api_key' ) {
					return key[1].trim()
				} else {
					return false
				}
			}
		}
	}

	this.validateKey = function( api_key, type = Constants.read, collection = false ) {
		if( this.keyRequired === false ) {
			return true
		} else {
			let apiAuth = this.config.API_AUTH_KEYS[ api_key ]
			if( ( api_key !== false && typeof apiAuth !== 'undefined' && apiAuth[type] === true ) ) {
				if( typeof apiAuth.COLLECTIONS !== 'undefined' && apiAuth.COLLECTIONS[collection] !== true ) {
					return 'Limited Access to this Dataset'
				} else { 
					return true	
				}
			} else {
				return 'Failed to Authenticate Key'
			}
		}
	}

	this.isCollection = function( collection ) {
		if( collection === false ) {
			this.sto.indexCollection( this.config.DEFAULT_COLLECTION )
			return this.config.DEFAULT_COLLECTION
		} else {
			this.sto.indexCollection( collection )
			return collection
		}
	}

	this.logRequest = function( type, owner, api_key, error = false ) {
		if( this.config.LOGGING_ENABLED !== true ) {
			return false
		} else {	
			if( typeof this.config.API_AUTH_KEYS === 'undefined' || typeof this.config.API_AUTH_KEYS[ api_key ] === 'undefined' ) {
				return false
			}
			let typeLabel = Constants.limitPrefix + type
			let apiAuth = this.config.API_AUTH_KEYS[ api_key ]
			let limiter = this.getLimiter( apiAuth, typeLabel )
			let cacheLabel = type + ( limiter === 'owner' ? owner : api_key )
			this.cache.incrementCache( cacheLabel )
			return this.sto.log( type, owner, api_key, error ) 
		}
	}

	this.getLimiter = function( apiAuth, typeLabel ) {
		let limiter = false
		if( typeof apiAuth[typeLabel] !== 'undefined' && apiAuth[typeLabel].LIMIT_BY !== 'undefined' ) {
			limiter = apiAuth[typeLabel].LIMIT_BY
		} 
		return limiter
	}

	this.checkLimits = function( type, owner, api_key ) {
		return new Promise( ( resolve, reject ) => { 
			if( this.config.LIMITS_ENABLED === false || this.config.API_AUTH_ENABLED === false ) {
				resolve( true )
			}
			let typeLabel = Constants.limitPrefix + type
			let apiAuth = this.config.API_AUTH_KEYS[ api_key ]
			let limiter = this.getLimiter( apiAuth, typeLabel )
			let cacheLabel = type + ( limiter === 'owner' ? owner : api_key )
			let hourCountLabel = Constants.hourCount + cacheLabel
			let dayCountLabel = Constants.dayCount + cacheLabel
			let monthCountLabel = Constants.monthCount + cacheLabel
			if( limiter === false || ( limiter === 'owner' && owner === false ) ) {
				resolve( true )
			} else if( this.cache.get( hourCountLabel ) && this.cache.get( dayCountLabel ) ) {
				if( apiAuth[typeLabel].HOUR > -1 && this.cache.get( hourCountLabel ) > apiAuth[typeLabel].HOUR ) {
					reject( HandleError( '[API] Hour Limit Exceeded', false, 429 ) )
				} else if( apiAuth[typeLabel].DAY > -1 && this.cache.get( dayCountLabel ) > apiAuth[typeLabel].DAY ) {
					reject( HandleError( '[API] Day Limit Exceeded', false, 429 ) )
				} else if( apiAuth[typeLabel].MONTH > -1 && this.cache.get( monthCountLabel ) > apiAuth[typeLabel].MONTH ) {
					reject( HandleError( '[API] Month Limit Exceeded', false, 429 ) )
				} else {
					resolve( true )	
				}
			} else {

				// REPLACE WITH A PROMISE.ALL 

				new Promise( ( res ) => { // hour limit
					if( apiAuth[typeLabel].HOUR > -1 ) {
						this.sto.checkLogs( type, limiter, 'HOUR' ).then( ( countHour ) => {
							this.cache.set( hourCountLabel, countHour )
							if( countHour > apiAuth[typeLabel].HOUR ) {
								reject( HandleError( '[API] Hour Limit Exceeded', false, 429 ) )
							} else {
								res(true)
							}	
						})
					} else {
						res(true)
					}
				}).then( (  ) => {
					new Promise( ( res ) => { // day limit
						if( apiAuth[typeLabel].DAY > -1 ) {
							this.sto.checkLogs( type, limiter, 'DAY' ).then( ( count24h ) => {
								this.cache.set( dayCountLabel, count24h )
								if( count24h > apiAuth[typeLabel].DAY ) {
									reject( HandleError( '[API] Day Limit Exceeded', false, 429 ) )
								} else {
									res( true )
								}
							})
						} else {
							res( true )
						}
					}).then( (  ) => { // month limit
						new Promise( ( res ) => {
						if( apiAuth[typeLabel].MONTH > -1 ) {
							this.sto.checkLogs( type, limiter, 'MONTH' ).then( ( countMonth ) => {
								this.cache.set( monthCountLabel, countMonth )
								if( countMonth > apiAuth[typeLabel].MONTH ) {
									reject( HandleError( '[API] Month Limit Exceeded', false, 429 ) )
								} else {
									res( true )
								}
							})
						} else {
							res( true )
						}
						}).then( ( ) => { // all good
							resolve( true )
						})
					})
				})
			}
		})
	}

	this.insertData = function( collection, owner, content, api_key ) {
		return new Promise( ( resolve, reject ) => {
			if( !isObj( content ) ) {
				reject( reject( HandleError( '[API] Unable to process data object -- is the JSON encoded properly?', false, 422 ) ) )
			}
			let hashData = hash( content )
			let insertData = {content: content, hashData: hashData, owner: owner, createdAt: new Date() }
			let limit = 1
			let page = false
			let sort = -1
			let init = true
			this.readOwner( collection, owner, limit, api_key, page, sort, init ).then( ( checkData ) => {
				if( this.config.STORE_DUPLICATES === true || ( checkData && checkData.hashData !== hashData ) ) {
					if( this.config.CACHE_ENABLED ) {
						let cache_key_owner = collection+'__'+owner
						this.cache.set( cache_key_owner, insertData )
						let cache_key_count = collection+'__'+owner+'__count'	
						if( this.cache.get( cache_key_count ) ) {
							this.cache.del( cache_key_count )//this.cache.set( this.cache.get( cache_key_count ) + 1 )
						}
					}
					this.sto.insert( insertData, collection ).then( ( data ) => {
						resolve( data )
					}).catch( ( error ) => {
						reject( HandleError( error ) )
					} )
				} else {
					let error = '[API] Duplicate data - skipping insert ' + hashData	
					reject( HandleError( error, false, 409 ) )
				}	
			}).catch( ( errorReading ) => {
					// possibly log a warning? errorReading?
					HandleError( errorReading, false, 200 )
					this.sto.insert( insertData, collection ).then( ( data ) => {
						resolve( data )
					}).catch( ( errorInserting ) => {
						reject( HandleError( errorInserting ) )
					})
			})
		})
	}

	this.deleteHashData = function( collection, hashData ) {
		return new Promise( ( resolve, reject ) => {
			this.sto.findByHash( hashData, collection ).then( (data) => {
				if( !data ) {
					reject( HandleError( '[API] No Data For ' + hashData ) )
				}
				let cache_key_owner = collection+'__'+data.owner
				let cache_key_owner_first = collection+'__'+data.owner+'__first'
				
				let cache_key_count = collection+'__'+data.owner+'__count'
				let cache_key_hash = collection+'__'+hashData 
				if( this.cache.get( cache_key_owner ) && this.cache.get( cache_key_owner ).hashData === hashData ) {
					this.cache.del( cache_key_owner )
				}
				if( this.cache.get( cache_key_owner_first ) && this.cache.get( cache_key_owner_first ).hashData === hashData ) {
					this.cache.del( cache_key_owner_first )
				}
				if( this.cache.get( cache_key_count ) ) {
					this.cache.del( cache_key_count ) //this.cache.set( this.cache.get( cache_key_count ) - 1 )
				}

				this.sto.deleteHashData( hashData, collection ).then( ( msg ) => {
					this.cache.del(cache_key_hash) // should return error code 410? discuss
					resolve( msg )
				}).catch( ( err ) => {
					reject( err )
				}) 	
			})
		}) 
	}

	this.deleteOwnerData = function( collection, owner, api_key, skip = false  ) {
		return new Promise( ( resolve, reject ) => {
			let limit = false
			let page = false
			let sort = -1
			let init = true
			this.readOwner( collection, owner, limit, api_key, page, sort, init ).then((dataset) => {
				if( skip !== false ) {
					dataset = dataset.slice( parseInt( skip ) )
				}
				let deleted = []
				new Promise( ( res, rej ) => {
					dataset.map((data) => {
						deleted.push( data.hashData )
						this.deleteHashData(collection, data.hashData ).then( () => {
							res(true)
						} ).catch( (err) => {
							rej(err)
						})
					})
				}).then( ( ) => {
					resolve( deleted )
				}).catch( (err) => {
					reject( err )
				} )
			}).catch( (err) => {
				reject( err )
			})
			
		}) 
	}

	this.readOwner = function( collection, owner, limit, api_key, page = false, sort = -1, init = false ) {
		return new Promise( (resolve, reject) => {
			let cache_key = collection + '__' + owner
			if( parseInt(sort) == 1 ) {
				cache_key = cache_key + '__first'
			}
			if( parseInt( limit ) === 1 && this.config.CACHE_ENABLED && this.cache.get( cache_key ) && page === false ) {
				resolve( this.cache.get( cache_key ) )	
			} else {
				this.sto.findByOwner( owner, limit, collection, page, sort ).then( ( data ) => {
					if( !data || data.length === 0 ) {
						if( init === true ) { // initial insert for collection
							resolve( {hashData:false} )
						} else {
							let error = HandleError( '[API] No Data For ' + owner, false )
							reject( error )
						}
					} else {
						if( limit === 1 && page === false ) {
							this.cache.set( cache_key, data[0], this.config.CACHE_TTL )	
							resolve( data[0] )
						} else if( data[0] && page === false ) {
							this.cache.set( cache_key, data[0], this.config.CACHE_TTL )	
						}
						resolve( data )
					}
				}).catch( ( error ) => {
					if( !error || error.length === 0 ) {
						error = HandleError( '[API] No Data For ' + owner + '(An Error Occurred)', false, 400, error )
					}
					reject( error )
				} )
			}
		})
	}

	this.readFromHash = function( collection, hashData, owner = false ) {
		return new Promise(( resolve, reject ) => {	
			let cache_key = collection+'__'+hashData
			if( owner !== false ) {
				cache_key = cache_key + "__" + owner
			} 
			if( this.config.CACHE_ENABLED && this.cache.get( cache_key ) ) {
				resolve( this.cache.get( cache_key ) )
			} else {
				this.sto.findByHash( hashData, collection, owner ).then( (data) => {
					if( this.config.CACHE_ENABLED ) {
						this.cache.set( cache_key, data, this.config.CACHE_TTL )
					}
					resolve( data )
				}).catch( (error) => {
					if( !error || error.length === 0 ) {
						error =  HandleError( '[API] No Data For ' + hashData + ' (An Error Occurred)', false )
					}
					reject( error )
				})
			}
		})
	}

	this.readCount = function( collection, owner ) {
		return new Promise(( resolve, reject ) => {	
			let cache_key = collection+'__'+owner+'__count'
			if( owner !== false && this.config.CACHE_ENABLED && this.cache.get( cache_key ) ) {
		resolve( {count: this.cache.get( cache_key)} )
			} else {
				this.sto.findCount( owner, collection ).then( (data) => {
					if( this.config.CACHE_ENABLED ) {
						this.cache.set( cache_key , data, this.config.CACHE_TTL )
					}
				resolve( {count: data} )
				}).catch( (error) => {
					if( !error || error.length === 0 ) {
						error =  HandleError( '[API] No Data', false )
					}
				reject( error )
				})
			}
		})
	}



	this.handleInsertCall = function( apiKey, body ) {
		let collection = this.isCollection( ( typeof body.collection !== 'undefined' ? body.collection : false ) )
		return new Promise( (resolve, reject) => {
			let validKey = this.validateKey( apiKey, Constants.write, collection )
			if( validKey === true ) {	
				this.checkLimits( Constants.write, body.owner, apiKey ).then( (  ) => {
					let apiAuth = this.config.API_AUTH_KEYS[ apiKey ]
					if( typeof apiAuth[ Constants.limitPrefix + Constants.write ] === 'undefined' || typeof apiAuth[ Constants.limitPrefix + Constants.write ].SIZE === 'undefined' || parseInt( apiAuth[ Constants.limitPrefix + Constants.write ].SIZE ) > parseInt( sizeOf( body.data ) ) ) {
						this.insertData( collection, body.owner, body.data, apiKey ).then( ( msg ) => {
							resolve( { data: {inserted: msg } } )
						}, ( err ) => {
							reject( err )
						})
					} else {
						reject( HandleError( '[API] Data exceeds size limit', false, 400 ) )
					}	
						
				}, ( err ) => {
					reject( err ) 
				})	 
			} else {
				reject( HandleError( '[API] Invalid API Key - ' + validKey, false, 401 ) )
			}
		} )
	}

	this.handleDeleteCall = function( apiKey, body ) {
		let collection = this.isCollection( ( typeof body.collection !== 'undefined' ? body.collection : false ) )
		return new Promise( (resolve, reject) => {
			let validKey = this.validateKey( apiKey, Constants.delete, collection )
			if( validKey === true ) {	
				this.checkLimits( Constants.write, false, apiKey ).then( (  ) => {
					if( body.hashData ) {
						this.deleteHashData( collection, body.hashData ).then( ( msg ) => {
							resolve( { data:  [ {deleted: msg} ] } )
						}, ( err ) => {
							reject( HandleError( '[API] Delete by Hash Failed ', false, 400, err ) )
						})	
					} else if( body.owner ) {
						let skip = false
						if( typeof body.skip !== 'undefined' && !isNaN( body.skip ) ) {
							skip = body.skip
						}
						this.deleteOwnerData( collection, body.owner, apiKey, skip ).then( ( msg ) => {
							resolve( { data: {deleted: msg} } )
						}, ( err ) => {
							reject( HandleError( '[API] Delete by Owner Failed ', false, 400, err ) )
						})	
					} else {
						reject( HandleError( '[API] Broken Delete Request. You need to include either an owner or a hash to delete.' ) )
					}					
				}).catch( ( err ) => {
					reject( HandleError( '[API] Limit Check Failed ', false, 400, err ) ) 
				})	 
			} else {
				reject( HandleError( '[API] Invalid API Key - ' + validKey, false, 401 ) )
			}
		} )
	}

	this.handleFindOwnerCall = function( apiKey, collection, owner, limit, page = false, sort = -1 ) {
		collection = this.isCollection( collection )
		return new Promise( (resolve, reject ) => {
			let validKey = this.validateKey( apiKey, Constants.read, collection )
			if( validKey === true ) {	
				this.checkLimits( Constants.read, owner, apiKey ).then( (  ) => {
					this.readOwner( collection, owner, limit, apiKey, page, sort ).then( ( resolvedData ) => {
						resolve( {data: resolvedData} )
					}).catch( ( err ) => {
						reject( err )
					}) 
				}).catch( ( err ) => {
					reject( err )
				})
			} else {
		reject( HandleError( '[API] Invalid API Key - ' + validKey, false, 401 ) )
			}
		})
	}

	this.handleFindHashCall = function( apiKey, collection, hashData, owner = false ) {
		collection = this.isCollection( collection )
		return new Promise( (resolve, reject ) => {
			let validKey = this.validateKey( apiKey, Constants.read, collection )
			if( validKey === true ) {	
				this.checkLimits( Constants.read, false, apiKey ).then( (  ) => {
					this.readFromHash( collection, hashData, owner ).then( ( resolvedData ) => {
						resolve( {data: resolvedData} )
					}).catch( ( err ) => {
						reject( err )
					})
				}).catch( ( err ) => {
					reject( err )
				})
			} else {
				reject( HandleError( '[API] Invalid API Key - ' +validKey, false, 401 ) )
			}
		})
	}


	this.handleFindCountCall = function( apiKey, collection, owner ) {
		collection = this.isCollection( collection )
		return new Promise( (resolve, reject ) => {
			let validKey = this.validateKey( apiKey, Constants.read, collection )
			if( validKey === true ) {	
				this.checkLimits( Constants.read, false, apiKey ).then( ( ) => {
					this.readCount( collection, owner ).then( ( resolvedData ) => {
						resolve( {data: resolvedData} )
					}).catch( ( err ) => {
						reject( err )
					})
				}).catch( ( err ) => {
					reject( err )
				})
			} else {
				reject( HandleError( '[API] Invalid API Key - ' + validKey, false, 401 ) )
			}
		})
	}
}

	
