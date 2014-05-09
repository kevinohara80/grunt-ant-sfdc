/*
 * grunt-ant-sfdc
 * https://github.com/kevinohara80/grunt-ant-sfdc
 *
 * Copyright (c) 2013 Kevin O'Hara
 * Licensed under the MIT license.
 */

'use strict';

var path     = require('path');
var metadata = require('../lib/metadata.json');
var localTmp = path.resolve(__dirname, '../tmp');
var localAnt = path.resolve(__dirname, '../ant');
var localLib = path.resolve(__dirname, '../deps');

function lookupMetadata(key) {
  key = key.toLowerCase();
  var typeName;
  // try to match on metadata type
  if(metadata[key] && metadata[key].xmlType) {
    typeName = metadata[key].xmlType;
  } else {
    // try to match on folder
    Object.keys(metadata).forEach(function(mk) {
      var folder = metadata[mk].folder;
      if(typeof folder === 'string' && folder.toLowerCase() === key) {
        typeName = metadata[mk].xmlType;
      } else if(key === 'documents') {
        typeName = metadata['document'].xmlType;
      } else if(key === 'emails') {
        typeName = metadata['email'].xmlType;
      } else if(key === 'reports') {
        typeName = metadata['report'].xmlType;
      } else if(key === 'dashboards') {
        typeName = metadata['dashboard'].xmlType;
      }
    });
  }
  return typeName;
}

// export

module.exports = function(grunt) {

  function clearLocalTmp() {
    if(grunt.file.exists(localTmp)) {
      grunt.file.delete(localTmp, { force: true });
    }
  }

  function makeLocalTmp() {
    clearLocalTmp();
    grunt.file.mkdir(localTmp);
    grunt.file.mkdir(path.join(localTmp,'/ant'));
    grunt.file.mkdir(path.join(localTmp,'/src'));
  }

  function parseAuth(options, target) {
    var un = (!options.useEnv) ? options.user  : process.env.SFUSER;
    var pw = (!options.useEnv) ? options.pass  : process.env.SFPASS;
    var tk = (!options.useEnv) ? options.token : process.env.SFTOKEN;
    if(tk) {pw += tk;}
    if(!un) { grunt.log.error('no username specified for ' + target); }
    if(!pw) { grunt.log.error('no password specified for ' + target); }
    if(!un || !pw) {grunt.fail.warn('username/password error');}
    options.user = un;
    options.pass = pw;
    if(options.useEnv && process.env.SFSERVERURL) {
      options.serverurl = process.env.SFSERVERURL;
    }
    grunt.log.writeln('User -> ' + options.user.green);
  }

  function runAnt(task, target, done) {
    var args =  [
      '-buildfile',
      path.join(localTmp,'/ant/build.xml'),
      '-lib',
      localLib,
      '-Dbasedir='     + process.cwd()
    ];
    args.push(task);
    grunt.log.debug('ANT CMD: ant ' + args.join(' '));
    grunt.log.writeln('Starting ANT ' + task + '...');
    var ant = grunt.util.spawn({
      cmd: 'ant',
      args: args
    }, function(error, result, code) {
      if(error) {
        grunt.fail.warn(error, code);
      } else {
        grunt.log.ok(task + ' target ' + target + ' successful');
      }
      done(error, result);
    });
    ant.stdout.on('data', function(data) {
      grunt.log.write(data);
    });
    ant.stderr.on('data', function(data) {
      grunt.log.error(data);
    });
  }

  function buildPackageXml(pkg, pkgName, version) {
    var packageXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Package xmlns="http://soap.sforce.com/2006/04/metadata">'
    ];
    if(pkgName) {
      packageXml.push('    <fullName>' + pkgName + '</fullName>');
    }
    if(pkg) {
      Object.keys(pkg).forEach(function(key) {
        var type = pkg[key];
        var typeName = lookupMetadata(key);
        if(!typeName) { grunt.fail.fatal(key + ' is not a valid metadata type'); }
        packageXml.push('    <types>');
        type.forEach(function(t) {
          packageXml.push('        <members>' + t + '</members>');
        });
        packageXml.push('        <name>' + typeName + '</name>');
        packageXml.push('    </types>');
      });
    }
    packageXml.push('    <version>' + version + '</version>');
    packageXml.push('</Package>');
    return packageXml.join('\n');
  }

  /*************************************
   * antdeploy task
   *************************************/

  grunt.registerMultiTask('antdeploy', 'Run ANT deploy to Salesforce', function() {

    makeLocalTmp();

    var done = this.async();
    var target = this.target.green;
    var template = grunt.file.read(path.join(localAnt,'/antdeploy.build.xml'));

    var options = this.options({
      user: false,
      pass: false,
      token: false,
      root: './build',
      apiVersion: '29.0',
      serverurl: 'https://login.salesforce.com',
      pollWaitMillis: 10000,
      maxPoll: 20,
      checkOnly: false,
      runAllTests: false,
      rollbackOnError: true,
      useEnv: false,
      existingPackage: false
    });

    grunt.log.writeln('Deploy Target -> ' + target);

    parseAuth(options, target);

    options.root = path.normalize(options.root);

    options.tests = this.data.tests || [];

    var buildFile = grunt.template.process(template, { data: options });
    grunt.file.write(path.join(localTmp,'/ant/build.xml'), buildFile);

    if (!options.existingPackage) {
      var packageXml = buildPackageXml(this.data.pkg, options.apiVersion);
      var packageXml = buildPackageXml(this.data.pkg, this.data.pkgName, options.apiVersion);
      grunt.file.write(path.join(options.root,'/package.xml'), packageXml);
    }

    runAnt('deploy', target, function(err, result) {
      clearLocalTmp();
      done();
    });

  });

  /*************************************
   * antdestroy task
   *************************************/

  grunt.registerMultiTask('antdestroy', 'Run ANT destructive changes to Salesforce', function() {

    makeLocalTmp();

    var done = this.async();
    var target = this.target.green;
    var template = grunt.file.read(path.join(localAnt,'/antdeploy.build.xml'));

    var options = this.options({
      user: false,
      pass: false,
      token: false,
      root: './build',
      apiVersion: '29.0',
      serverurl: 'https://login.salesforce.com',
      pollWaitMillis: 10000,
      maxPoll: 20,
      checkOnly: false,
      runAllTests: false,
      rollbackOnError: true,
      useEnv: false
    });

    grunt.log.writeln('Destroy Target -> ' + target);

    parseAuth(options, target);

    options.root = path.normalize(options.root);

    options.tests = this.data.tests || [];

    var buildFile = grunt.template.process(template, { data: options });
    grunt.file.write(path.join(localTmp,'/ant/build.xml'), buildFile);

    var packageXml = buildPackageXml(this.data.pkg, options.apiVersion);
    grunt.file.write(path.join(options.root,'/package.xml'), packageXml);

    var destructiveXml = buildPackageXml(this.data.pkg, options.apiVersion);
    grunt.file.write(path.join(options.root,'/destructiveChanges.xml'), destructiveXml);

    runAnt('deploy', target, function(err, result) {
      clearLocalTmp();
      done();
    });

  });

  /*************************************
   * antretrieve task
   *************************************/

  grunt.registerMultiTask('antretrieve', 'Run ANT retrieve to get metadata from Salesforce', function() {

    makeLocalTmp();

    var done = this.async();
    var target = this.target.green;
    var template = grunt.file.read(path.join(localAnt,'/antretrieve.build.xml'));

    var options = this.options({
      user: false,
      pass: false,
      token: false,
      root: './build',
      apiVersion: '29.0',
      serverurl: 'https://login.salesforce.com',
      retrieveTarget: false,
      unzip: true,
      useEnv: false,
      existingPackage: false
    });

    grunt.log.writeln('Retrieve Target -> ' + target);

    parseAuth(options, target);

    options.root = path.normalize(options.root);

    options.unpackaged = path.join(localTmp,'/package.xml');
    if(!options.retrieveTarget) {options.retrieveTarget = options.root;}

    var buildFile = grunt.template.process(template, { data: options });
    grunt.file.write(path.join(localTmp,'/ant/build.xml'), buildFile);

    if (!options.existingPackage) {
      var packageXml = buildPackageXml(this.data.pkg, this.data.pkgName, options.apiVersion);
      grunt.file.write(path.join(options.root,'/package.xml'), packageXml);
    } else {
      if(grunt.file.exists(options.root,'/package.xml')){
        grunt.file.copy(path.join(options.root,'/package.xml'), path.join(localTmp,'/package.xml'));
      } else {
        grunt.log.error('No Package.xml file found in ' + options.root);
      }
    }

    runAnt('retrieve', target, function(err, result) {
      clearLocalTmp();
      done();
    });

  });

  /*************************************
   * antdescribe task
   *************************************/

  grunt.registerMultiTask('antdescribe', 'Describe all metadata types for an org', function() {

    makeLocalTmp();

    var done = this.async();
    var target = this.target.green;
    var template = grunt.file.read(path.join(localAnt,'/antdescribe.build.xml'));

    var options = this.options({
      user: false,
      pass: false,
      token: false,
      apiVersion: '29.0',
      serverurl: 'https://login.salesforce.com',
      resultFilePath: '',
      format: 'log',
      trace: false,
      useEnv: false
    });

    var finalDest = path.normalize(options.resultFilePath);

    options.resultFilePath = path.join(localTmp,'/list.log');

    grunt.log.writeln('Describe Target -> ' + target);

    parseAuth(options, target);

    var buildFile = grunt.template.process(template, { data: options });
    grunt.file.write(path.join(localTmp,'/ant/build.xml'), buildFile);

    grunt.file.write(options.resultFilePath);

    runAnt('describe', target, function(err, results) {
      if(err) {
        done();
      } else if(options.format === 'json') {
        grunt.log.writeln('parsing response to json');
        var logFile = grunt.file.read(options.resultFilePath);
        var lines = logFile.split('\n');

        var jsonData = {};
        var currentType = 'types';
        var md;

        for(var i=0; i<lines.length; i++) {
          var line = lines[i].split(':');
          if(line.length === 2) {
            var prop = line[0].trim();
            var val = line[1].trim();
            var valsplit = val.split(',');
            // start of a new md section

            if(prop === 'ChildObjects') {
              if(valsplit.length > 1) {
                var arr = [];
                for(var a=0; a<valsplit.length; a++) {
                  var part = valsplit[a].trim();
                  if(!/^\*.*/.test(part)) {
                    arr.push(part);
                  }
                }
                val = arr;
              } else if(/^\*.*/.test(val)) {
                val = [];
              }
            } else {
              if(val === 'false') {val = false;}
              if(val === 'true') {val = true;}
            }
            if(!md) {md = {};}
            md[prop] = val;
          } else {
            if(md && currentType) {
              if(!jsonData[currentType]) {jsonData[currentType] = [];}
              jsonData[currentType].push(grunt.util._.clone(md));
              md = null;
            }
          }
        }
        grunt.file.write(finalDest, JSON.stringify(jsonData, null, '\t'));
      } else {
        grunt.file.copy(options.resultFilePath, finalDest);
      }
      clearLocalTmp();
      done();
    });

  });

  /*************************************
   * antlist task
   *************************************/

   grunt.registerMultiTask('antlist', 'List metadata for a certain type', function() {

    makeLocalTmp();

    var done = this.async();
    var target = this.target.green;
    var template = grunt.file.read(path.join(localAnt,'/antlist.build.xml'));

    var options = this.options({
      user: false,
      pass: false,
      token: false,
      apiVersion: '29.0',
      serverurl: 'https://login.salesforce.com',
      resultFilePath: '',
      metadataType: '',
      folder: '',
      format: 'log',
      trace: false,
      useEnv: false
    });

    var finalDest = path.normalize(options.resultFilePath);

    options.resultFilePath = path.join(localTmp,'/list.log');

    grunt.log.writeln('ListMetadata (' + options.metadataType + ') Target -> ' + target);

    parseAuth(options, target);

    var buildFile = grunt.template.process(template, { data: options });
    grunt.file.write(path.join(localTmp,'/ant/build.xml'), buildFile);

    grunt.file.write(options.resultFilePath);

    runAnt('listmetadata', target, function(err, results) {
      if(err) {
        done();
      } else if(options.format === 'json') {
        grunt.log.writeln('parsing response to json');
        var logFile = grunt.file.read(options.resultFilePath);
        var lines = logFile.split('\n');

        var jsonData = {};
        var currentType;
        var md;

        for(var i=0; i<lines.length; i++) {
          var line = lines[i].split(':');
          if(line.length === 2) {
            var prop = line[0].trim();
            var val = line[1].trim();
            var valsplit = val.split('/');
            // start of a new md section
            if(prop === 'FileName') {
              if(!jsonData[options.metadataType]) {jsonData[options.metadataType] = [];}
              currentType = options.metadataType;

              if(!md) {md = {};}
              md.FileName = val;

            } else if(prop === 'FullName/Id') {
              valsplit = val.split('/');
              md.FullName = valsplit[0];
              md.Id = valsplit[1];
            } else if(prop === 'Manageable State') {
              md.ManageableState = val;
            } else if(prop === 'Namespace Prefix') {
              md.NamespacePrefix = val;
            } else if(prop === 'Created By (Name/Id)') {
              if(!md.CreatedBy) {md.CreatedBy = {};}
              md.CreatedBy.Name = valsplit[0];
              md.CreatedBy.Id = valsplit[1];
            } else if(prop === 'Last Modified By (Name/Id)') {
              if(!md.LastModifiedBy) {md.LastModifiedBy = {};}
              md.LastModifiedBy.Name = valsplit[0];
              md.LastModifiedBy.Id = valsplit[1];
            }
          } else {
            if(md && currentType) {
              if(!jsonData[currentType]) {jsonData[currentType] = [];}
              jsonData[currentType].push(grunt.util._.clone(md));
              md = null;
            }
          }
        }
        grunt.file.write(finalDest, JSON.stringify(jsonData, null, '\t'));
      } else {
        grunt.file.copy(options.resultFilePath, finalDest);
      }
      clearLocalTmp();
      done();
    });

  });

};
