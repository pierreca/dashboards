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
    return new Job(json.name, json.color, json.url);
}

export function fromName(serverUrl: string, jobName: string) {
    return new Promise(function (resolve, reject) {
        var jobUrl = serverUrl + 'job/' + jobName + '/api/json';
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
    public constructor(public name: string, public status: JobStatus, private rootUrl: string) {
    }
    
    public listBuilds(): Promise<Array<build.Build>> {
        var self = this;
        return new Promise(function (resolve, reject){
            var buildListUrl = self.rootUrl + '/api/json';
            http.get(buildListUrl, (res) => {
                debug('listJobs status code: ' + res.statusCode);
                var responseBody = '';
                var jobs = new Array<build.Build>();
                res.on('data', chunk => {
                    responseBody += chunk; 
                });
                
                res.on('end', () => {
                    var json = JSON.parse(responseBody);
                    Promise.map(json.builds, jsonBuild => {
                        var b = build.fromJson(jsonBuild);
                        return b.getResult();
                    }).then(resolve);
                });
            }).on('error', err => {
                reject(err);
            });
        });
    };
}