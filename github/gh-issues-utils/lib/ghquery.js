#!/usr/bin/env node
"use strict";
var commander = require('commander');
var chalk = require('chalk');
var packageJson = require('../package.json');
var Promise = require("bluebird");
var gh_issues_api_1 = require("gh-issues-api");
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
var repo;
if (user && token) {
    repo = new gh_issues_api_1.GHRepository(owner, repository, user, token);
}
else {
    repo = new gh_issues_api_1.GHRepository(owner, repository);
}
var last24Hours = new Date(Date.now() - 86400000);
var last7days = new Date(Date.now() - 604800000);
var createActivityFilter = function (issueActivity, timestamp) {
    var filterCollection = new gh_issues_api_1.FilterCollection();
    filterCollection.activity = new gh_issues_api_1.IssueActivityFilter(issueActivity, timestamp);
    return filterCollection;
};
var createdLastWeek = createActivityFilter(gh_issues_api_1.IssueActivity.Created, last7days);
var updatedLastWeek = createActivityFilter(gh_issues_api_1.IssueActivity.Updated, last7days);
var closedLastWeek = createActivityFilter(gh_issues_api_1.IssueActivity.Closed, last7days);
var createdLastDay = createActivityFilter(gh_issues_api_1.IssueActivity.Created, last24Hours);
var updatedLastDay = createActivityFilter(gh_issues_api_1.IssueActivity.Updated, last24Hours);
var closedLastDay = createActivityFilter(gh_issues_api_1.IssueActivity.Closed, last24Hours);
repo.loadAllIssues().then(function () {
    return Promise.all([
        repo.list(gh_issues_api_1.IssueType.Issue, gh_issues_api_1.IssueState.Open),
        repo.list(gh_issues_api_1.IssueType.Issue, gh_issues_api_1.IssueState.Closed),
        repo.list(gh_issues_api_1.IssueType.PullRequest, gh_issues_api_1.IssueState.Open),
        repo.list(gh_issues_api_1.IssueType.PullRequest, gh_issues_api_1.IssueState.Closed),
        repo.list(gh_issues_api_1.IssueType.Issue, gh_issues_api_1.IssueState.All, createdLastWeek),
        repo.list(gh_issues_api_1.IssueType.Issue, gh_issues_api_1.IssueState.Open, updatedLastWeek),
        repo.list(gh_issues_api_1.IssueType.Issue, gh_issues_api_1.IssueState.Closed, closedLastWeek),
        repo.list(gh_issues_api_1.IssueType.PullRequest, gh_issues_api_1.IssueState.All, createdLastWeek),
        repo.list(gh_issues_api_1.IssueType.PullRequest, gh_issues_api_1.IssueState.Open, updatedLastWeek),
        repo.list(gh_issues_api_1.IssueType.PullRequest, gh_issues_api_1.IssueState.Closed, closedLastWeek),
        repo.list(gh_issues_api_1.IssueType.Issue, gh_issues_api_1.IssueState.All, createdLastDay),
        repo.list(gh_issues_api_1.IssueType.Issue, gh_issues_api_1.IssueState.Open, updatedLastDay),
        repo.list(gh_issues_api_1.IssueType.Issue, gh_issues_api_1.IssueState.Closed, closedLastDay),
        repo.list(gh_issues_api_1.IssueType.PullRequest, gh_issues_api_1.IssueState.All, createdLastDay),
        repo.list(gh_issues_api_1.IssueType.PullRequest, gh_issues_api_1.IssueState.Open, updatedLastDay),
        repo.list(gh_issues_api_1.IssueType.PullRequest, gh_issues_api_1.IssueState.Closed, closedLastDay)
    ]);
}).then(function (issuesList) {
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
//# sourceMappingURL=ghquery.js.map