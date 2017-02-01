#!/usr/bin/env node
"use strict";
var commander = require('commander');
var chalk = require('chalk');
var packageJson = require('../package.json');
var moment = require("moment");
var gh_issues_api_1 = require("gh-issues-api");
commander.version(packageJson.version)
    .usage('[options] <OWNER> <REPOSITORY>')
    .option('-u, --user [user]', 'Github username (used to authenticate the request and raise API calls rate limits)')
    .option('-p, --password [password/token]', 'Github password or security token (used to authenticate the request and raise API calls rate limits)')
    .option('-d, --days [days]', 'Days since the last time the issue was updated (7 by default)')
    .parse(process.argv);
if (commander.args.length < 2) {
    commander.help();
    process.exit(-1);
}
var owner = commander.args[0];
var repository = commander.args[1];
var user = commander.user;
var token = commander.password;
var days = commander.days || 7;
var repo;
if (user && token) {
    repo = new gh_issues_api_1.GHRepository(owner, repository, user, token);
}
else {
    repo = new gh_issues_api_1.GHRepository(owner, repository);
}
var cutOffDate = moment().subtract(days, 'days').toDate();
console.log('Looking at issues not updated since ' + moment(cutOffDate).fromNow());
var createActivityFilter = function (issueActivity, timestamp) {
    var filterCollection = new gh_issues_api_1.FilterCollection();
    filterCollection.activity = new gh_issues_api_1.IssueActivityFilter(issueActivity, timestamp);
    filterCollection.activity.negated = true;
    return filterCollection;
};
var notUpdated = createActivityFilter(gh_issues_api_1.IssueActivity.Updated, cutOffDate);
repo.loadAllIssues()
    .then(function () { return repo.list(gh_issues_api_1.IssueType.Issue, gh_issues_api_1.IssueState.Open, notUpdated); })
    .then(function (issuesList) {
    console.log(issuesList.length + ' issues not updated in the past ' + days + ' days:');
    issuesList.forEach(function (issue) {
        console.log('[' + issue.number + '] ' + issue.title + ': last updated: ' + moment(issue.updated_at).fromNow());
    });
    process.exit(0);
});
//# sourceMappingURL=stale_issues.js.map