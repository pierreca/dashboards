var http = require('http');
var Promise = require('bluebird');
var debug = require('debug')('jenkins:server');

import job = require('./job');

export class Server {
    rootUrl: string;
    public constructor(url: string) {
        this.rootUrl = url;
    };
    
    public listJobs(): Promise<Array<job.Job>> {
        var self = this;
        return new Promise(function (resolve, reject){
            var jobListUrl = self.rootUrl + '/api/json';
            http.get(jobListUrl, (res) => {
                debug('listJobs status code: ' + res.statusCode);
                var responseBody = '';
                var jobs = new Array<job.Job>();
                res.on('data', chunk => {
                    responseBody += chunk; 
                });
                
                res.on('end', () => {
                    var json = JSON.parse(responseBody);
                    Promise.map(json.jobs, jsonJob => job.fromJson(jsonJob)).then(resolve);
                });
            }).on('error', err => {
                reject(err);
            });
        });
    };
}