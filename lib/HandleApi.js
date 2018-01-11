'use strict' 

const hash 			 = require('object-hash')
const sizeOf 		 = require('object-sizeof')
const isObj 		 = require('isobject')

const Constants 	 = require('./Consts')
const HandleError	 = require('./HandleError')
const HandleDB	 	 = require('./HandleDb')
const HandleCache 	 = require('./HandleCache')


process.on('unhandledRejection', (reason, p) => {
	let err = "Unexpected Promise Rejection"
	let code = 400
	//console.log( "ERROR PROMISE ", reason, "\n\nETC. ", p )
	HandleError(err, false, code, p.toString()+"::"+reason.toString())
 })


module.exports = function( config ) {

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
	this.cache = new HandleCache( config.REDIS_URL )
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
					return 'Limited/No Access to this Dataset'
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
		if( this.config.LOGGING_ENABLED !== true || typeof this.config.API_AUTH_KEYS === 'undefined' || typeof this.config.API_AUTH_KEYS[ api_key ] === 'undefined') {
			return false
		} else {	
			let typeLabel = Constants.limitPrefix + type
			let apiAuth = this.config.API_AUTH_KEYS[ api_key ]
			let limiter = this.getLimiter( apiAuth, typeLabel )
			let cacheLabel = type + ( limiter === 'owner' ? owner : api_key )
			if( error === false ) {
				this.cache.incrementCache( cacheLabel )	
			}
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
			let limit = ( limiter === 'owner' ? owner : api_key )
			let cacheLabel = type + limit
			let hourCountLabel = Constants.hourCount + cacheLabel
			let dayCountLabel = Constants.dayCount + cacheLabel
			let monthCountLabel = Constants.monthCount + cacheLabel
			let error_info = { api_key: api_key, owner: owner } 
			if( limiter === false || ( limiter === 'owner' && owner === false ) ) {
				resolve( true )
			} else if( this.cache.get( hourCountLabel ) && this.cache.get( dayCountLabel ) && this.cache.get( monthCountLabel ) ) {
				error_info.source = 'cache'
				if( apiAuth[typeLabel].HOUR > -1 && this.cache.get( hourCountLabel ) > apiAuth[typeLabel].HOUR ) {
					error_info.requestCount = this.cache.get( hourCountLabel ) + '/' + apiAuth[typeLabel].HOUR
					reject( HandleError( '[API] Hour Limit Exceeded', false, 429, error_info ) )
				} else if( apiAuth[typeLabel].DAY > -1 && this.cache.get( dayCountLabel ) > apiAuth[typeLabel].DAY ) {
					error_info.requestCount =  this.cache.get( dayCountLabel ) + '/' + apiAuth[typeLabel].DAY
					reject( HandleError( '[API] Day Limit Exceeded', false, 429, error_info ) )
				} else if( apiAuth[typeLabel].MONTH > -1 && this.cache.get( monthCountLabel ) > apiAuth[typeLabel].MONTH ) {
					error_info.requestCount = this.cache.get( monthCountLabel ) + '/' + apiAuth[typeLabel].MONTH
					reject( HandleError( '[API] Month Limit Exceeded', false, 429, error_info ) )
				} else {
					resolve( true )	
				}
			} else {
				error_info.source = 'db'
				const checkLimitFor = ( TIME, timeLabel ) => {
					return new Promise( ( res, rej ) => {
						if( typeof apiAuth[typeLabel][TIME] !== 'undefined' && parseInt( apiAuth[typeLabel][TIME] ) > -1 ) {
							this.sto.checkLogs( type, TIME, limiter, limit ).then( ( countTime ) => {
								this.cache.set( timeLabel, countTime, this.config.CACHE_TTL )
								if( countTime > parseInt( apiAuth[typeLabel][TIME] ) ) {
									let errorDesc = TIME.charAt(0).toUpperCase() + TIME.slice(1).toLowerCase()
									error_info.requestCount = countTime + '/' + apiAuth[typeLabel][TIME]
									rej( HandleError( '[API] ' + errorDesc + ' Limit Exceeded', false, 429, error_info ) )
								} else {
									res(true)
								}	
							})
						} else {
							res(true)
						}
					})
				}
				Promise.all( [ checkLimitFor( 'HOUR', hourCountLabel ), checkLimitFor( 'DAY', dayCountLabel ), checkLimitFor( 'MONTH', monthCountLabel ) ] ).then( () => { 
					resolve( true )
				}).catch( ( err ) => {
					reject( err )
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
						this.cache.set( cache_key_owner, insertData, this.config.CACHE_TTL )
						let cache_key_count = collection+'__'+owner+'__count'	
						if( this.cache.get( cache_key_count ) ) {
							this.cache.del( cache_key_count ) // could increment, will delete for now
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
					HandleError( errorReading, false, 200 )
					this.sto.insert( insertData, collection ).then( ( data ) => {
						resolve( data )
					}).catch( ( errorInserting ) => {
						reject( HandleError( errorInserting ) )
					})
			})
		})
	}


	this.clearCache = function( collection, data ) {
		collection = this.isCollection( collection )
		if( typeof data['_id'] !== 'undefined' ) {
			let cache_key_id = collection+'__id__'+data['_id']
			this.cache.del( cache_key_id )
		}

		if( typeof data.hashData !== 'undefined' ) {
			let cache_key_hash = collection+'__'+data.hashData 
			this.cache.del( cache_key_hash )
			if( typeof data.owner !== 'undefined' ) {
				let cache_key_owner = collection+'__'+data.owner
				let cache_key_owner_first = collection+'__'+data.owner+'__first'					
				if( this.cache.get( cache_key_owner ) && this.cache.get( cache_key_owner ).hashData === data.hashData ) {
					this.cache.del( cache_key_owner )
				}
				if( this.cache.get( cache_key_owner_first ) && this.cache.get( cache_key_owner_first ).hashData === data.hashData ) {
					this.cache.del( cache_key_owner_first )
				}
				let cache_key_count = collection+'__'+data.owner+'__count'
				this.cache.del( cache_key_count ) 
			}
		}
		
	}

	this.updateData = function( collection, id, content ) {
		return new Promise( ( resolve, reject ) => {
			if( !isObj( content ) ) {
				reject( reject( HandleError( '[API] Unable to process data object -- is the JSON encoded properly?', false, 422 ) ) )
			}
			this.readId( collection, id ).then( (data) => {
				this.clearCache( collection, data )
				let hashData = hash( content )
				let updateData = {content: content, hashData: hashData, modifiedAt: new Date() }
				this.sto.update( id, updateData, collection ).then( ( data ) => {
					resolve( data )
				}).catch( ( error ) => {
					reject( HandleError( error ) )
				})
			}).catch( (err) => {
				reject( err )
			})
		})
	}

	this.updateOwner = function( collection, new_owner, old_owner ) {
		return new Promise( ( resolve, reject ) => {
			let cache_key_owner = collection+'__'+old_owner
			let cache_key_owner_first = collection+'__'+old_owner+'__first'					
			this.cache.del( cache_key_owner )
			this.cache.del( cache_key_owner_first )
			this.sto.updateOwner( new_owner, old_owner, collection ).then( ( data ) => {
				resolve( data )
			}).catch( ( error ) => {
				reject( HandleError( error ) )
			})
		})
	}


	this.deleteIdData = function( collection, id ) {
		return new Promise( ( resolve, reject ) => {
			this.readId( collection, id ).then( (data) => {
				if( !data ) {
					reject( HandleError( '[API] No Data For id ' + id ) )
				}
				this.clearCache( collection, data )
				this.sto.deleteIdData( id, collection ).then( ( msg ) => {
					resolve( msg )
				}).catch( ( err ) => {
					reject( err )
				}) 	
			}).catch( (err) => {
				reject( err )
			})
		}) 
	}


	this.deleteHashData = function( collection, hashData, owner = false ) {
		return new Promise( ( resolve, reject ) => {
			this.sto.findByHash( hashData, collection, owner ).then( (data) => {
				if( !data ) {
					reject( HandleError( '[API] No Data For ' + hashData ) )
				}
				this.clearCache( collection, data )
				this.sto.deleteHashData( hashData, collection, owner ).then( ( msg ) => {
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
				let dataset_async = dataset.map( (data) => {
						return this.sto.deleteIdData( data['_id'], collection ).then( () => {
							this.clearCache( collection, data )
							deleted.push( data.hashData )
						})
					})
				Promise.all( dataset_async ).then( ( ) => {
					resolve( deleted )
				}).catch( (err) => {
					reject( err )
				} )
			}).catch( (err) => {
				reject( err )
			})
			
		}) 
	}

	this.readId = function( collection, id ) {
		return new Promise( (resolve, reject) => {
			if( typeof id === 'undefined' ) {
				reject( HandleError( "[API] ID not set" ) )
			}
			let cache_key_id = collection+'__id__'+id
			if( this.cache.get( cache_key_id ) ) {
				resolve( this.cache.get( cache_key_id ) )
			}
			this.sto.findById( id, collection ).then( ( resolvedData ) => {
				this.cache.set( cache_key_id, resolvedData )
				resolve( resolvedData )
			}).catch( ( err ) => {
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
				resolve( {count: this.cache.get( cache_key ) } )
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

	this.handleKeyValidation = function( api_key ) {
		return new Promise( ( res, rej ) => {
			let r = { read: true, write: true, delete: true }
			if( this.validateKey( api_key, Constants.read ) !== true ) {
				r.read = false
			}
			if( this.validateKey( api_key, Constants.write ) !== true ) {
				r.write = false
			}
			if( this.validateKey( api_key, Constants.delete ) !== true ) {
				r.delete = false
			}
			if( !r.read && !r.write && !r.delete ) {
				rej( HandleError( "Invalid API Key" ) )
			} else {
				res( r )
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



	this.handleUpdateCall = function( apiKey, body ) {
		let collection = this.isCollection( ( typeof body.collection !== 'undefined' ? body.collection : false ) )
		return new Promise( (resolve, reject) => {
			let validKey = this.validateKey( apiKey, Constants.write, collection )
			if( validKey === true ) {	
				this.checkLimits( Constants.write, body.owner, apiKey ).then( (  ) => {
					let apiAuth = this.config.API_AUTH_KEYS[ apiKey ]
					if( typeof apiAuth[ Constants.limitPrefix + Constants.write ] === 'undefined' || typeof apiAuth[ Constants.limitPrefix + Constants.write ].SIZE === 'undefined' || parseInt( apiAuth[ Constants.limitPrefix + Constants.write ].SIZE ) > parseInt( sizeOf( body.data ) ) ) {
						this.updateData( collection, body.id, body.data, apiKey ).then( ( msg ) => {
							resolve( { data: {inserted: msg } } )
						}, ( err ) => {
							reject( err )
						})
					} else {
						reject( HandleError( '[API] Data has permission issues or exceeds size limit', false, 400 ) )
					}	
						
				}, ( err ) => {
					reject( err ) 
				})	 
			} else {
				reject( HandleError( '[API] Invalid API Key - ' + validKey, false, 401 ) )
			}
		} )
	}



	this.handleUpdateOwnerCall = function( apiKey, body ) {
		let collection = this.isCollection( ( typeof body.collection !== 'undefined' ? body.collection : false ) )
		return new Promise( (resolve, reject) => {
			let validKey = this.validateKey( apiKey, Constants.write, collection )
			if( validKey === true ) {	
				this.checkLimits( Constants.write, body.owner, apiKey ).then( (  ) => {
					this.updateOwner( collection, body.new_owner, body.old_owner, apiKey ).then( ( msg ) => {
						resolve( { data: {updated: msg } } )
					}, ( err ) => {
						reject( err )
					})
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
						let owner = (typeof body.owner !== "undefined" ? body.owner : false)
						this.deleteHashData( collection, body.hashData, owner ).then( ( msg ) => {
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
					} else if( body.id ) {
						this.deleteIdData( collection, body.id, apiKey ).then( ( msg ) => {
							resolve( { data: {deleted: msg } } )
						}, ( err ) => {
							reject( HandleError( '[API] Delete by Id Failed ', false, 400, err ) )
						})
					} else {
						reject( HandleError( '[API] Broken Delete Request. You need to include either an id, an owner, a hash, or a hash+owner to delete.' ) )
					}					
				}).catch( ( err ) => {
					reject( err ) 
				})	 
			} else {
				reject( HandleError( '[API] Invalid API Key - ' + validKey, false, 401 ) )
			}
		} )
	}

	this.handleFindIdCall = function( apiKey, collection, id ) {
		collection = this.isCollection( collection )
		return new Promise( (resolve, reject ) => {
			let validKey = this.validateKey( apiKey, Constants.read, collection )
			if( validKey === true ) {	
				this.checkLimits( Constants.read, false, apiKey ).then( (  ) => {
					this.readId( collection, id ).then( (resolvedData) => {
						resolve( {data: resolvedData} )
					}).catch(  (err) => {
						reject( HandleError( err.toString() ) )
					})
				}).catch( ( err ) => {
					reject( err )
				})
			} else {
				reject( HandleError( '[API] Invalid API Key - ' + validKey, false, 401 ) )
			}
		})
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

	
