var http = require('http');
var Promise = require('bluebird');
var debug = require('debug')('jenkins:build');

import buildres = require('./buildresult');

export function fromJson(jsonBuild: any) : Build {
    var newBuild = new Build(jsonBuild.number, jsonBuild.url);
    return newBuild;
};

export class Build {
    public constructor (public number: number, public rootUrl: string) { };
    
    public getResult(): Promise<buildres.BuildResult> {
        var self = this;
        return new Promise(function (resolve, reject){
            var buildUrl = self.rootUrl + '/api/json';
            http.get(buildUrl, (res) => {
                debug('buildUrl status code: ' + res.statusCode);
                var responseBody = '';
                res.on('data', chunk => {
                    responseBody += chunk; 
                });
                
                res.on('end', () => {
                    var json = JSON.parse(responseBody);
                    resolve(buildres.fromJson(json));
                });
            }).on('error', err => {
                reject(err);
            });
        });
    }
};