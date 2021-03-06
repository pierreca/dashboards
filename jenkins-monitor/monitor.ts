var debug = require('debug')('jenkins:monitor');
var commander = require('commander');
var http = require('http');
var lpd8806 = require('lpd8806');
var Job = require('pierreca-jenkins-api').Job;
var packageJson = require('../package.json');

import blink = require('./blink');

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
ledStrip.allOFF();

var buildBlinking = -1;
var blinker = new blink.Blinker(ledStrip);

setInterval(function () {
    Job.fromName(jenkinsUrl, jobName).then(job => {
        return job.getBuildResults();
    }).then(builds => {
        debug('Got ' + builds.length + ' builds');
        if (builds.length > 32) {
            builds = builds.slice(0, 32);
        }
        
        for (var i = 0; i < builds.length; i++) {
            if (builds[i].building) {
                debug('Build #' + builds[i].number + ' is in progress');
                if (!blinker.isBlinking()) {
                    buildBlinking = builds[i].number;
                    var ledNumber = builds.length - 1 - i;
                    debug('Starting blinker for build #' + buildBlinking + ' on LED #' + ledNumber);
                    blinker.start(ledNumber);
                }
            } else {
                var color = [0, 0, 0];
                switch(builds[i].result) {
                    case 'SUCCESS': 
                        if (buildBlinking === builds[i].number) {
                            blinker.stop();
                            buildBlinking = -1;
                        }
                        color = [0, 255, 0];
                        ledStrip.setPixelRGB(builds.length - 1 - i, color[0], color[1], color[2]);
                        break;
                    case 'FAILURE':
                        if (buildBlinking === builds[i].number) {
                            blinker.stop();
                            buildBlinking = -1;
                        }
                        color = [255, 0, 0];
                        ledStrip.setPixelRGB(builds.length - 1 - i, color[0], color[1], color[2]);
                        break;
                    default:
                        color = [0, 0, 0];
                        break;
                }
                debug('Build #' + builds[i].number + ': ' + builds[i].result + ' => LED: ' + (builds.length - 1 - i) + ' [R: ' + color[0] + ' G: ' + color[1] + ' B: ' + color[2] + ']')
            }
        };
        
        ledStrip.update();
    }).catch(err => {
        console.error(err.message);
    });
}, 5000);