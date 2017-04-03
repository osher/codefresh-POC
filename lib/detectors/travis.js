const yaml = require('js-yaml');
const log = require('../logger').of('repo-analyzer:lib/detectors/max-stars');
const worth = {
  build: 50,
  run:   10
};

module.exports = travisFctry;
log.debug('module loaded');


function travisFctry({flow}, next) {
    const stats = { 
      projects : {},
      err      : 0,
      score    : 0
    };
    
    flow.onRootFile('.travis.yml', ({file, repo}) => {
        let travis;
        try {
            travis = yaml.safeLoad(file.data)
        } catch(e) {
            log.error('corrupt or unsafe travis file: %s', file.fullName);
            return
        }
        
        if (!travis.services
           || !~travis.services.indexOf("docker")
           ) {
             log.info('repo [%s/%s]  - travis file does not use docker', repo.user, repo.name );
             return 
        }
        
        const isBuildDocker = travis.before_install.some( line => !line.indexOf('docker build') );
        
        log.debug("repo [%s/%s] is %s docker image", isBuildDocker ? "BUILDING" : "running")
        
        promote(
          stats, 
          repo, 
          worth[ isBuildDocker ? "build" : "run" ]
        )
    })
    
    next(null, { report } );
    
    function report(cb) {
        log.debug('yielding report');
        cb(null, {
            name: 'travis',
            stats
        })
    }
    
    function promote(repo, worth) {
        stats.score += worth;
        stats.projects[ repo.user ]
          ? stats.projects[ repo.user ][ repo.name ] = worth
          : stats.projects[ repo.user ] = { [ repo.name ] : worth }
    }    
}

