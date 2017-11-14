'use strict' 

const hash 			 = require('object-hash')
const sizeOf 		 = require('object-sizeof')

const Constants 	 = require('./Consts')
const HandleError	 = require('./HandleError')
const HandleDB	 	 = require('./HandleDb')
const HandleCache 	 = require('./HandleCache')

module.exports = function( config ) {
	
	// to do: 
	// write tests
	// write docs

	// reaches:
	// callback function option? [Lambda]
	// configure ssl with greenlock? [SSL]
	// secret support? []

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
		if( !auth || auth === "" ) {
			return false
		} else {
			let authtype = auth.split( " " )
			if( authtype[0] !== "Basic" ) {
				return false
			} else {
				let key = authtype[1].split("=")
				if( key[0].trim() === "api_key" ) {
					return key[1].trim()
				} else {
					return false
				}
			}
		}
	}


	this.validateKey = function( api_key, type = Constants.read, collection = false ) {
		let apiAuth = this.config.API_AUTH_KEYS[ api_key ]
		if( this.keyRequired === false || ( api_key !== false && typeof apiAuth !== 'undefined' && apiAuth[type] === true ) ) {
			if( typeof apiAuth.COLLECTIONS !== 'undefined' && apiAuth.COLLECTIONS[collection] !== true ) {
				return 'No Access to this Dataset'
			} else { 
				return true	
			}
		} else {
			return 'Failed to Authenticate Key'
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
			let type_label = Constants.limitPrefix + type
			let apiAuth = this.config.API_AUTH_KEYS[ api_key ]
			if( typeof apiAuth === 'undefined' ) {
				return false
			}
			let limiter = apiAuth[type_label].LIMIT_BY
			let cacheLabel = type + ( limiter === 'owner' ? owner : api_key )
			this.cache.incrementCache( cacheLabel )
			return this.sto.log( type, owner, api_key, error ) 
		}
	}


	this.checkLimits = function( type, owner, api_key ) {
		let type_label = Constants.limitPrefix + type
		let apiAuth = this.config.API_AUTH_KEYS[ api_key ]
		let limiter = apiAuth[type_label].LIMIT_BY
		let cacheLabel = type + ( limiter === 'owner' ? owner : api_key )
		return new Promise( ( resolve, reject ) => { 
			let hourCountLabel = Constants.hourCount + cacheLabel
			let dayCountLabel = Constants.dayCount + cacheLabel
			let monthCountLabel = Constants.monthCount + cacheLabel
			if( this.config.LIMITS_ENABLED === false || ( limiter === 'owner' && owner === false ) ) {
				resolve( true )
			} else if( this.cache.get( hourCountLabel ) && this.cache.get( dayCountLabel ) ) {
				if( apiAuth[type_label].HOUR > -1 && this.cache.get( hourCountLabel ) > apiAuth[type_label].HOUR ) {
					reject( HandleError( '[API] Hour Limit Exceeded', false, 429 ) )
				} else if( apiAuth[type_label].DAY > -1 && this.cache.get( dayCountLabel ) > apiAuth[type_label].DAY ) {
					reject( HandleError( '[API] Day Limit Exceeded', false, 429 ) )
				} else if( apiAuth[type_label].MONTH > -1 && this.cache.get( monthCountLabel ) > apiAuth[type_label].MONTH ) {
					reject( HandleError( '[API] Month Limit Exceeded', false, 429 ) )
				} else {
					resolve( true )	
				}
			} else {
				let hour_limit = new Promise( ( res, rej ) => {
					if( apiAuth[type_label].HOUR > -1 ) {
						this.sto.checkLogs( type, limiter, 'HOUR' ).then( ( countHour ) => {
							this.cache.set( hourCountLabel, countHour )
							if( countHour > apiAuth[type_label].HOUR ) {
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
						if( apiAuth[type_label].DAY > -1 ) {
							this.sto.checkLogs( type, limiter, 'DAY' ).then( ( count24h ) => {
								this.cache.set( dayCountLabel, count24h )
								if( count24h > apiAuth[type_label].DAY ) {
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
						if( apiAuth[type_label].MONTH > -1 ) {
							this.sto.checkLogs( type, limiter, 'MONTH' ).then( ( countMonth ) => {
								this.cache.set( monthCountLabel, countMonth )
								if( countMonth > apiAuth[type_label].MONTH ) {
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
			let hashData = hash( content )
			let insertData = {content: content, hashData: hashData, owner: owner, createdAt: new Date() }
			this.readLatest( collection, owner, 1, api_key, false, true ).then( ( checkData ) => {
				if( this.config.STORE_DUPLICATES === true || ( checkData && checkData.hashData !== hashData ) ) {
					if( this.config.CACHE_ENABLED ) {
						this.cache.set( collection+"__"+owner, insertData, this.config.CACHE_TTL )	
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
			this.sto.deleteHashData( collection, hashData ).then( ( msg ) => {
				this.cache.del( collection+"__"+hashData )
				resolve( msg )
			}).catch( ( err ) => {
				reject( err )
			}) 	
		}) 
	}

	this.deleteOwnerData = function( collection, owner, api_key  ) {
		return new Promise( ( resolve, reject ) => {
			this.sto.deleteOwner( collection, owner ).then( ( msg ) => {
				this.cache.del( collection+"__"+owner )
				resolve( msg )
			}).catch( ( err ) => {
				reject( err )
			}) 	
		}) 
	}

	this.readLatest = function( collection, owner, limit, api_key, page = false, do_not_log = false ) {
		return new Promise( (resolve, reject) => {
			if( limit === 1 && this.config.CACHE_ENABLED && this.cache.get( collection+"__"+owner ) ) {
				if( do_not_log !== true ) {
					this.logRequest( Constants.read, owner, api_key )	
				}
				resolve( this.cache.get( collection+"__"+owner ) )	
			} else {
				this.sto.findLatest( owner, limit, collection, page ).then( ( data ) => {
					if( !data ) {
						let error = HandleError( '[API] No Data', false )
						this.logRequest( Constants.read, owner, api_key, error )
						reject( error )
					} else {
						if( do_not_log !== true ) {
							this.logRequest( Constants.read, owner, api_key )
						}	
						if( limit === 1 && page === false ) {
							this.cache.set( collection+"__"+owner, data[0], this.config.CACHE_TTL )	
							resolve( data[0] )
						} else if( data[0] && page === false ) {
							this.cache.set( collection+"__"+owner, data[0], this.config.CACHE_TTL )	
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
			if( this.config.CACHE_ENABLED && this.cache.get( collection+"__"+hashData ) ) {
				this.logRequest( Constants.read, false, apiKey )
				resolve( [this.cache.get( collection+"__"+hashData )] )
			} else {
				this.sto.findByHash( hashData, collection ).then( (data) => {
					if( this.config.CACHE_ENABLED ) {
						this.cache.set( collection+"__"+hashData, data, this.config.CACHE_TTL )
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


	this.handleInsertCall = function( apiKey, body ) {
		let collection = this.isCollection( ( typeof body.collection !== 'undefined' ? body.collection : false ) )
		return new Promise( (resolve, reject) => {
			let validKey = this.validateKey( apiKey, Constants.write, collection )
			if( validKey === true ) {	
				this.checkLimits( Constants.write, body.owner, apiKey ).then( ( suc ) => {
					let apiAuth = this.config.API_AUTH_KEYS[ apiKey ]
					if( typeof apiAuth[ Constants.limitPrefix + Constants.write ].SIZE === 'undefined' || parseInt( apiAuth[ Constants.limitPrefix + Constants.write ].SIZE ) > parseInt( sizeOf( body.data ) ) ) {
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
							reject( err )
						})	
					} else if( body.owner ) {
						this.deleteOwnerData( collection, body.owner, apiKey ).then( ( msg ) => {
							resolve( { data: {deleted: msg} } )
						}, ( err ) => {
							reject( err )
						})	
					} else {
						reject( HandleError( '[API] Broken Delete Request' ) )
					}
					
				}, ( err ) => {
					reject( err ) 
				})	 
			} else {
				reject( HandleError( '[API] Invalid API Key - ' + validKey, false, 401 ) )
			}
		} )
	}

	this.handleFindLastCall = function( apiKey, collection, owner, limit, page = false ) {
		collection = this.isCollection( collection )
		return new Promise( (resolve, reject ) => {
			let validKey = this.validateKey( apiKey, Constants.read, collection )
			if( validKey === true ) {	
				this.checkLimits( Constants.read, owner, apiKey ).then( ( suc ) => {	
					this.readLatest( collection, owner, limit, apiKey, page ).then( ( resolvedData ) => {
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
}

	
