#!/usr/bin/env node

var commander = require('commander');
var chalk = require('chalk');
var packageJson = require('../package.json');
import * as moment from 'moment';
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

var repo:GHRepository;
if (user && token) {
    repo = new GHRepository(owner, repository, user, token);
} else {
    repo = new GHRepository(owner, repository);
}

var cutOffDate = moment().subtract(days, 'days').toDate();
console.log('Looking at issues not updated since ' + moment(cutOffDate).fromNow());

var createActivityFilter = function(issueActivity: IssueActivity, timestamp: Date) {
    var filterCollection = new FilterCollection();
    filterCollection.activity = new IssueActivityFilter(issueActivity, timestamp);
    filterCollection.activity.negated = true;
    return filterCollection;
};

var notUpdated = createActivityFilter(IssueActivity.Updated, cutOffDate);

repo.loadAllIssues()
    .then(() => repo.list(IssueType.Issue, IssueState.Open, notUpdated))
    .then(issuesList => {
    console.log(issuesList.length + ' issues not updated in the past ' + days + ' days:');
    issuesList.forEach(issue => {
      console.log('[' + issue.number + '] ' + issue.title + ': last updated: ' + moment(issue.updated_at).fromNow());
    });
    process.exit(0);
});
