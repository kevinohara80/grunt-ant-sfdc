# grunt-ant-sfdc

> Add salesforce and force.com ANT tasks to your grunt builds

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-ant-sfdc --save-dev
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-ant-sfdc');
```

## Options for all tasks

The following are options that can be defined for all tasks...

#### options.user
Type: `String`
Required: `true`
Your Salesforce.com username

#### options.pass
Type: `String`
Required: `true`
Your Salesforce.com password

#### options.token
Type: `String`
Your Salesforce.com password

#### options.serverurl
Type: `String`
Default value: `'https://login.salesforce.com'`
This option sets the api version to use for the package deployment

#### options.pollWaitMillis
Type: `Integer`
Default value: `10000`
This option sets the number of milliseconds to wait between polls for retrieve/deploy results.

#### options.maxPoll
Type: `Integer`
Default value: `20`
This option sets the number of polling attempts to be performed before aborting.

#### options.apiVersion
Type: `String`
Default value: `'29.0'`
This option sets the api version to use for the package deployment

#### options.useEnv
Type: `Boolean`
Default value: `false`
This option will tell the task to look in environment variables for your Salesforce authentication details. This is really handy for making things secure and not having to put your login details in the Gruntfile. Make sure you set your username `SFUSER`, password `SFPASS`, and optionally your token `SFTOKEN`

## The "antdeploy" task

### Overview
In your project's Gruntfile, add a section named `antdeploy` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  antdeploy: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
      pkg: {   // Package to deploy
        apexclass: ['*'],
        staticresource: ['*']
      },
      tests: ['TestClass1', 'TestClass2'] // Optional tests to run
    },
  },
})
```

### Task-specific options

#### options.root
Type: `String`
Default value: `'build/'`
The root options sets the base directory where metadata lives

#### options.checkOnly
Type: `Boolean`
Default value: `false`
This option sets whether this is a checkOnly deploy or not

#### options.runAllTests
Type: `Boolean`
Default value: `false`
This option sets whether or not to run all tests

#### options.rollbackOnError
Type: `Boolean`
Default value: `true`
This option sets whether or not to roll back changes on test error

#### options.existingPackage
Type: `Boolean`
Default value: `false`
This option will tell the task to assume a package.xml file exists in the `root` folder. If this option is `true` the `pkg` data provided to the task will be ignored and a new package.xml file will not be generated. This allows you to reuse a package.xml file that may be present in your project.

### Usage Examples

#### Single Org Deploy
In this example, we will deploy all static resources to a single org

```js
grunt.initConfig({
  antdeploy: {
    options: {},
    // specify one deploy target
    dev1: {
      options: {
        user:      'myusername@test.com',
        pass:      'mypassword',
        token:     'mytoken',
        serverurl: 'https://test.salesforce.com' // default => https://login.salesforce.com
      },
      pkg: {
        staticresource: ['*']
      }
    }
  }
})
```

#### Multiple Org Deploy w/ Default Options
In this example, we specify two different org deploy targets with different metadata for each

```js
grunt.initConfig({
  antdeploy: {
    options: {
      root: 'my/metadata/', // note trailing slash is important
      version: '27.0'
    },
    // specify one deploy target
    dev1: {
      options: {
        user:  'myusername@test.com',
        pass:  'mypassword',
        token: 'mytoken'
      },
      pkg: {
        staticresource: ['*']
      }
    },
    dev2: {
      options: {
        user:  'myusername2@test.com',
        pass:  'mypassword2',
        token: 'mytoken2'
      },
      pkg: {
        staticresource: ['*']
      }
    }
  }
})
```

## The "antretrieve" task

### Overview
In your project's Gruntfile, add a section named `antretrieve` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  antretrieve: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
      pkg: {
        // Package to retrieve
      }
    },
  },
})
```

### Task-specific options

#### options.root
Type: `String`
Default value: `'build/'`
The root option sets the base directory where metadata lives

#### options.retrieveTarget
Type: `String`
Default value: `root`
This sets the target directory for the retrieve. This will default to the `root` if not set.

#### options.unzip
Type: `Boolean`
Default value: `true`
This set whether or not the retrieve should be unzipped upon completion

#### options.existingPackage
Type: `Boolean`
Default value: `false`
This option will tell the task to assume a package.xml file exists in the `root` folder. If this option is `true` the `pkg` data provided to the task will be ignored and a new package.xml file will not be generated. This allows you to reuse a package.xml file that may be present in your project.

### Usage Examples

#### Single Org Retrieve
In this example, we will retrieve all static resources, classes, and apexpages from a single org

```js
grunt.initConfig({
  antretrieve: {
    options: {
      user: 'myusername@gmail.com',
      pass: 'mypass'
    },
    // specify one retrieve target
    dev1: {
      serverurl:  'https://test.salesforce.com' // default => https://login.salesforce.com
      pkg: {
        staticresource: ['*'],
        apexclass:      ['*'],
        apexpage:       ['*']
      }
    }
  }
})
```

#### Single Org, multiple retrieve example
In this example, we specify one org but multiple retrieve targets

```js
grunt.initConfig({
  antretrieve: {
    options: {
      root:    'metadata/',
      version: '27.0'
    },
    // specify one deploy target
    dev1all: {
      options: {
        user:  'myusername@gmail.com',
        pass:  'mypassword',
        token: 'myauthtoken',
      },
      pkg: {
        staticresource: ['*'],
        apexclass:      ['*'],
        apexpage:       ['*']
      }
    },
    dev1classes: {
      options: {
        user:  'myusername@gmail.com',
        pass:  'mypassword',
        token: 'myauthtoken'
      },
      pkg: {
        apexclass: ['*']
      }
    },
    dev1module: {
      options: {
        user:  'myusername@gmail.com',
        pass:  'mypassword',
        token: 'myauthtoken'
      },
      pkg: {
        apexclass:      ['MyClass', 'MyClassTest'],
        apexpage:       ['MyPage'],
        staticresource: ['MyPageResource'],
        apextrigger:    ['MyObjectTrigger']
      }
    }
  }
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
