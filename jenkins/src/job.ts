var http = require('http');
var debug = require('debug')('jenkins:job');
var Promise = require('bluebird');

import buildresult = require('./buildresult');

export enum JobStatus {
    Disabled,
    NotBuilt,
    Success,
    Failure,
    Unknown
}

export function fromJson(json: any) : Job {
    var status = JobStatus.Unknown;
    switch (json.color) {
        case "disabled":
            status = JobStatus.Disabled;
            break;
        case "notbuilt":
            status = JobStatus.NotBuilt;
            break;
        case "blue":
            status = JobStatus.Success;
            break;
        case "red":
            status = JobStatus.Failure;
            break;
        default:
            status = JobStatus.Unknown;
            break;
    }
    
    var job = new Job(json.name, status, json.url);
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
                try {
                    var json = JSON.parse(responseBody);
                    var job = fromJson(json);
                    resolve(job);
                } catch (err) {
                    var error = new Error('Could not parse job JSON description: ' + err.message);
                    error.stack = err.stack;
                    reject(error);
                }
            });    
        });
    });
}

export class Job {
    buildResults: Array<buildresult.BuildResult>;
    public constructor(public name: string, public status: JobStatus, private rootUrl: string) {
    }
    
    public getBuildResults(): Promise<Array<buildresult.BuildResult>> {
        var self = this;
        return new Promise(function (resolve, reject){
            if (self.status === JobStatus.NotBuilt || self.status === JobStatus.Disabled) {
                reject(new Error('Job \'' + self.name + '\' status is ' + JobStatus[self.status]));
            } else {
                var buildResultsUrl = self.rootUrl + 'api/json?tree=builds[number,result,url,fullDisplayName,timestamp,estimatedDuration,duration,builtOn,building]';
                http.get(buildResultsUrl, res => {
                    debug('getBuildResults for \'' + self.name + '\' status code: ' + res.statusCode);
                    if (res.statusCode !== 200) {
                        reject(new Error('Could not get build results'));
                    } else {
                        var responseBody = '';
                        res.on('data', chunk => {
                            responseBody += chunk; 
                        });
                        
                        res.on('end', () => {
                            try {
                                var json = JSON.parse(responseBody);
                                Promise.map(json.builds, jsonResult => {
                                    self.buildResults = [];
                                    var b = buildresult.fromJson(jsonResult);
                                    self.buildResults.push(b);
                                    return b;
                                }).then(resolve);
                            } catch (err) {
                                var error = new Error('Could not parse JSON for ' + self.name + ': ' + err.message);
                                error.stack = err.stack;
                                reject(error);
                            }
                        });
                    }  
                });
            }
        });
    };
}