var commander = require('commander');
var chalk = require('chalk');
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

var last24Hours = new Date(Date.now() - 86400000);
var last7days = new Date(Date.now() - 604800000);

repo.loadAllIssues().then(() => {
    return Promise.all([
        repo.list(GithubApi.IssueType.Issue, GithubApi.IssueState.Open),
        repo.list(GithubApi.IssueType.Issue, GithubApi.IssueState.Closed),
        repo.list(GithubApi.IssueType.PullRequest, GithubApi.IssueState.Open),
        repo.list(GithubApi.IssueType.PullRequest, GithubApi.IssueState.Closed),
        repo.list(GithubApi.IssueType.Issue, GithubApi.IssueState.All, GithubApi.IssueTimeStamp.Created, last7days),
        repo.list(GithubApi.IssueType.Issue, GithubApi.IssueState.Open, GithubApi.IssueTimeStamp.Updated, last7days),
        repo.list(GithubApi.IssueType.Issue, GithubApi.IssueState.Closed, GithubApi.IssueTimeStamp.Closed, last7days),
        repo.list(GithubApi.IssueType.PullRequest, GithubApi.IssueState.All, GithubApi.IssueTimeStamp.Created, last7days),
        repo.list(GithubApi.IssueType.PullRequest, GithubApi.IssueState.Open, GithubApi.IssueTimeStamp.Updated, last7days),
        repo.list(GithubApi.IssueType.PullRequest, GithubApi.IssueState.Closed, GithubApi.IssueTimeStamp.Closed, last7days),
        repo.list(GithubApi.IssueType.Issue, GithubApi.IssueState.All, GithubApi.IssueTimeStamp.Created, last24Hours),
        repo.list(GithubApi.IssueType.Issue, GithubApi.IssueState.Open, GithubApi.IssueTimeStamp.Updated, last24Hours),
        repo.list(GithubApi.IssueType.Issue, GithubApi.IssueState.Closed, GithubApi.IssueTimeStamp.Closed, last24Hours),
        repo.list(GithubApi.IssueType.PullRequest, GithubApi.IssueState.All, GithubApi.IssueTimeStamp.Created, last24Hours),
        repo.list(GithubApi.IssueType.PullRequest, GithubApi.IssueState.Open, GithubApi.IssueTimeStamp.Updated, last24Hours),
        repo.list(GithubApi.IssueType.PullRequest, GithubApi.IssueState.Closed, GithubApi.IssueTimeStamp.Closed, last24Hours)
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
