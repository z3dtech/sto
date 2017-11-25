'use strict'
const log4js 		= require('log4js')
const isObj 		= require('isobject')

log4js.configure({
	appenders: {
		out: { type: 'stdout' },
		errlog: { type: 'file', filename: './logs/errors.log' },
		warnlog: { type: 'file', filename: './logs/warnings.log' },
	},
	categories: {
		default: { appenders: [ 'out' ], level: 'debug' },
		success: { appenders: [ 'out' ], level: 'info' },
		error: { appenders: [ 'out', 'errlog' ], level: 'error' },
		warning: { appenders: [ 'out', 'warnlog' ], level: 'warn' }
	}
})

const errlog 		= log4js.getLogger('error')
const warnlog 		= log4js.getLogger('warning')

module.exports = function( err, exit = false, code = 400, additional_info = false ) {
	if( isObj( additional_info ) ) {
		additional_info = JSON.stringify( additional_info )
	}
	let log = err + ( additional_info !== false ? ' | ' + additional_info : '' )
	if( exit === false ) {
		warnlog.level = 'warn'
		warnlog.warn( log )
		return { code: code, msg: { errors: [err] } }
	} else {
		errlog.level = 'error'
		errlog.error( log )
		process.exit( 1 )
	}
}
