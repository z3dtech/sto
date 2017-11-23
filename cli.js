#!/usr/bin/env node
'use strict'

const yargs			   	 	 = require('yargs')
const jsonfile		 		 = require('jsonfile-commentless')
const inquirer 		  		 = require('inquirer')
const server 		 	  	 = require('./server')
const Constants 		 	 = require('./lib/Consts')
const HandleError 	 		 = require('./lib/HandleError')
const HandleConfig			 = require('./lib/HandleConfig')
const args 			    	 =  yargs
							.usage('sto --setup')
							.example('sto setup')
							.argv;
const configfile 		 	 = './' + Constants.configFileName
	
const run = function() {
	let configHandler = new HandleConfig()
	jsonfile.readFile( configfile, function( err, config ) {
		if( err ) {
			HandleError( '[CONFIG] Unable to read or parse config file: ' + configfile + '\n Run the setup function to rebuild it: sto setup', true )
		} else {
			if( configHandler.errorCheckConfig( config ) ) {
				server.run( config )	
			}
		}
	})
}
const setup = function() {
	return new Promise( ( res, rej ) => {
		let configHandler = new HandleConfig()
		inquirer.prompt( configHandler.initialSetup() ).then( (suc) => {
			configHandler.buildFile( suc ).then( (  ) => {
				res(true)
			}).catch( (err) => {
				rej( HandleError( '[CONFIG] Unable to write config file: ' + err, true ) )
			})
		}).catch( (err) => {
			rej( HandleError( '[CONFIG] Unable to write config file: ' + err, true ) )
		})
	})
}

const fail = function() {
	process.exit(1)
}


if( args._[0] && args._[0].split('-').join() === 'setup' ) {
	setup().then(() => {
		run()
	}).catch(() => {
		fail()
	})
} else {
	run()
} 
