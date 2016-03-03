var Https = require('https');
var Promise = require('bluebird');
var debug = require('debug')('github_api');
var url = require('url');
var loki = require('lokijs');

export enum IssueType {
    Issue,
    PullRequest,
    All
}

export enum IssueState {
    Open,
    Closed,
    All
}

export enum IssueActivity {
    Created,
    Updated,
    Closed
}

export interface IssueFilter {
    negated: boolean;
    apply(issue: any):boolean;
}

export class IssueActivityFilter implements IssueFilter {
    negated: boolean = false;
    constructor (public activity: IssueActivity, public timestamp: Date) {};
    
    public apply = (issue: any):boolean => {
        var ts = null;
        switch(this.activity) {
            case IssueActivity.Created:
                ts = new Date(issue.created_at);
                break;
            case IssueActivity.Updated:
                ts = new Date(issue.created_at);
                break;
            case IssueActivity.Closed:
                ts = new Date(issue.created_at);
                break;
        }
        var result = ts >= this.timestamp;
        return this.negated ? !result : result;        
    }
}

export class IssueAssigneeFilter implements IssueFilter {
    negated: boolean = false;
    constructor (public assignee: string) {};
    
    public apply = (issue: any):boolean => {
        var result = false;
        
        if (this.assignee === null) {
            result = !!issue.assignee;
        } else if (issue.assignee) {
            result = issue.assignee.login === this.assignee;
        }
        
        return this.negated ? !result : result;
    }
}

export class IssueLabelFilter implements IssueFilter {
    negated: boolean = false;
    constructor (public label: string) {};
    
    public apply = (issue: any):boolean => {
        var result = false;
        for (var i = 0; i < issue.labels.length; i++) {
            if (issue.labels[i].name === this.label) {
                result = true;
                break;
            }
        }
        return this.negated ? !result : result;
    }
}

export class FilterCollection {
    activity: IssueActivityFilter;
    label: IssueLabelFilter;
    assignee: IssueAssigneeFilter;
}

export class GHRepository {
    issues: any;
    constructor (private owner:string, private name: string, private user?:string, private token?:string) {
        var repoDB = new loki('issues.json');
        this.issues = repoDB.addCollection('issues');
    }
    
    public get(ids : Array<number>) : Promise<Array<any>> {
        var self = this;
        return new Promise(function(resolve, reject) {
            var results = [];            
            for (var i = 0; i < ids.length; i++) {
                var issue = self.issues.findOne({ number: ids[i]});
                if (issue) {
                    results.push(issue);
                } else {
                    reject(new Error('Unknown issue/pr number'));
                }
            }
            if (results.length > 0) {
                resolve(results);
            } else {
                reject (new Error('no issues found.'));
            }
        });
    }
    
    public loadAllIssues() : Promise<Array<any>>{
        var self = this;
        return new Promise(function (resolve, reject) {
            var options:any = {
                host: 'api.github.com',
                path: '/repos/' + self.owner + '/' + self.name + '/issues?per_page=100&state=all',
                method: 'GET',
                headers: {
                    'user-agent' : 'node'
                }
            };
            
            if(self.user && self.token) {
                options.auth = self.user + ':' + self.token;
            }
            
            var processResponse = function (response: any, resolve?: Function) {
                var responseBody = '';
                response.on('data', function (chunk) {
                    responseBody += chunk.toString('utf-8');
                });
                response.on('end', function() {
                    var json = JSON.parse(responseBody);
                    json.forEach((issue) => {
                        self.issues.insert(issue);
                    });
                    
                    if (!!resolve) {
                        resolve(self.issues);
                    }
                });
            }
            
            var sendRequest = function(options, lastPagePath?: string) {
                var req = Https.request(options, (res) => {
                    debug('GET All Issues: ', res.statusCode + ': ' + res.statusMessage);
                    if(res.statusCode === 403) {
                        reject(new Error('Github APIs returned a 403 error: likely exceeded API call rate limits (60 API calls per hour when not authenticated)'));
                    } else {
                        if (!res.headers.link || 
                        (!!lastPagePath && options.path === lastPagePath)) {
                            processResponse(res, resolve);
                        } else {
                            processResponse(res);
                            var nextPageLink = res.headers.link.split(',')[0].split(';')[0].slice(1, -1);
                            if (!lastPagePath) {
                                var lastPageLink = res.headers.link.split(',')[1].split(';')[0].slice(2, -1);
                                var lastPageProps = url.parse(lastPageLink);
                                lastPagePath = lastPageProps.pathname + lastPageProps.search;
                            }
                            var properties = url.parse(nextPageLink, true);
                            debug('downloading next page: ' + nextPageLink);
                            var properties = url.parse(nextPageLink, true);
                            options.path = properties.pathname + properties.search;
                            
                            sendRequest(options, lastPagePath);
                        }
                    }
                }); 
                req.end();
            };
            
            sendRequest(options);
        });
    };
    
    
    public list(type: IssueType, state: IssueState, filters?: FilterCollection) : Promise<any> {
        var self = this;
        return new Promise(function (resolve, reject) {
            var query = undefined;
            var queries = [];
            
            if (state !== IssueState.All) {
                queries.push((state === IssueState.Open) ? { state : 'open' } : { state: 'closed' });    
            }
            
            if(type !== IssueType.All) {
                queries.push((type === IssueType.Issue) ? { pull_request : undefined } : { pull_request: { '$ne': undefined } });
            }
            
            if(queries.length === 1) {
                query = queries[0];
            } else if (queries.length > 1) {
                query = { '$and' : queries }
            }
            
            var results;
            if(filters) {
                results = self.issues.chain().find(query).where(issue => {
                    var result = undefined;
                    
                    if (filters.activity) result = filters.activity.apply(issue);
                    if (filters.label) result = result === undefined ? filters.label.apply(issue) : result && filters.label.apply(issue);
                    if (filters.assignee) result = result === undefined ? filters.assignee.apply(issue) : result && filters.assignee.apply(issue);
                    
                    return result;
                }).data();
            } else {
                results = self.issues.find(query);
            }
            
            resolve(results);
        });
    };
}