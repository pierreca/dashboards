#!/usr/bin/env node

var commander = require('commander');
var chalk = require('chalk');
var packageJson = require('../package.json');
import Promise = require('bluebird');

import {
    GHRepository,
    IssueType,
    IssueState,
    IssueActivity,
    IssueActivityFilter,
    FilterCollection
    } from 'gh-issues-api';


commander.version(packageJson.version)
         .usage('[options] <OWNER> <REPOSITORY>')
         .option('-u, --user [user]', 'Github username (used to authenticate the request and raise API calls rate limits)')
         .option('-p, --password [password/token]', 'Github password or security token (used to authenticate the request and raise API calls rate limits)')
         .parse(process.argv);

if (commander.args.length < 2) {
    commander.help();
    process.exit(-1);
}

var owner = commander.args[0];
var repository = commander.args[1];
var user = commander.user;
var token = commander.password;

var repo:GHRepository;
if (user && token) {
    repo = new GHRepository(owner, repository, user, token);
} else {
    repo = new GHRepository(owner, repository);
}

var last24Hours = new Date(Date.now() - 86400000);
var last7days = new Date(Date.now() - 604800000);

var createActivityFilter = function(issueActivity: IssueActivity, timestamp: Date) {
    var filterCollection = new FilterCollection();
    filterCollection.activity = new IssueActivityFilter(issueActivity, timestamp);
    
    return filterCollection;
};

var createdLastWeek = createActivityFilter(IssueActivity.Created, last7days);
var updatedLastWeek = createActivityFilter(IssueActivity.Updated, last7days);
var closedLastWeek = createActivityFilter(IssueActivity.Closed, last7days);

var createdLastDay = createActivityFilter(IssueActivity.Created, last24Hours);
var updatedLastDay = createActivityFilter(IssueActivity.Updated, last24Hours);
var closedLastDay = createActivityFilter(IssueActivity.Closed, last24Hours);

repo.loadAllIssues().then(() => {
    return Promise.all([
        repo.list(IssueType.Issue, IssueState.Open),
        repo.list(IssueType.Issue, IssueState.Closed),
        repo.list(IssueType.PullRequest, IssueState.Open),
        repo.list(IssueType.PullRequest, IssueState.Closed),
        repo.list(IssueType.Issue, IssueState.All, createdLastWeek),
        repo.list(IssueType.Issue, IssueState.Open, updatedLastWeek),
        repo.list(IssueType.Issue, IssueState.Closed, closedLastWeek),
        repo.list(IssueType.PullRequest, IssueState.All, createdLastWeek),
        repo.list(IssueType.PullRequest, IssueState.Open, updatedLastWeek),
        repo.list(IssueType.PullRequest, IssueState.Closed, closedLastWeek),
        repo.list(IssueType.Issue, IssueState.All, createdLastDay),
        repo.list(IssueType.Issue, IssueState.Open, updatedLastDay),
        repo.list(IssueType.Issue, IssueState.Closed, closedLastDay),
        repo.list(IssueType.PullRequest, IssueState.All, createdLastDay),
        repo.list(IssueType.PullRequest, IssueState.Open, updatedLastDay),
        repo.list(IssueType.PullRequest, IssueState.Closed, closedLastDay)
    ]);
}).then(function(issuesList){
    console.log(chalk.bold('--- Totals ---'));
    console.log('Open issues: ' + issuesList[0].length);
    console.log('Closed issues: ' + issuesList[1].length);
    console.log('Open pull requests: ' + issuesList[2].length);
    console.log('Closed pull requests: ' + issuesList[3].length);
    console.log(chalk.bold('--- Last 7 days ---'));
    console.log('Created issues: ' + issuesList[4].length);
    console.log('Updated issues: ' + issuesList[5].length);
    console.log('Closed issues: ' + issuesList[6].length);
    console.log('Created pull requests: ' + issuesList[7].length);
    console.log('Updated pull requests: ' + issuesList[8].length);
    console.log('Closed pull requests: ' + issuesList[9].length);
    console.log(chalk.bold('--- Last 24 hours ---'));
    console.log('Created issues: ' + issuesList[10].length);
    console.log('Updated issues: ' + issuesList[11].length);
    console.log('Closed issues: ' + issuesList[12].length);
    console.log('Created pull requests: ' + issuesList[12].length);
    console.log('Updated pull requests: ' + issuesList[13].length);
    console.log('Closed pull requests: ' + issuesList[14].length);
    process.exit(0);
});
