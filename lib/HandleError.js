'use strict'
const log4js 		= require('log4js')

log4js.configure({
	appenders: {
		out: { type: 'stdout' },
		errlog: { type: 'file', filename: './logs/errors.log' },
		warnlog: { type: 'file', filename: './logs/warnings.log' },
	},
	categories: {
		default: { appenders: [ 'out', 'errlog' ], level: 'error' },
		warning: { appenders: [ 'out', 'warnlog' ], level: 'warn' }
	}
})

const errlog 		= log4js.getLogger()
const warnlog 		= log4js.getLogger('warning')

module.exports = function( err, exit = false, code = 400, additional_info = false ) {
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
