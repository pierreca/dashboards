#!/usr/bin/env node
"use strict";
var fs = require('fs');
var commander = require('commander');
var chalk = require('chalk');
var packageJson = require('../package.json');
var Promise = require("bluebird");
var gh_issues_api_1 = require("gh-issues-api");
commander.version(packageJson.version)
    .usage('[options] [file-name]')
    .option('-u, --user [user]', 'Github username (used to authenticate the request and raise API calls rate limits)')
    .option('-p, --password [password/token]', 'Github password or security token (used to authenticate the request and raise API calls rate limits)')
    .parse(process.argv);
var user = commander.user;
var token = commander.password;
var outputFile = commander.args[0];
var owner = 'azure';
var repositories = [
    'azure-iot-sdks',
    'azure-iot-sdk-c',
    'azure-iot-sdk-csharp',
    'azure-iot-sdk-node',
    'azure-iot-sdk-java',
    'azure-iot-sdk-python',
    'iothub-explorer',
    'iothub-diagnostics'
];
var labels = [
    'bug',
    'build issue',
    'investigation required',
    'help wanted',
    'enhancement',
    'question',
    'documentation',
];
var csvLines = [];
csvLines.push('repo name,' + labels.join(',') + ',total');
var promises = repositories.map(function (repoName) {
    var repo;
    if (user && token) {
        repo = new gh_issues_api_1.GHRepository(owner, repoName, user, token);
    }
    else {
        repo = new gh_issues_api_1.GHRepository(owner, repoName);
    }
    var report = {
        name: repoName,
    };
    return repo.loadAllIssues()
        .then(function () {
        var promises = labels.map(function (label) {
            var filterCollection = new gh_issues_api_1.FilterCollection();
            filterCollection.label = new gh_issues_api_1.IssueLabelFilter(label);
            return Promise.all([
                repo.list(gh_issues_api_1.IssueType.All, gh_issues_api_1.IssueState.Open, filterCollection).then(function (issues) { return report[label] = issues.length; }),
                repo.list(gh_issues_api_1.IssueType.All, gh_issues_api_1.IssueState.Open).then(function (issues) { return report['total'] = issues.length; })
            ]);
        });
        return Promise.all(promises);
    })
        .then(function () {
        var counters = labels.map(function (label) { return report[label]; }).join(',');
        csvLines.push(report.name + ',' + counters + ',' + report['total']);
    });
});
Promise.all(promises).then(function () {
    csvLines.forEach(function (line) {
        console.log(line);
        if (outputFile) {
            fs.appendFileSync(outputFile, line + '\n');
        }
    });
    process.exit(0);
}).catch(function (error) {
    console.error(error.toString());
    process.exit(1);
});
//# sourceMappingURL=shiproom_report.js.map