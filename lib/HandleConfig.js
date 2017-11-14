'use strict' 

const jsonfile		 		 = require('jsonfile')
const inquirer 		  		 = require('inquirer')
const hat 					 = require('hat')

const server 		 	  	 = require('../server')
const Constants 		 	 = require('./Consts')
const HandleError 	 		 = require('./HandleError')
const HandleDB 	 		 	 = require('./HandleDb')

const configfile 		 	 = __dirname + '/../' + Constants.configFileName


module.exports = function( init ) {

	this.errorCheckConfig = function( config ) {
		let error = false

		if( !error && !config.PORT || isNaN( config.PORT ) || parseInt( config.PORT ) < 80 || parseInt( config.PORT ) > 65535  ) {
			error = '[CONFIG] : Can\'t listen on Port ' + config.PORT + '.'
			if( parseInt( config.PORT ) < 1024 ) {
				error = error + ' You need to run the app with sudo or root permissions.'
			}
		}

		if( !error && config.API_AUTH_ENABLED && config.API_AUTH_ENABLED === true ) {
			let valid_auth_key_exists = false
			for( var key in config.API_AUTH_KEYS ) {
				if( config.API_AUTH_KEYS[key][Constants.read] === true || config.API_AUTH_KEYS[key][Constants.write] === true ) {
					valid_auth_key_exists = true
					break
					/*
						validate each api key -- 
					*/	
					if( !error && config.LIMITS_ENABLED !== false ) {
						// check hour / daily limits
						
						/*
						let apiAuth = config.API_AUTH_KEYS[key]
						
						 else {
							if( apiAuth[Constants.write] === true && typeof apiAuth.LIMIT_WRITES === 'undefined' ) {
								error = '[CONFIG] Write Limits must be set. If you wish to have no limits for writes, set the HOUR and DAY properties to -1'
							}
							if( apiAuth[Constants.read] === true && typeof apiAuth.READ_LIMITS === 'undefined' ) {
								error = '[CONFIG] Read Limits must be set. If you wish to have no limits for reads, set the HOUR and DAY properties to -1'
							}

						}
						/*
						if( isNaN( apiAuth.LIMIT_WRITE.HOUR ) || isNaN( apiAuth.LIMIT_WRITE.DAY ) || isNaN( apiAuth.READ_LIMITS.HOUR ) || isNaN( config.READ_LIMITS.DAY )  ) {
							error = '[CONFIG] Limits must be numeric. If you wish to ignore a limit, set the value to -1.'
						}
						if( ( apiAuth.LIMIT_WRITE.LIMIT_BY === 'api_key' || config.LIMIT_WRITE.LIMIT_BY === 'api_key' ) && config.API_AUTH_ENABLED !== true ) {
							error = '[CONFIG] To limit by API key, API key auth must be enabled.'
						}
						*/
					}
					
				}
			}
			if( !error && config.LIMITS_ENABLED !== false && config.LOGS_ENABLED === false ) {
				error = '[CONFIG] Logs must be enabled to enforce limits.'
			}
			if( !error && valid_auth_key_exists === false ) {
				error = '[CONFIG] If API Keys are required, there must be a valid API key.'
			}
		}
		if( error ) {
			HandleError( error, true )
		} else {
			return true	
		}
	}


	this.generatePrompt = function( options ) {
		return inquirer.prompt( options )
	}

	this.buildFile = function(config_input) {
		return new Promise( (res, rej ) => {
			jsonfile.readFile( './config.example.json', function( err, config ) { 
				if( err ) {
					HandleError( '[CONFIG] Something went wrong.', true )
				} else {
					config.MONGO = config_input.MONGO
					config.PORT = parseInt( config_input.PORT )
					config.API_AUTH_ENABLED = config_input.API_AUTH_ENABLED
					if( config.API_AUTH_ENABLED ) {
						config.LIMITS_ENABLED = ( config_input.READ_LIMIT || config_input.WRITE_LIMIT )
						let newApiKeyConfiguration = {
												READ: config_input.READ_ENABLED,
												WRITE: config_input.WRITE_ENABLED,
												}
						if( config_input.READ_LIMIT ) {
							newApiKeyConfiguration.LIMIT_READ = {
													LIMIT_BY: 'api_key', 
													HOUR: parseInt( config_input.READ_LIMIT_HOUR ),
													DAY: parseInt( config_input.READ_LIMIT_DAY ),
													MONTH: parseInt( config_input.READ_LIMIT_MONTH )
													}
						}
						if( config_input.WRITE_LIMIT ) {
							newApiKeyConfiguration.LIMIT_WRITE = {
													LIMIT_BY: 'api_key', 
													HOUR: parseInt( config_input.WRITE_LIMIT_HOUR ),
													DAY: parseInt( config_input.WRITE_LIMIT_DAY ),
													MONTH: parseInt( config_input.WRITE_LIMIT_MONTH )
													} 
						}
						config.API_AUTH_KEYS[ config_input.API_KEY ] = newApiKeyConfiguration
					}
					jsonfile.writeFile( configfile, config, {spaces: 2, EOL: '\r\n'}, function(err) {
						if( err !== null ) {
							HandleError( '[CONFIG] Error writing config file: ' + err, true )
						} else {
							res(true)
						}
					})			
				}
			})
		});
	}

	this.initialSetup = function() {
		let readPermissions = this.permissionPromptGenerate(Constants.read)
		let writePermissions = this.permissionPromptGenerate(Constants.write)
		let setup = [
			{
				type: 'input',
				name: 'MONGO',
				message: 'What\'s the Mongo URI?',
				validate: function (value) {
					if( !value.match(/^(mongodb:(?:\/{2})?)((\w+?):(\w+?)@|:?@?)([A-Za-z0-9-_.]+?):(\d+)\/(\w+?)$/) ) {
						return 'Mongo URI must be properly formatted, eg. mongodb://admin:admin@localhost:27017/__saveplz__'
						// /mongodb://admin:admin@ds243335.mlab.com:43335/sto_test
					}
					let uri = { MONGO: value }
					let dbHandler = new HandleDB( 'MONGO', uri.MONGO )
					return dbHandler.testConnect()
				}
			},
			{
				type: 'input',
				name: 'PORT',
				message: 'What port do you want to run the server on? (eg. 3000)',
				validate: function (value) {
					 if( isNaN( parseInt( value ) ) ) {
						return 'Port must be a number'
					 } else if( parseInt( value ) < 80 || parseInt( value ) > 65535 ) {
						return 'Port must be in the range of 80 to 65535'
					 } else {
						return true;
					 }
				}
			},
			{
				type: 'confirm',
				name: 'API_AUTH_ENABLED',
				message: 'Do you want to set up an API key?',
				default: false
			},
			{
				type: 'input',
				name: 'API_KEY',
				message: 'Enter an API Key (or type g to generate)',
				when: function (config) {
					return config.API_AUTH_ENABLED;
				},
				validate: function(value) {
					if( !value.match( /^[a-z0-9]+$/i ) ) {
						return 'API keys must be alphanumeric'
					} else {
						return true	
					}
				},
				filter: function(value) {
					if( value.toLowerCase() === "g" ) {
						return hat()
					} else {
						return value
					}
				}
			}
		];
		return setup.concat(readPermissions).concat(writePermissions)
	}


	this.permissionPromptGenerate = function( type ) {
		let r = []
		r.push(   {
			type: 'confirm',
			name: type+'_ENABLED',
			message: 'Do you use this key to ' + type.toLowerCase() + ' data?',
			default: true,
			when: function (config) {
				 return config.API_AUTH_ENABLED && config.API_KEY
			}
		} )
		r.push(   {
			type: 'confirm',
			name: type + '_LIMIT',
			message: 'Do you want to set a limit on how many ' + type.toLowerCase() + 's this key can make?',
			default: false,
			when: function (config) {
				 return config[ type+ '_ENABLED' ]
			}
		}
			)
		r.push( this.limitPromptGenerate( type, 'HOUR' ) )
		r.push( this.limitPromptGenerate( type, 'DAY' ) )
		r.push( this.limitPromptGenerate( type, 'MONTH' ) )
		return r
	}

	this.limitPromptGenerate = function( type, time ) {
		 return  {
			type: 'input',
			name: type + '_LIMIT_' + time,
			message: 'How many ' + type.toLowerCase() + 's per ' + time.toLowerCase() + '? (For no limit, enter -1)',
			validate: function (value) {
			 if( isNaN( parseInt( value ) ) ) {
				return 'Limit must be a number'
			 } else if( parseInt( value ) < -1 ) {
				return 'Limit needs to be a number larger than -1'
			 } else {
				return true;
			 }
			},
			when: function(config) {
				return config[ type+'_LIMIT' ]
			}
		}
	}
}