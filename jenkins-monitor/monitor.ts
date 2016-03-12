var debug = require('debug')('jenkins:monitor');
var Promise = require('bluebird');
var chalk = require('chalk');
var commander = require('commander');
var http = require('http');
var lpd8806 = require('lpd8806');
var packageJson = require('../../package.json');

import build = require('../jenkins/src/build');
import job = require('../jenkins/src/job');
import server = require('../jenkins/src/server');

commander.version(packageJson.version)
         .usage('http://<JENKINS_HOST>:<PORT> <JOBNAME>')
         .parse(process.argv);


if(commander.args.length !== 2) {
    commander.help();
    process.exit(-1);
}

var jenkinsUrl = commander.args[0];
var jobName = commander.args[1];

var ledStrip = new lpd8806(32, '/dev/spidev0.0');

job.fromName(jenkinsUrl, jobName).then(job => {
    return job.listBuilds();
}).then(builds => {
    for (var i = 0; i < builds.length; i++) {
        console.log(builds[i].number + ': ' + builds[i].result);
        var color = [0, 0, 0];
        switch(builds[i].result) {
            case 'SUCCESS': 
                color = [0, 255, 0];
                break;
            case 'FAILURE':
                color = [255, 0, 0];
                break;
            default:
                break;
        }
        
        ledStrip.setPixelRGB(builds.length - i, color[0], color[1], color[2]);
    };
    
    ledStrip.update();
}).catch(err => {
    console.error(err.message);
});