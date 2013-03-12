/*
 * grunt-ant-sfdc
 * https://github.com/kevinohara80/grunt-ant-sfdc
 *
 * Copyright (c) 2013 Kevin O'Hara
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var buildfile = path.resolve(__dirname, '../ant/build.xml');
var metadata = require('../lib/metadata.json');

function buildPackageXml(pkg, version) {
  var packageXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Package xmlns="http://soap.sforce.com/2006/04/metadata">'
  ];

  Object.keys(pkg).forEach(function(key) {
    
    var type = pkg[key];
    var typeName;

    if(metadata[key.toLowerCase()] && metadata[key.toLowerCase()].xmlType) {
      typeName = metadata[key.toLowerCase()].xmlType;
    }

    if(!typeName) { grunt.log.error(key + ' is not a valid metadata type'); }
    
    packageXml.push('    <types>');
    type.forEach(function(t) {
      packageXml.push('        <members>' + t + '</members>');
    });
    packageXml.push('        <name>' + typeName + '</name>');
    packageXml.push('    </types>');

  });

  packageXml.push('    <version>' + version + '</version>');
  packageXml.push('</Package>\n\n');

  return packageXml.join('\n');
}

module.exports = function(grunt) {
  
  grunt.registerMultiTask('antdeploy', 'Run ANT deploy to Salesforce', function() {

    var done = this.async();
    var target = this.target.green;

    var options = this.options({
      root: 'build',
      version: '27.0'
    });

    grunt.log.writeln('Deploy Target -> ' + target);

    var un = this.data.user;
    var pw = this.data.pass;
    if(this.data.token) { pw += this.data.token; }

    if(!un) { grunt.log.error('No username specified for ' + this.target); }
    if(!pw) { grunt.log.error('No password specified for ' + this.target); }

    var packageXml = buildPackageXml(this.data.pkg, options.version);
    grunt.file.write(options.root + '/package.xml', packageXml);
    
    var args =  [
      '-buildfile',
      buildfile,
      '-Dbasedir='     + process.cwd(),
      '-DSFUSER='      + un,
      '-DSFPASS='      + pw,
      '-DSERVERURL='   + (this.data.serverurl || 'https://login.salesforce.com'),
      '-DROOT='        + options.root,
      'deploy'
    ];

    grunt.log.debug('ANT CMD: ant ' + args.join(' '));

    grunt.log.writeln('Starting deploy...');

    grunt.util.spawn({
      cmd: 'ant',
      args: args
    }, function(error, result, code) {
      grunt.log.debug(String(result.stdout));
      if(error) {
        grunt.log.error(error);
      } else {
        grunt.log.ok('Deployment target ' + target + ' successful');
      }
      done();
    });

  });

  grunt.registerMultiTask('antretrieve', 'Run ANT retrieve to get metadata from Salesforce', function() {

    var done = this.async();
    var target = this.target.green;

    var options = this.options({
      root: 'build',
      version: '27.0'
    });

    grunt.log.writeln('Retrieve Target -> ' + target);

    var un = this.data.user;
    var pw = this.data.pass;
    if(this.data.token) { pw += this.data.token; }

    if(!un) { grunt.log.error('No username specified for ' + this.target); }
    if(!pw) { grunt.log.error('No password specified for ' + this.target); }

    var packageXml = buildPackageXml(this.data.pkg, options.version);
    grunt.file.write(options.root + '/package.xml', packageXml);

    var args =  [
      '-buildfile',
      buildfile,
      '-Dbasedir='     + process.cwd(),
      '-DSFUSER='      + un,
      '-DSFPASS='      + pw,
      '-DSERVERURL='   + (this.data.serverurl || 'https://login.salesforce.com'),
      '-DROOT='        + options.root,
      '-DUNPACKAGED='  + path.normalize(options.root + '/package.xml'),
      'retrieve'
    ];

    grunt.log.debug('ANT CMD: ant ' + args.join(' '));

    grunt.log.writeln('Starting retrieve...');

    grunt.util.spawn({
      cmd: 'ant',
      args: args
    }, function(error, result, code) {
      grunt.log.debug(String(result.stdout));
      if(error) {
        grunt.log.error(error);
      } else {
        grunt.log.ok('Retrieve target ' + target + ' successful');
      }
      done();
    });

  });

};
