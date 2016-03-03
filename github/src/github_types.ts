
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