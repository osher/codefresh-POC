const path    = require('path');
const fs      = require('fs');
const exec    = require('child_process').exec;
const async   = require('async');
const gitInfo = require('hosted-git-info');

const log = require('../logger').of('repo-analyzer:steps/analyze.walkRepos');

module.exports = walkRepos;

walkRepos.inspectRepo = inspectRepo;

log.debug('module loaded');

function walkRepos(job, done) {
    log.debug('walking')
    async.waterfall([
      fs.readdir.bind( fs, job.options.sources ),
      (dirs, next) => log.debug('found %s entries', dirs.length) || next(null, dirs),
      
      (dirs, next) => async.map(dirs, readStats, next ),
      (dirs, next) => next(null, dirs.filter(dir => dir.stat.isDirectory() )),
      (dirs, next) => log.debug('found %s directories', dirs.length) || next(null, dirs),

      (dirs, next) => async.map(dirs, readGitInfo, next),
      (dirs, next) => next(null, dirs.filter(dir => dir.repo )),
      (dirs, next) => log.info('found %s directories with git info', dirs.length) || next(null, dirs),
      
      (dirs, next) => async.each( dirs, walkRepos.inspectRepo, next)
    ], (e) => done(e, job))

    function readStats(dir, next) {
        return fs.lstat(path.join( job.options.sources, dir), (err, stat) => 
          next(err, { 
              name: dir,
              path: path.join( job.options.sources, dir),
              stat, 
              job 
            }
          )
        )
    }    
}

function readGitInfo(dir, next) {
    exec( "git config --get remote.origin.url", { cwd: dir.path }, (err, url, stderr) => {
        if (err) {
            err.code == 1
              ? next(null, dir)
              : next(err, dir);
            
            log.debug('error getting git remote for: ', dir.name, err);
            return;
        }
        log.debug("found git repository: %s", url.trim() );
        
        dir.repo = gitInfo.fromUrl(url.trim());
        
        next(null, dir)
    })
}

function inspectRepo(dir, next) {
    
    dir.job.flow.emit('repo', dir);
    
    if (dir.job.flow.onRootFile.patterns.length) {
        log.warn('walking root files is not implemented :(' )
        //TODO: if there are subscribed patterns - glob them, and fire for the requested files by pattern
    }
 
    next()
}