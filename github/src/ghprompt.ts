'user strict';

var pr = require('prompt');
var commander = require('commander');
var packageJson = require('../package.json');

import GithubApi = require('./github_api');

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
        var splitcmd = result.command.split(' ');
        if (splitcmd.length > 1) {
            result.command = splitcmd[0];
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

var helpcmd = function(topic?: String) {
    console.log('Help about ' + topic);
    startPrompt();
};

var unknowncmd = function (cmd: String) {
    console.log('Unknown command: ' + cmd);
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

var countcmd = function(params: Array<String>) {
    var issueType: GithubApi.IssueType;
    var issueState: GithubApi.IssueState;
    
    switch(params[0]) {
        case 'open':
            issueState = GithubApi.IssueState.Open;
            break;
        case 'closed':
            issueState = GithubApi.IssueState.Closed;
            break;
        case 'all':
            issueState = GithubApi.IssueState.All;
            break;
        default: 
            console.log('Unknown issue state');
            startPrompt();
            break;
    }
    
    switch(params[1]) {
        case 'issues': 
            issueType = GithubApi.IssueType.Issue;
            break;
        case 'prs': 
            issueType = GithubApi.IssueType.PullRequest;
            break;
        case 'all': 
            issueType = GithubApi.IssueType.All;
            break;
        default: 
            console.log('Unknown issue type');
            startPrompt();
            break;
    }
    
    repo.list(issueType, issueState).then(issues => {
        console.log(params[0] + ' ' + params[1] + ': ' + issues.length);
        startPrompt();
    });
};

var commands = [];
commands['usage'] = { help: 'Displays available commands', execute: usagecmd };
commands['help'] = { help: 'Displays help about a command passed as a parameter', execute: helpcmd };
commands['exit'] = { help: 'Exits ghprompt', execute: exitcmd };
commands['load'] = { help: 'Load all issues of the repository', execute: loadcmd };
commands['count'] = { help: 'Count issues with the specific criteria', execute: countcmd };

startPrompt();