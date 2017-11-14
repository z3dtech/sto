'use strict'

module.exports = function( err, exit = false, code = 400, additional_info = false ) {
	// log using log4js?
	// output to console using ee-log?
	console.log( err )
	if( exit === true ) {
		console.log( 'Process terminated.' )
		process.exit( 1 )
	}
	return { code: code, msg: { errors: [err] } }
}
