#!/usr/bin/env node

var fs = require('fs');
var commander = require('commander');
var chalk = require('chalk');
var packageJson = require('../package.json');

import Promise = require('bluebird');

import {
    GHRepository,
    IssueType,
    IssueState,
    IssueLabelFilter,
    FilterCollection
    } from 'gh-issues-api';

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
  var repo:GHRepository;
  if (user && token) {
      repo = new GHRepository(owner, repoName, user, token);
  } else {
      repo = new GHRepository(owner, repoName);
  }

  var report = {
    name: repoName,
  };

  return repo.loadAllIssues()
      .then(() => {
        var promises = labels.map(label => {
          var filterCollection = new FilterCollection();
          filterCollection.label = new IssueLabelFilter(label);
          return Promise.all([
            repo.list(IssueType.All, IssueState.Open, filterCollection).then(issues => report[label] = issues.length),
            repo.list(IssueType.All, IssueState.Open).then(issues => report['total'] = issues.length)
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


