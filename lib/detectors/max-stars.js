const log = require('../logger').of('repo-analyzer:lib/detectors/max-stars');
const request = require('request');
const scoreStairs = [
  { to: 1,   score: 0 },
  { to: 5,   score: 10 },
  { to: 10,  score: 20 },
  { to: 25,  score: 30 },
  { to: 50,  score: 50 },
  { to: 100, score: 60 },
]

module.exports = maxStarsFctry;
log.debug('module loaded');

function maxStarsFctry({flow}, next) {
    const stats = { 
      projects : {},
      max      : 0,
      count    : 0,
      sum      : 0,
      err      : 0
    };
    const sentReqs = [];
    
    flow.onRepo( ({repo}) => {
        if (!repo) return
        
        log.debug('%s / %s - reading stars', repo.user, repo.project)
        
        sentReqs.push( new Promise( (ok, nok) => 
            request({
              url: 'https://api.github.com/repos/' + repo.user + "/" + repo.project,
              json: true,
              headers: {
                //TODO: add
                //  Authorization : "oauth <token>" or "basic <base64>"
                
                Accept :"application/vnd.github.preview",
                "User-Agent" : "codefresh-repo-analyzer"
              }
            }, function(e, r, b) {
                if (e) {  
                    log.error('could not request for %s/%s',repo.user, repo.project);
                    stats.err++;
                    return ok() //suppress failure:one failed project should not fail the process
                }
                
                if (r.statusCode != 200) {
                    log.error('repo info denied for %s/%s: status %s',repo.user, repo.project, r.statusCode, b);
                    stats.err++;
                    return ok() //suppress failure: one failed project should not fail the process
                }
                
                log.info('%s / %s - has %s stars', repo.user, repo.project, b.watchers_count);
                
                stats.projects[ repo.user ]
                  ? stats.projects[ repo.user ][repo.project] = b.watchers_count
                  : stats.projects[ repo.user ] = { [repo.project] : b.watchers_count}

                stats.max = Math.max(stats.max, b.watchers_count);
                stats.sum += b.watchers_count;
                stats.count++;
                stats.avg = stats.sub / stats.count;
                
                ok()
            }) && undefined
        ))
    })
    
    next(null, { report } );
    
    function report(cb) {
        log.debug('waiting for all requests to return');
        Promise.all( sentReqs ).then(
          _ => {
              log.debug('yielding report');
              
              stats.avg   = stats.sum / stats.count;
              stats.score = scoreStairs.find( step => stats.max < step.to ).score;
              
              cb(null, {
                name: 'github stars',
                stats
              })
          }
        )
    }
}