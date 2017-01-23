#!/usr/bin/env node
"use strict";
var pr = require('prompt');
var commander = require('commander');
var chalk = require('chalk');
var packageJson = require('../package.json');
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
var startPrompt = function () {
    pr.start();
    pr.message = '';
    pr.delimiter = '>';
    pr.get('command', function (err, result) {
        result.command = result.command.trim();
        var splitcmd = result.command.split(' ');
        if (splitcmd.length > 1) {
            result.command = splitcmd[0].trim();
            result.params = splitcmd.slice(1);
        }
        if (commands[result.command]) {
            commands[result.command].execute(result.params);
        }
        else {
            unknowncmd(result.command);
        }
    });
};
var usagecmd = function () {
    console.log('Commands: ');
    for (var cmd in commands) {
        console.log('   ' + cmd + ': ' + commands[cmd].help);
    }
    startPrompt();
};
var helpcmd = function (topic) {
    if (!topic) {
        usagecmd();
    }
    else {
        var helpMessage = chalk.red('Sorry... Unknown keyword...');
        if (commands[topic] && commands[topic].help) {
            helpMessage = commands[topic].help;
        }
        console.log(chalk.bold(topic + ': ') + helpMessage);
        startPrompt();
    }
};
var unknowncmd = function (cmd) {
    console.log(chalk.red('Unknown command: ' + chalk.bold(cmd)));
    startPrompt();
};
var exitcmd = function () {
    console.log('Exiting...');
    process.exit(0);
};
var loadcmd = function () {
    console.log('Loading issues from Github...');
    repo.loadAllIssues().then(function () { return startPrompt(); });
};
var linkcmd = function (issueNumbers) {
    for (var i = 0; i < issueNumbers.length; i++) {
        issueNumbers[i] = parseInt(issueNumbers[i]);
        if (isNaN(issueNumbers[i])) {
            issueNumbers.splice(i, 1);
            i--;
        }
    }
    if (issueNumbers.length > 0) {
        repo.get(issueNumbers).then(function (issues) {
            for (var i = 0; i < issues.length; i++) {
                console.log('[' + issues[i].number + '] ' + issues[i].title);
                console.log(chalk.bold(issues[i].url));
            }
            startPrompt();
        }).catch(function (err) {
            console.log(chalk.red(err.message));
            startPrompt();
        });
    }
    else {
        console.log(chalk.red('No valid issue/pr number'));
        startPrompt();
    }
};
var translateParams = function (params) {
    var filterCollection;
    var issueType = gh_issues_api_1.IssueType.All;
    var issueState = gh_issues_api_1.IssueState.All;
    var issueActivity = gh_issues_api_1.IssueActivity.Updated;
    var negated = false;
    var verifyNegation = function (filter) {
        if (negated) {
            filter.negated = true;
        }
        negated = false;
    };
    var i = 0;
    while (i < params.length) {
        params[i] = params[i].trim();
        if (params[i] === '' ||
            params[i] === 'in' ||
            params[i] === 'the' ||
            params[i] === 'all' ||
            params[i] === 'that' ||
            params[i] === 'are' ||
            params[i] === 'were' ||
            params[i] === 'update' ||
            params[i] === 'updated' ||
            params[i] === 'request' ||
            params[i] === 'requests') {
            params.splice(i, 1);
        }
        else {
            i++;
        }
    }
    while (params.length > 0) {
        switch (params[0]) {
            case 'open':
                issueState = gh_issues_api_1.IssueState.Open;
                break;
            case 'close':
            case 'closed':
                if (issueState === gh_issues_api_1.IssueState.All) {
                    issueState = gh_issues_api_1.IssueState.Closed;
                }
                if (issueActivity === gh_issues_api_1.IssueActivity.Updated) {
                    issueActivity = gh_issues_api_1.IssueActivity.Closed;
                }
                break;
            case 'issues':
                issueType = gh_issues_api_1.IssueType.Issue;
                break;
            case 'pull':
            case 'prs':
                issueType = gh_issues_api_1.IssueType.PullRequest;
                break;
            case 'opened':
            case 'openned':
            case 'created':
                issueActivity = gh_issues_api_1.IssueActivity.Created;
                break;
            case 'assign':
            case 'assigned':
                if (!filterCollection) {
                    filterCollection = new gh_issues_api_1.FilterCollection();
                }
                if (params[1] === 'to') {
                    if (params[2] === 'me') {
                        params[2] = commander.user;
                    }
                    filterCollection.assignee = new gh_issues_api_1.IssueAssigneeFilter(params[2]);
                    params.splice(1, 2);
                }
                else {
                    filterCollection.assignee = new gh_issues_api_1.IssueAssigneeFilter(null);
                    params.splice(1, 1);
                }
                verifyNegation(filterCollection.assignee);
                break;
            case 'label':
            case 'labeled':
            case 'labelled':
                if (!filterCollection) {
                    filterCollection = new gh_issues_api_1.FilterCollection();
                }
                filterCollection.label = new gh_issues_api_1.IssueLabelFilter(params[1]);
                verifyNegation(filterCollection.label);
                params.splice(1, 1);
                break;
            case 'last':
            case 'past':
                var multiplier = parseInt(params[1]);
                if (isNaN(multiplier)) {
                    console.log(chalk.red('invalid duration multiplier: ' + chalk.bold(params[1])));
                    startPrompt();
                    return;
                }
                var durationUnit;
                switch (params[2]) {
                    case 'hours':
                        durationUnit = 3600000;
                        break;
                    case 'days':
                        durationUnit = 86400000;
                        break;
                    case 'weeks':
                        durationUnit = 604800000;
                        break;
                    default:
                        console.log(chalk.red('Unknown duration keyword: ' + chalk.bold(params[2])));
                        startPrompt();
                        return;
                }
                var relevantTimeStamp = new Date(Date.now() - (multiplier * durationUnit));
                var activityFilter = new gh_issues_api_1.IssueActivityFilter(issueActivity, relevantTimeStamp);
                if (!filterCollection) {
                    filterCollection = new gh_issues_api_1.FilterCollection();
                }
                filterCollection.activity = activityFilter;
                verifyNegation(filterCollection.activity);
                params.splice(1, 2);
                break;
            case 'not':
                negated = true;
                break;
            default:
                console.log('Unknown criteria: ', params[0]);
                startPrompt();
                return;
        }
        params.splice(0, 1);
    }
    return {
        type: issueType,
        state: issueState,
        filters: filterCollection
    };
};
var countcmd = function (params) {
    var query = translateParams(params);
    repo.list(query.type, query.state, query.filters).then(function (issues) {
        console.log(issues.length);
        startPrompt();
    });
};
var listcmd = function (params) {
    var query = translateParams(params);
    repo.list(query.type, query.state, query.filters).then(function (issues) {
        for (var i = 0; i < issues.length; i++) {
            var assignee = issues[i].assignee ? issues[i].assignee.login : chalk.bold(chalk.red('no-one'));
            var stateColor = chalk.white;
            if (issues[i].state === 'open') {
                stateColor = chalk.green;
            }
            else if (issues[i].state === 'closed') {
                stateColor = chalk.red;
            }
            console.log(stateColor('[' + issues[i].number + '] ') + issues[i].title + ' [' + assignee + '] ');
        }
        startPrompt();
    });
};
var commands = [];
commands['usage'] = { help: 'Displays help about a command passed as a parameter', execute: helpcmd };
commands['help'] = { help: 'Displays help about a command passed as a parameter', execute: helpcmd };
commands['exit'] = { help: 'Exits ghprompt', execute: exitcmd };
commands['load'] = { help: 'Load all issues of the repository', execute: loadcmd };
commands['count'] = { help: 'Count issues with the specific criteria', execute: countcmd };
commands['list'] = { help: 'List issues with the specific criteria', execute: listcmd };
commands['link'] = { help: 'Get the link for a specific issue or PR', execute: linkcmd };
commands['url'] = { help: 'Get the link for a specific issue or PR', execute: linkcmd };
commands['get'] = { help: 'Get the link for a specific issue or PR', execute: linkcmd };
startPrompt();
//# sourceMappingURL=ghprompt.js.map