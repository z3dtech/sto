#!/usr/bin/env node
'use strict';

const yargs			   	 	 = require('yargs')
const jsonfile		 		 = require('jsonfile')
const inquirer 		  		 = require('inquirer')
const server 		 	  	 = require('./server')
const Constants 		 	 = require('./lib/Consts')
const HandleError 	 		 = require('./lib/HandleError')
const HandleConfig			 = require('./lib/HandleConfig')