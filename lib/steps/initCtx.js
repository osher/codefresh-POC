const fs  = require('fs');
const log = require('../logger').of('repo-analyzer:steps/initCtx');

module.exports = initCtx;
log.debug('module loaded');

function initCtx(options, done) {
    
    log.info("validating options")
    const detectors = [];
    const msg = anyErrorIn(options) 
             || detectorsLoadedErr(options.detectors, detectors);

    done(msg, { options, detectors })
}

function anyErrorIn(options) {
    //in a CLI utility, in this waterfall stage - it's ok to use blocking API
    //if we want to use this in a web-server - need to convert this to async.parallel 
    //or promise.all
    const isNotADir = path => !fs.lstatSync(path).isDirectory();
    var reason;

    if (  
          (  'object' != typeof options
          || options  == null
          )                            && (reason = "options is not a live object")

       || (  !Array.isArray(options.detectors)
          || !options.detectors.length
          )                            && (reason = "options.detectors must be a list of detector modules")

/*
       || (  'string' != typeof options.sources
          || isNotADir(options.sources)
          )                            && (reason = "options.sources is not an existing directory: " + options.sources)

       || (  'string' != typeof options.target
          || isNotADir(options.target)
          )                            && (reason = "options.target is not an existing directory: " + options.target)
*/

    ) return Object.assign( new Error([
      "options provided to repo-analyzer must be a live object",
      "with the following attributs:",
      " - detectors - a list to the detector modules",
      "reason:",
      "  " + reason
    ].join("\n")), { options });
    
    return false
}

function detectorsLoadedErr(detectorNames, detectors) {
    var msg;

    log.debug("detectorsLoadedErr - loading : ", detectorNames )
    
    detectorNames.some(name => {
        try {
            let detectorFactory = require(
              name[0] == '~'  //signifies a built-in detector
                ? name.replace(/^~\//, "../detectors/")
                : name[0] == '.' //signifies a custom detector loaded from current dir
                    ? name.replace(/^\.\//, process.cwd() + "/" )
                    : name       //a custom  detector loaded from node_modules
            );
            
            if (  'function' != typeof detectorFactory
               || detectorFactory.length == 0
               || detectorFactory.length >  2
               ) {
                throw {
                  code: 'INTERFACE_ERROR',
                  message: [ 
                    'Invalid detector module: ' + name,
                    'Valid detector modules should be an initiator function',
                    'that expects 1 or 2 arguments:',
                    ' - flow - an event emitter',
                    ' - callback - [optional] an error 1st callback',
                    'The initiator function may hook on events of `flow`',
                    'Async initiation can be signaled by expecting a callback',
                    'or returning a Promise'
                  ].join("\n")
                }
            };
            
            log.info("loaded detector factory:", name)
              
            detectors.push(detectorFactory)
        } catch (e) {
            switch(true) {
              case 'MODULE_NOT_FOUND' == e.code:
              case 'INTERFACE_ERROR'  == e.code:
                  msg = e.message;
                  break;
              case e instanceof SyntaxError:
              default:
                  msg = 
                    e.stack
                     .split("\n")
                     .slice(0,4)
                     .join ("\n\t")
            }
            
            msg = `Error loading detector module: ${name}:\n\t${msg}`;
            return true
        }
    })
    
    return detectorsLoadedErr.msg = msg        
}
