var path  = require('path');
var yargs = 
    require('yargs')
    .usage([
      'Usage: cfresh -s <source dir> -o <target dir> [...options]',
      'writes in the target directory reports about the sources found in source directory'
    ].join("\n")
    ).options({ 
      c: {
        global:   true,
        alias:    'config',
        describe: 'custom config file, is yet overriden by CLI switches',
        default:  './config'
      },
      s: { 
        global:   true, 
        alias:    'sources',
        describe: 'source directory to analyze',
      },
      t: { 
        global:   true, 
        alias:    'target',
        describe: 'target directory for reports output',
        default:  '.'
      },
      d: {
        global:   true,
        alias:    'detectors',
        describe: 'list of detector modules to use during analysis'
      },
      l: { 
        global:   true, 
        alias:    'logLevel', 
        describe: 'log level: DEBUG|INFO|WARN|ERROR|FATAL', 
        default : 'INFO'
      }, 
      h: {
        global:   true, 
        alias:    'help',
        type:     'boolean',
        describe: 'you are looking at it...  :o', 
      }
    });

module.exports = function(process, console) {
    var args = yargs.parse(process.argv.slice(2));
    
    if (args.h) {
        yargs.showHelp(console.log);
        return process.exit();
    }
    
    if (args.c) {
        try {
            args = Object.assign( 
                require( path.resolve( args.c ) ),
                args
            );
        } catch(e) {
            console.error("Error loading configuration file: %s", args.c, e );
            return process.exit(1);
        }
    }
    
    args.s   = args.sources  = path.resolve( args.sources );
    args.t   = args.target   = path.resolve( args.target );
    
    args.init = {
      detectors: args.detectors
    };
    
    args.scan = {
      sources: args.sources
    };

    return args;
}