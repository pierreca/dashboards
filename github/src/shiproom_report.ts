#!/usr/bin/env node

var fs = require('fs');
var commander = require('commander');
var chalk = require('chalk');
var packageJson = require('../package.json');

import GithubApi = require('./github_api');
import types = require('./github_types');

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
csvLines.push('repo name,' + labels.join(',') + ',total')

var promises = repositories.map(repoName => {
  var repo:GithubApi.GHRepository;
  if (user && token) {
      repo = new GithubApi.GHRepository(owner, repoName, user, token);
  } else {
      repo = new GithubApi.GHRepository(owner, repoName);
  }

  var report = {
    name: repoName,
  };

  return repo.loadAllIssues()
      .then(() => {
        var promises = labels.map(label => {
          var filterCollection = new types.FilterCollection();
          filterCollection.label = new types.IssueLabelFilter(label);
          return Promise.all([
            repo.list(types.IssueType.All, types.IssueState.Open, filterCollection).then(issues => report[label] = issues.length),
            repo.list(types.IssueType.All, types.IssueState.Open).then(issues => report['total'] = issues.length)
          ]);
        });

        return Promise.all(promises);
      })
      .then(() => {
        var counters = labels.map(label => report[label]).join(',');
        csvLines.push(report.name + ',' + counters + ',' + report['total']);
      });
});

Promise.all(promises).then(() => {
  csvLines.forEach(line => {
    console.log(line);
    if (outputFile) {
      fs.appendFileSync(outputFile, line + '\n');
    }
  });
  process.exit(0);
}).catch(error => {
  console.error(error.toString());
  process.exit(1);
});


