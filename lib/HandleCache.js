'use strict' 

const NodeCache 	 = require('node-cache')
const Constants 	 = require('./Consts')

module.exports = function( redis = false ) {
	// leave room for redis integration

	if( redis === false ) {
		this.cache = new NodeCache({ stdTTL: 3600 })
	}

	this.get = function( key ) {
		return this.cache.get( key )
	}

	this.set = function( key, val, ttl = 3600 ) {
		this.cache.set( key, val, ttl )
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