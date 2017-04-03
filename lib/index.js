const log   = require('./logger').of('repo-analyzer:lib');
const async = require('async');

module.exports = init;

init.initCtx  = require('./steps/initCtx');
init.analyze  = require('./steps/analyze');

log.debug('module loaded');


function init(options, cb) {
    
    async.waterfall([
        init.initCtx.bind(null, options),
        init.analyze
    ], cb)
}