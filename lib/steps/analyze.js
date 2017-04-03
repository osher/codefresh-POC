const EE    = require('events').EventEmitter;
const async = require('async');
const log   = require('../logger').of('repo-analyzer:steps/analyze');

module.exports = analyze;
log.debug('module loaded');

analyze.produceDetectors = produceDetectors;
analyze.walkRepos        = require('./analyze.walkRepos');
analyze.processReports   = processReports;
analyze.formatResult     = formatResult;

function analyze(ctx, cb) {

    cb(null, { scan } );
    
    
    function scan(options, done) {
        log.info("scanning: %s", options.sources)
        log.debug("creating job context");
      
        const flow = new EE();
        const job = { flow, ctx, options };
        
        (flow.onRepo = onRepo).count = 0;
        (flow.onRootFile = onRootFile).patterns = [];
    
        log.debug("producing detectors");
        
        async.waterfall([
            analyze.produceDetectors.bind(null, job),
            analyze.walkRepos,
            analyze.processReports,
            analyze.formatResult
        ], done)
        
        
        function onRepo(hanlder) { 
            log.debug("registring 1 onRepo handler");
            onRepo.count++;
            flow.on('repo', hanlder)
        }
        
        function onRootFile(pattern, handler ) { 
            log.debug("registring 1 onRootFile handler for pattern: %s", pattern);
            onRootFile.patterns.push({ pattern, handler })
        }
        
    }
    
    
}

function produceDetectors(job, next) {
    log.debug("producing detectors")
    async.parallel(
      job.ctx.detectors.map( f => f.bind(null, job) ),
      function (err, detectors) {
        if (err) return next(err);
        
        job.detectors = detectors;
        next(null, job)
      }
    )
}


function processReports(job, next) {
    log.info("waiting for reports from %s detectors", job.detectors.length)
    async.map(
      job.detectors,
      (detector, next) => detector.report(next),
      (err, reports) => {
          log.info("processing reports from %s detectors", job.detectors.length)
          Object.assign(job, {reports});
          
          reports.sort( (a,b) => {
              //TODO: 
              //  logic of sorting reports by importance?
          })
          
          job.result = reports.reduce((result, reportData) => {
              //merge each reportData into the result data-structure
              
              //TODO: replace this with REAL business logic..

              if (reportData.stats.err) result.header.errorCount += reportData.stats.err;
              result.header
              result.details.push( reportData );
              
              return result
              
          }, {
              header:     {
                totalScore: 0, 
                message:    "",
                errorCount: 0
              },
              recommendations: [],
              details:         []
          })
          
          
          next(null, job )
      }
    )
}

function formatResult(job, next) {

    /**
        expects eventBuss to be hooked as
          flow.on('results', results => { ... } );
    
        option 1 - 
            let "detectors" hook on 'result'.
            using the same plugin architecture
              - implies chaging the semantics from 'detectors' to 'plugins'
            
        option 2 - 
            refactor a little, load 'reporters' from a different configuraton entry
            but internally - stick to same plugin architecture

     */

    
    const resultHooks = job.flow._events.results;
    if (!resultHooks) { 
        log.warn('no formatter attached. Output: \n\n', JSON.stringify(job.result, null, 3));
        return next(null, job);
    }
    
    
    let wait = resultHooks.length || 1;
    const doneReport = () => --wait ? null : next(null, job);
    
    job.flow.emit('results', job.result, doneReport)
}