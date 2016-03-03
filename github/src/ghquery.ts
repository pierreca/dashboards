#!/usr/bin/env node

var commander = require('commander');
var chalk = require('chalk');
var packageJson = require('../package.json');

import GithubApi = require('./github_api');
import types = require('./github_types');

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

var repo:GithubApi.GHRepository;
if (user && token) {
    repo = new GithubApi.GHRepository(owner, repository, user, token);
} else {
    repo = new GithubApi.GHRepository(owner, repository);
}

var last24Hours = new Date(Date.now() - 86400000);
var last7days = new Date(Date.now() - 604800000);

var createActivityFilter = function(issueActivity: types.IssueActivity, timestamp: Date) {
    var filterCollection = new types.FilterCollection();
    filterCollection.activity = new types.IssueActivityFilter(issueActivity, timestamp);
    
    return filterCollection;
};

var createdLastWeek = createActivityFilter(types.IssueActivity.Created, last7days);
var updatedLastWeek = createActivityFilter(types.IssueActivity.Updated, last7days);
var closedLastWeek = createActivityFilter(types.IssueActivity.Closed, last7days);

var createdLastDay = createActivityFilter(types.IssueActivity.Created, last24Hours);
var updatedLastDay = createActivityFilter(types.IssueActivity.Updated, last24Hours);
var closedLastDay = createActivityFilter(types.IssueActivity.Closed, last24Hours);

repo.loadAllIssues().then(() => {
    return Promise.all([
        repo.list(types.IssueType.Issue, types.IssueState.Open),
        repo.list(types.IssueType.Issue, types.IssueState.Closed),
        repo.list(types.IssueType.PullRequest, types.IssueState.Open),
        repo.list(types.IssueType.PullRequest, types.IssueState.Closed),
        repo.list(types.IssueType.Issue, types.IssueState.All, createdLastWeek),
        repo.list(types.IssueType.Issue, types.IssueState.Open, updatedLastWeek),
        repo.list(types.IssueType.Issue, types.IssueState.Closed, closedLastWeek),
        repo.list(types.IssueType.PullRequest, types.IssueState.All, createdLastWeek),
        repo.list(types.IssueType.PullRequest, types.IssueState.Open, updatedLastWeek),
        repo.list(types.IssueType.PullRequest, types.IssueState.Closed, closedLastWeek),
        repo.list(types.IssueType.Issue, types.IssueState.All, createdLastDay),
        repo.list(types.IssueType.Issue, types.IssueState.Open, updatedLastDay),
        repo.list(types.IssueType.Issue, types.IssueState.Closed, closedLastDay),
        repo.list(types.IssueType.PullRequest, types.IssueState.All, createdLastDay),
        repo.list(types.IssueType.PullRequest, types.IssueState.Open, updatedLastDay),
        repo.list(types.IssueType.PullRequest, types.IssueState.Closed, closedLastDay)
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
