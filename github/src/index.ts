import GithubApi = require('./github_api');

var usage = function () {
    console.log('Usage:')
    console.log('node index.js <owner> <repository> [user] [token]');
    console.log('Both user and token must be specified if you\'re hitting the Github API rate limits.');
};

if (process.argv.length < 4) {
    console.error('Invalid arguments');
    usage();
    process.exit(-1);
}

var owner = process.argv[2];
var repository = process.argv[3];
var user = process.argv[4];
var token = process.argv[5];

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
        repo.count(GithubApi.IssueType.Issue, GithubApi.IssueState.Open),
        repo.count(GithubApi.IssueType.Issue, GithubApi.IssueState.Closed),
        repo.count(GithubApi.IssueType.PullRequest, GithubApi.IssueState.Open),
        repo.count(GithubApi.IssueType.PullRequest, GithubApi.IssueState.Closed),
        repo.count(GithubApi.IssueType.Issue, GithubApi.IssueState.All, GithubApi.IssueTimeStamp.Created, last7days),
        repo.count(GithubApi.IssueType.Issue, GithubApi.IssueState.Open, GithubApi.IssueTimeStamp.Updated, last7days),
        repo.count(GithubApi.IssueType.Issue, GithubApi.IssueState.Closed, GithubApi.IssueTimeStamp.Closed, last7days),
        repo.count(GithubApi.IssueType.PullRequest, GithubApi.IssueState.All, GithubApi.IssueTimeStamp.Created, last7days),
        repo.count(GithubApi.IssueType.PullRequest, GithubApi.IssueState.Open, GithubApi.IssueTimeStamp.Updated, last7days),
        repo.count(GithubApi.IssueType.PullRequest, GithubApi.IssueState.Closed, GithubApi.IssueTimeStamp.Closed, last7days),
        repo.count(GithubApi.IssueType.Issue, GithubApi.IssueState.All, GithubApi.IssueTimeStamp.Created, last24Hours),
        repo.count(GithubApi.IssueType.Issue, GithubApi.IssueState.Open, GithubApi.IssueTimeStamp.Updated, last24Hours),
        repo.count(GithubApi.IssueType.Issue, GithubApi.IssueState.Closed, GithubApi.IssueTimeStamp.Closed, last24Hours),
        repo.count(GithubApi.IssueType.PullRequest, GithubApi.IssueState.All, GithubApi.IssueTimeStamp.Created, last24Hours),
        repo.count(GithubApi.IssueType.PullRequest, GithubApi.IssueState.Open, GithubApi.IssueTimeStamp.Updated, last24Hours),
        repo.count(GithubApi.IssueType.PullRequest, GithubApi.IssueState.Closed, GithubApi.IssueTimeStamp.Closed, last24Hours)
    ]);
}).then(function(counters){
    console.log('--- Totals ---')
    console.log('Open issues: ' + counters[0]);
    console.log('Closed issues: ' + counters[1]);
    console.log('Open pull requests: ' + counters[2]);
    console.log('Closed pull requests: ' + counters[3]);
    console.log('--- Last 7 days ---');
    console.log('Created issues: ' + counters[4]);
    console.log('Updated issues: ' + counters[5]);
    console.log('Closed issues: ' + counters[6]);
    console.log('Created pull requests: ' + counters[7]);
    console.log('Updated pull requests: ' + counters[8]);
    console.log('Closed pull requests: ' + counters[9]);
    console.log('--- Last 24 hours ---');
    console.log('Created issues: ' + counters[10]);
    console.log('Updated issues: ' + counters[11]);
    console.log('Closed issues: ' + counters[12]);
    console.log('Created pull requests: ' + counters[12]);
    console.log('Updated pull requests: ' + counters[13]);
    console.log('Closed pull requests: ' + counters[14]);
    process.exit(0);
});
