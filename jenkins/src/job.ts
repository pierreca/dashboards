var http = require('http');
var debug = require('debug')('jenkins:job');
var Promise = require('bluebird');

import build = require('./build');

export enum JobStatus {
    disabled,
    notbuilt,
    blue,
    red
}

export function fromJson(json: any) : Job {
    var job = new Job(json.name, json.color, json.url);
    job.builds = [];
    json.builds.forEach(b => {
        job.builds.push(build.fromJson(b));
    });
    
    return job;
}

export function fromName(serverUrl: string, jobName: string) {
    var jobUrl = serverUrl + '/job/' + jobName + '/api/json';
    return fromUrl(jobUrl);
}

export function fromUrl(jobUrl: string) {
    return new Promise(function (resolve, reject) {
        http.get(jobUrl, res => {
            debug('getJob status code: ' + res.statusCode);
            var responseBody = '';
            res.on('data', chunk => {
                responseBody += chunk; 
            });
            
            res.on('end', () => {
                var json = JSON.parse(responseBody);
                var job = fromJson(json);
                resolve(job);
            });    
        });
    });
}

export class Job {
    builds: Array<build.Build>;
    public constructor(public name: string, public status: JobStatus, private rootUrl: string) {
    }
    
    public refreshBuilds(): Promise<Array<build.Build>> {
        var self = this;
        return new Promise(function (resolve, reject) {
            fromUrl(self.rootUrl).then(job => {
                self.builds = job.builds;
                return self.builds
            }).then(resolve);
        });
    }
    
    
    public getBuildResults(refreshBuildList?: boolean): Promise<Array<build.Build>> {
        var self = this;
        var getBuildsResult = Promise.map(this.builds, b => {
            return b.getResult();
        });
        
        return new Promise(function (resolve, reject){
            if (refreshBuildList){
                this.refreshBuilds()
                    .then(getBuildsResult)
                    .then(resolve)
            } else {
                getBuildsResult.then(resolve);
            }
        });
    };
}