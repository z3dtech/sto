const path 					= require('path');
const fs 					= require('fs');
require('webpack');

let nodeModules = {};
fs.readdirSync('node_modules')
	.filter(function(x) {
		return ['.bin'].indexOf(x) === -1;
	})
	.forEach(function(mod) {
		nodeModules[mod] = 'commonjs ' + mod;
	});

module.exports = {
	entry: './build.js',
	target: 'node',
	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'sto.js'
	},
	externals: nodeModules
}