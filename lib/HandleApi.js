'use strict' 

const hash 			 = require('object-hash')
const sizeOf 		 = require('object-sizeof')
const isObj 		 = require('isobject')

const Constants 	 = require('./Consts')
const HandleError	 = require('./HandleError')
const HandleDB	 	 = require('./HandleDb')
const HandleCache 	 = require('./HandleCache')


process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise ----- \n\n', p ,' \n\n\nreason:', reason , '\n\n\n');
 });


module.exports = function( config ) {
	
	// to do: 
	// write tests
	// write docs
	// support for reverse order by calls
	// support for count calls

	// reaches:
	// callback function option? [Lambda]
	// configure automatedssl with greenlock? [SSL]
	// web socket support? (ws-express)
	// mqtt support? (mosca)

	this.config = config
	if( config.MONGO !== false ) {
		this.sto = new HandleDB( 'MONGO', config.MONGO, config.DEFAULT_COLLECTION )
		this.sto.connect().then( ( result ) => {
			if( this.config.LOGGING_ENABLED ) {
				this.sto.setLogCollection( this.config.LOGGING_COLLECTION )
			}
		}).catch( ( err ) => {
			HandleError( '[DB] Connection failed :: ' + err, true )
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
				let hour_limit = new Promise( ( res, rej ) => {
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
				}).then( ( hour_fine ) => {
					let day_limit = new Promise( ( res, rej ) => {
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
					}).then( ( day_fine ) => {
						let month_limit = new Promise( ( res, rej ) => {
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
						}).then( ( month_fine ) => {
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
			let do_not_log = true
			this.readOwner( collection, owner, limit, api_key, page, sort, do_not_log ).then( ( checkData ) => {
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
						this.logRequest( Constants.write, owner, api_key )	
						resolve( data )
					}, ( error ) => {
						this.logRequest( Constants.write, owner, api_key, error )
						reject( HandleError( error ) )
					} )
				} else {
					let error = '[API] Duplicate data - skipping insert ' + hashData	
					this.logRequest( Constants.write, owner, api_key, error )
					reject( HandleError( error, false, 409 ) )
				}	
			}, ( error ) => {
				this.sto.insert( insertData, collection ).then( ( data ) => {
						this.logRequest( Constants.write, owner, api_key )	
						resolve( data )
					}, ( error ) => {
						this.logRequest( Constants.write, owner, api_key, error )
						reject( HandleError( error ) )
					})
			})
		})
	}

	this.deleteHashData = function( collection, hashData, api_key ) {
		return new Promise( ( resolve, reject ) => {
			this.sto.findByHash( hashData, collection ).then( (data) => {
				if( !data ) {
					reject( HandleError( '[API] No Data' ) )
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
			let do_not_log = true
			this.readOwner( collection, owner, limit, api_key, page, sort, do_not_log ).then((dataset) => {
				if( skip !== false ) {
					dataset = dataset.slice( parseInt( skip ) )
				}
				let deleted = []
				new Promise( ( res, rej ) => {
					dataset.map((data) => {
						deleted.push( data.hashData )
						this.deleteHashData(collection, data.hashData, api_key).then( (suc) => {
							res(true)
						} ).catch( (err) => {
							rej(err)
						})
					})
				}).then( (suc ) => {
					resolve( deleted )
				}).catch( (err) => {
					reject( err )
				} )
			}).catch( (err) => {
				reject( err )
			})
			
		}) 
	}

	this.readOwner = function( collection, owner, limit, api_key, page = false, sort = -1, do_not_log = false ) {
		return new Promise( (resolve, reject) => {
			let cache_key = collection + '__' + owner
			if( parseInt(sort) == 1 ) {
				cache_key = cache_key + '__first'
			}
			if( parseInt( limit ) === 1 && this.config.CACHE_ENABLED && this.cache.get( cache_key ) && page === false ) {
				if( do_not_log !== true ) {
					this.logRequest( Constants.read, owner, api_key )	
				}
				resolve( this.cache.get( cache_key ) )	
			} else {
				this.sto.findByOwner( owner, limit, collection, page, sort ).then( ( data ) => {
					if( !data || data.length === 0 ) {
						if( do_not_log === true ) { // initial insert for collection
							resolve( {hashData:false} )
						} else {
							let error = HandleError( '[API] No Data', false )
							this.logRequest( Constants.read, owner, api_key, error )
							reject( error )
						}
					} else {
						if( do_not_log !== true ) {
							this.logRequest( Constants.read, owner, api_key )
						}
						if( limit === 1 && page === false ) {
							this.cache.set( cache_key, data[0], this.config.CACHE_TTL )	
							resolve( data[0] )
						} else if( data[0] && page === false ) {
							this.cache.set( cache_key, data[0], this.config.CACHE_TTL )	
						}
						resolve( data )
					}
				}, ( error ) => {
					if( !error || error.length === 0 ) {
						error = HandleError( '[API] No Data', false )
					}
					this.logRequest( Constants.read, owner, api_key, error )
					reject( error )
				} )
			}
		})
	}

	this.readFromHash = function( collection, hashData, apiKey ) {
		return new Promise(( resolve, reject ) => {	
			let cache_key = collection+'__'+hashData
			if( this.config.CACHE_ENABLED && this.cache.get( cache_key ) ) {
				this.logRequest( Constants.read, false, apiKey )
				resolve( this.cache.get( cache_key ) )
			} else {
				this.sto.findByHash( hashData, collection ).then( (data) => {
					if( this.config.CACHE_ENABLED ) {
						this.cache.set( cache_key, data, this.config.CACHE_TTL )
					}
					this.logRequest( Constants.read, false, apiKey )
					resolve( data )
				}, (error) => {
					if( !error || error.length === 0 ) {
						error =  HandleError( '[API] No Data', false )
					}
					this.logRequest( Constants.read, false, apiKey, error )
					reject( error )
				})
			}
		})
	}

	this.readCount = function( collection, owner, apiKey ) {
		return new Promise(( resolve, reject ) => {	
			let cache_key = collection+'__'+owner+'__count'
			if( owner !== false && this.config.CACHE_ENABLED && this.cache.get( cache_key ) ) {
				this.logRequest( Constants.read, false, apiKey )
				resolve( {count: this.cache.get( cache_key)} )
			} else {
				this.sto.findCount( owner, collection ).then( (data) => {
					if( this.config.CACHE_ENABLED ) {
						this.cache.set( cache_key , data, this.config.CACHE_TTL )
					}
					this.logRequest( Constants.read, false, apiKey )
					resolve( {count: data} )
				}, (error) => {
					if( !error || error.length === 0 ) {
						error =  HandleError( '[API] No Data', false )
					}
					this.logRequest( Constants.read, false, apiKey, error )
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
				this.checkLimits( Constants.write, body.owner, apiKey ).then( ( suc ) => {
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
				this.checkLimits( Constants.write, false, apiKey ).then( ( suc ) => {
					if( body.hashData ) {
						this.deleteHashData( collection, body.hashData, apiKey ).then( ( msg ) => {
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
				}, ( err ) => {
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
				this.checkLimits( Constants.read, owner, apiKey ).then( ( suc ) => {
					this.readOwner( collection, owner, limit, apiKey, page, sort ).then( ( resolvedData ) => {
						resolve( {data: resolvedData} )
					}, ( err ) => {
						reject( err )
					}) 
				}, ( err ) => {
					reject( err )
				})
			} else {
				this.logRequest( Constants.read, owner, apiKey, '/last', 'Invalid API Key' )
				reject( HandleError( '[API] Invalid API Key - ' + validKey, false, 401 ) )
			}
		})
	}

	this.handleFindHashCall = function( apiKey, collection, hashData ) {
		collection = this.isCollection( collection )
		return new Promise( (resolve, reject ) => {
			let validKey = this.validateKey( apiKey, Constants.read, collection )
			if( validKey === true ) {	
				this.checkLimits( Constants.read, false, apiKey ).then( ( suc ) => {
					this.readFromHash( collection, hashData, apiKey ).then( ( resolvedData ) => {
						resolve( {data: resolvedData} )
					}, ( err ) => {
						reject( err )
					})
				}, ( err ) => {
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
				this.checkLimits( Constants.read, false, apiKey ).then( ( suc ) => {
					this.readCount( collection, owner, apiKey ).then( ( resolvedData ) => {
						resolve( {data: resolvedData} )
					}, ( err ) => {
						reject( err )
					})
				}, ( err ) => {
					reject( err )
				})
			} else {
				reject( HandleError( '[API] Invalid API Key - ' +validKey, false, 401 ) )
			}
		})
	}
}

	
