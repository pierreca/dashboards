var debug = require('debug')('jenkins:jenkins');
var loki = require('lokijs');
var Promise = require('bluebird');
var chalk = require('chalk');
var commander = require('commander');
var packageJson = require('../package.json');

import build = require('./build');
import job = require('./job');
import server = require('./server');

commander.version(packageJson.version)
         .usage('http://<JENKINS_HOST>:<PORT>')
         .parse(process.argv);


if(commander.args.length !== 1) {
    commander.help();
    process.exit(-1);
}

var jenkinsUrl = commander.args[0];

var db = new loki('jenkinsDB.json'); 
var jenkins = new server.Server(jenkinsUrl);
jenkins.listJobs().then(jobs => Promise.map(jobs, job => job.listBuilds().then(builds => {
            var jobCollection = db.addCollection(job.name);
            builds.forEach(build => jobCollection.insert(build));
        }))).then(function() {
            var cols = db.listCollections();
            cols.forEach(colDescription => {
                console.log(chalk.bold(colDescription.name + ': ' + colDescription.count + ' builds'));
                var collection = db.getCollection(colDescription.name);
                var successfulBuilds = collection.find({result: 'SUCCESS'});
                var failedBuilds = collection.find({result: 'FAILURE'});
                var abortedBuilds = collection.find({result: 'ABORTED'});
                
                console.log('\tSuccessful builds: ' + chalk.green(successfulBuilds.length));
                console.log('\tFailed builds: ' + chalk.red(failedBuilds.length));
                console.log('\tAborted builds: ' + chalk.grey(abortedBuilds.length));
            });
            process.exit(0);
        });