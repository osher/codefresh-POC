var fs    = require('fs');
var path  = require('path');
var args  = require('../lib/args');
var sinon = require('sinon');
  
module.exports = {
  "oapi:lib/args" : {
    ".cmd" : {
      "when cmd is anything but 'help'" : {
        "should correspond to 1st non-switch argument" : function() {
            runWith(["foo","-t","d:\lala"]).should.have.property('cmd',"foo");
        },
        "should not exit" : function() {
            runWith.exit.should.be.False();
        }
      },
      "when cmd is 'help'" : {
        beforeAll: function() { runWith(["help"]) },
        "should show help" : function() {
            runWith.log.length.should.eql(1)
        },
        "should exit" : function() {
            runWith.exit.should.be.True();
        }
      },
      "when cmd is not provided" : {
        "should default to 'help'" : function() {
            Should(runWith([]).cmd).eql('help');
        }
      }
    },
    ".source" : {
      afterEach: function() {
          runWith.exit.should.be.False();
      },
      "should correspond to switch -s" : function() {
          var value = path.resolve( "TEST" + Math.random() );
          var args = runWith(["foo","-s", value]);

          args.should.have.property('spec',value);
          args.should.have.property('s',value)
      },
      "should correspond to switch --spec" : function() {
          var value = path.resolve( "TEST" + Math.random() );
          var args = runWith(["foo","--spec", value]);
          
          args.should.have.property('spec',value);
          args.should.have.property('s',value)
      },
      "should default to ./config/openapi-spec.yaml" : function() {
          var value = path.resolve( './config/openapi-spec.yaml' );
          var args = runWith(["foo"]);

          args.should.have.property('spec',value);
          args.should.have.property('s',value)
      }
    },
    ".target" : {
      afterEach: function() {
          runWith.exit.should.be.False();
      },
      "should correspond to switch -t" : function() {
          var value = path.resolve( "TEST" + Math.random() );
          var args = runWith(["foo","-t", value]);

          args.should.have.property('target',value);
          args.should.have.property('t',value)
      },
      "should correspond to switch --target" : function() {
          var value = path.resolve( "TEST" + Math.random() );
          var args = runWith(["foo","--target", value]);
          
          args.should.have.property('target',value);
          args.should.have.property('t',value)
      },
      "should default to current directory" : function() {
          var value = process.cwd();
          var args = runWith(["foo"]);

          args.should.have.property('target',value);
          args.should.have.property('t',value)
      }
    },
    ".logLevel" : {
      "should correspond to switch -l" :  function() {
          var value = "WARN";
          var args = runWith(["foo","-l", value]);

          args.should.have.property('logLevel',value);
          args.should.have.property('l',value)
      },
      "should correspond to switch --logLevel" : function() {
          var value = "WARN";
          var args = runWith(["foo","--logLevel", value]);

          args.should.have.property('logLevel',value);
          args.should.have.property('l',value)
      },
      "should default to INFO" : function() {
          var args = runWith(["foo"]);
          
          args.should.have.property('logLevel',"INFO");
          args.should.have.property('l',"INFO")
      }
    }
  }
}

function runWith(argv) { 
    runWith.log  = [];
    runWith.exit = false;
    return args({ 
      argv: ['/path/to/node', '/path/to/oapi'].concat(argv),
      exit: function() { 
          runWith.exit = true 
        } 
    }, { 
      log: function() {
          runWith.log.push(arguments);
      }
    })
}