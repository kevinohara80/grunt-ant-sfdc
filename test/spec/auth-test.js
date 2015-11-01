'use strict';
var grunt = require('grunt');
var assert = require('assert');
var sfdcAuth = require('../../tasks/sfdc-auth');

describe('validation', function() {
  var warnMessages;
  var gruntWarn;
  beforeEach(function(){
    warnMessages = [];
    gruntWarn = grunt.fail.warn;
    grunt.fail.warn = function(message){
      warnMessages.push(message);
    };
  });
  afterEach(function(){
    grunt.fail.warn = gruntWarn;
  });
  it('should fail if options is empty', function(){
    
    var options = {};
    sfdcAuth.parseAuth(options)
    assert.equal('username/password error',warnMessages[0]);
  });

  it('should pass if user and pass are set', function(){
    var options = {
      user:'user',
      pass:'pass'
    };
    sfdcAuth.parseAuth(options)
    assert.equal(0,warnMessages.length);
  });

  it('should pass if sessionid and serverurl are set', function(){
    var options = {
      sessionid:'sessionid',
      serverurl:'serverurl'
    };
    sfdcAuth.parseAuth(options)
    assert.equal(0,warnMessages.length);
  });
});

describe('configuration', function() {
  it('should set sessionid and serverurl from sessionConfig', function(){
    var options = {
      sessionConfig: {accessToken: '123', instanceUrl: 'abc'}
    };
    sfdcAuth.parseAuth(options)
    assert.equal('123',options.sessionid);
    assert.equal('abc',options.serverurl);
  });

  it('should set values from environment variables', function(){
    var options = {
      useEnv: true
    };
    process.env.SFUSER = 'user';
    process.env.SFPASS = 'pass';
    process.env.SFTOKEN = 'token';
    process.env.SFSESSIONID = 'sessionid';
    process.env.SFSERVERURL = 'serverurl';
    sfdcAuth.parseAuth(options)
    assert.equal('user',options.user);
    assert.equal('passtoken',options.pass);
    assert.equal('token',options.token);
    assert.equal('sessionid',options.sessionid);
    assert.equal('serverurl',options.serverurl);
  });
})