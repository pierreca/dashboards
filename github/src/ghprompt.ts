#!/usr/bin/env node

var pr = require('prompt');
var commander = require('commander');
var packageJson = require('../package.json');
var chalk = require('chalk');

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

var startPrompt = function() {
    pr.start();
    pr.message = '';
    pr.delimiter = '>';

    pr.get('command', (err, result) => {
        result.command = result.command.trim();
        var splitcmd = result.command.split(' ');
        if (splitcmd.length > 1) {
            result.command = splitcmd[0].trim();
            result.params = splitcmd.slice(1);
        }
        
        if(commands[result.command]) {
            commands[result.command].execute(result.params);
        } else {
            unknowncmd(result.command);
        }
    });
};

var usagecmd = function() {
    console.log('Commands: ');
    for (var cmd in commands) {
       console.log('   ' + cmd + ': ' + commands[cmd].help);
    }
    startPrompt();
};

var helpcmd = function(topic?: string) {
    if (!topic) {
        usagecmd();
    } else {
        var helpMessage = chalk.red('Sorry... Unknown keyword...');
        
        if (commands[topic] && commands[topic].help) {
            helpMessage = commands[topic].help;
        }
        
        console.log(chalk.bold(topic + ': ') +  helpMessage);
        startPrompt();
    }
};

var unknowncmd = function (cmd: string) {
    console.log(chalk.red('Unknown command: ' + chalk.bold(cmd)));
    startPrompt();
};

var exitcmd = function() {
    console.log('Exiting...');
    process.exit(0);
};

var loadcmd = function() {
    console.log('Loading issues from Github...');
    repo.loadAllIssues().then(() => startPrompt());
};

var linkcmd = function (issueNumbers) {
    for (var i = 0; i < issueNumbers.length; i++) {
        issueNumbers[i] = parseInt(issueNumbers[i]);
        if(isNaN(issueNumbers[i])) {
            issueNumbers.splice(i, 1);
            i--;
        }
    }
    
    if (issueNumbers.length > 0) {
        repo.get(issueNumbers).then(issues => {
            for (var i = 0; i < issues.length; i++) {
                console.log('[' + issues[i].number + '] ' + issues[i].title);
                console.log(chalk.bold(issues[i].url));
            }
            startPrompt();
        }).catch(err => {
            console.log(chalk.red(err.message));
            startPrompt();
        });
    } else {
        console.log(chalk.red('No valid issue/pr number'));
        startPrompt();
    }
}

var translateParams = function (params: Array<string>) {
    var filterCollection: types.FilterCollection;
    var issueType: types.IssueType = types.IssueType.All;
    var issueState: types.IssueState = types.IssueState.All;
    var issueActivity: types.IssueActivity = types.IssueActivity.Updated;
    var negated = false;
    var verifyNegation = function (filter: types.IssueFilter) {
        if (negated) {
            filter.negated = true;
        }
        
        negated = false;
    }
    
    var i = 0;
    while(i < params.length) {
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
        } else {
            i++;
        }
    }
    
    while(params.length > 0) {
        switch(params[0]) {
            case 'open':
                issueState = types.IssueState.Open;
                break;
            case 'close':
            case 'closed':
                if (issueState === types.IssueState.All) {
                    issueState = types.IssueState.Closed;
                }
                
                if (issueActivity === types.IssueActivity.Updated) {
                    issueActivity = types.IssueActivity.Closed;
                }
                
                break;
            case 'issues': 
                issueType = types.IssueType.Issue;
                break;
            case 'pull':
            case 'prs': 
                issueType = types.IssueType.PullRequest;
                break;
            case 'opened':
            case 'openned':
            case 'created':
                issueActivity = types.IssueActivity.Created;
                break;
            case 'assign':
            case 'assigned':
                if (!filterCollection) {
                    filterCollection = new types.FilterCollection();
                }
                
                if (params[1] === 'to') {
                    if (params[2] === 'me') {
                        params[2] = commander.user;
                    }
                    filterCollection.assignee = new types.IssueAssigneeFilter(params[2]);
                    params.splice(1, 2);
                } else {
                    filterCollection.assignee = new types.IssueAssigneeFilter(null);
                    params.splice(1, 1);
                }
                verifyNegation(filterCollection.assignee);
                
                break;
            case 'label':
            case 'labeled':
            case 'labelled':
                if (!filterCollection) {
                    filterCollection = new types.FilterCollection();
                }
                filterCollection.label = new types.IssueLabelFilter(params[1]);
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
                
                var durationUnit: number;
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
                var activityFilter = new types.IssueActivityFilter(issueActivity, relevantTimeStamp);
                if(!filterCollection) {
                    filterCollection = new types.FilterCollection();
                }
                
                filterCollection.activity = activityFilter
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
    }
}

var countcmd = function(params: Array<string>) {
    var query = translateParams(params);
    repo.list(query.type, query.state, query.filters).then(issues => {
        console.log(issues.length);
        startPrompt();
    });
};

var listcmd = function(params: Array<string>) {
    var query = translateParams(params);
    repo.list(query.type, query.state, query.filters).then(issues => {
        for (var i = 0; i < issues.length; i++) {
            var assignee = issues[i].assignee ? issues[i].assignee.login : chalk.bold(chalk.red('no-one'));
            var stateColor = chalk.white;
            if (issues[i].state === 'open') {
                stateColor = chalk.green;
            } else if (issues[i].state === 'closed') {
                stateColor = chalk.red;
            }
        
            console.log(stateColor('[' + issues[i].number + '] ')  + issues[i].title + ' [' + assignee + '] ');
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