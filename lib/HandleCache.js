'use strict' 

const NodeCache 	 = require('node-cache')
const Redis 		 = require('redis')
const Constants 	 = require('./Consts')
const HandleError	 = require('./HandleError')

module.exports = function( redis = false ) {
	// leave room for redis integration

	if( redis === false ) {
		this.cache = new NodeCache({ stdTTL: 3600 })
		this.redis = false
	} else {
		this.cache = Redis.createClient( redis, { 
			retry_strategy: function (options) {
				if (options.error && options.error.code === 'ECONNREFUSED') {
					return HandleError("Error Connecting to Redis", true, 500 )//new Error('The server refused the connection'); 
				}
			}
		} )
		this.redis = true
	}

	this.get = function( key ) {
		if( this.redis === false ) {
			return this.cache.get( key )	
		} else {
			return JSON.parse( this.cache.get( key ) )
		}
	}

	this.set = function( key, val, ttl = 3600 ) {
		if( this.redis === false ) {
			this.cache.set( key, val, ttl )	
		} else {
			this.cache.set( key, JSON.stringify( val ), 'EX', ttl )
		}
	}

	this.del = function( key) {
		this.cache.del( key )
	}

	this.flush = function() {
		this.cache.flushAll()
	}


	this.incrementCache = function( label ) {
		let hourCountLabel =  Constants.hourCount + label
		let dayCountLabel = Constants.dayCount + label
		let monthCountLabel = Constants.monthCount + label	
		if( this.cache.get( hourCountLabel ) && this.cache.get( dayCountLabel ) && this.cache.get( monthCountLabel ) ) {
			this.cache.set( hourCountLabel, this.cache.get( hourCountLabel )+1 )
			this.cache.set( dayCountLabel, this.cache.get( dayCountLabel )+1 )
			this.cache.set( monthCountLabel, this.cache.get( monthCountLabel )+1 )
		}
	}
}