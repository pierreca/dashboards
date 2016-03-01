var debug = require('debug')('jenkins:jenkins');
var loki = require('lokijs');
var Promise = require('bluebird');

import build = require('./build');
import job = require('./job');
import server = require('./server');

if(process.argv.length !== 3) {
    console.log('Usage:');
    console.log('node lib/jenkins.js <jenkinsUrl:port>');
    
    process.exit(-1);
}

var jenkinsUrl = process.argv[2];

var db = new loki('jenkinsDB.json'); 
var jenkins = new server.Server(jenkinsUrl);
jenkins.listJobs().then(jobs => Promise.map(jobs, job => job.listBuilds().then(builds => {
            var jobCollection = db.addCollection(job.name);
            builds.forEach(build => jobCollection.insert(build));
        }))).then(function() {
            var cols = db.listCollections();
            cols.forEach(colDescription => {
                console.log(colDescription.name + ': ' + colDescription.count + ' builds');
                var collection = db.getCollection(colDescription.name);
                var successfulBuilds = collection.find({result: 'SUCCESS'});
                var failedBuilds = collection.find({result: 'FAILURE'});
                var abortedBuilds = collection.find({result: 'ABORTED'});
                
                console.log('\tSuccessful builds: ' + successfulBuilds.length);
                console.log('\tFailed builds: ' + failedBuilds.length);
                console.log('\tAborted builds: ' + abortedBuilds.length);
            });
            process.exit(0);
        });