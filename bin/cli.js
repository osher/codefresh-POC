const args = require('../lib/args')(process, console);
const log  = 
    require('../lib/logger')
      .configure({ 
        levels:    { "[all]" : args.logLevel },
        appenders: [ { type  : "console" } ] 
      })
      .of('repo-analyzer:cli');
      
const slant = ( ({textSync:format}) => s => format(s, {font: 'Slant' }) )(require('figlet'));
      
log.info( "\n\n%s\n\n%s\n\n", slant("    CodeFresh"), slant("Repo Analyzer") );
log.debug('accepted args', args);

require('../lib')(args.init, function(err, mgr) {
    if (err) return log.error(err);
    
    mgr.scan(args.scan, function(err) {
        log[ err ? "error" : "info"](err || ("\n" + slant("    Success !")))
    })
})