"use strict";
var IssueType;
(function (IssueType) {
    IssueType[IssueType["Issue"] = 0] = "Issue";
    IssueType[IssueType["PullRequest"] = 1] = "PullRequest";
    IssueType[IssueType["All"] = 2] = "All";
})(IssueType = exports.IssueType || (exports.IssueType = {}));
var IssueState;
(function (IssueState) {
    IssueState[IssueState["Open"] = 0] = "Open";
    IssueState[IssueState["Closed"] = 1] = "Closed";
    IssueState[IssueState["All"] = 2] = "All";
})(IssueState = exports.IssueState || (exports.IssueState = {}));
var IssueActivity;
(function (IssueActivity) {
    IssueActivity[IssueActivity["Created"] = 0] = "Created";
    IssueActivity[IssueActivity["Updated"] = 1] = "Updated";
    IssueActivity[IssueActivity["Closed"] = 2] = "Closed";
})(IssueActivity = exports.IssueActivity || (exports.IssueActivity = {}));
var IssueActivityFilter = (function () {
    function IssueActivityFilter(activity, timestamp) {
        var _this = this;
        this.activity = activity;
        this.timestamp = timestamp;
        this.negated = false;
        this.apply = function (issue) {
            var ts = null;
            switch (_this.activity) {
                case IssueActivity.Created:
                    ts = new Date(issue.created_at);
                    break;
                case IssueActivity.Updated:
                    ts = new Date(issue.updated_at);
                    break;
                case IssueActivity.Closed:
                    ts = new Date(issue.closed_at);
                    break;
            }
            var result = ts >= _this.timestamp;
            return _this.negated ? !result : result;
        };
    }
    ;
    return IssueActivityFilter;
}());
exports.IssueActivityFilter = IssueActivityFilter;
var IssueAssigneeFilter = (function () {
    function IssueAssigneeFilter(assignee) {
        var _this = this;
        this.assignee = assignee;
        this.negated = false;
        this.apply = function (issue) {
            var result = false;
            if (_this.assignee === null) {
                result = !!issue.assignee;
            }
            else if (issue.assignee) {
                result = issue.assignee.login === _this.assignee;
            }
            return _this.negated ? !result : result;
        };
    }
    ;
    return IssueAssigneeFilter;
}());
exports.IssueAssigneeFilter = IssueAssigneeFilter;
var IssueLabelFilter = (function () {
    function IssueLabelFilter(label) {
        var _this = this;
        this.label = label;
        this.negated = false;
        this.apply = function (issue) {
            var result = false;
            for (var i = 0; i < issue.labels.length; i++) {
                if (issue.labels[i].name === _this.label) {
                    result = true;
                    break;
                }
            }
            return _this.negated ? !result : result;
        };
    }
    ;
    return IssueLabelFilter;
}());
exports.IssueLabelFilter = IssueLabelFilter;
var FilterCollection = (function () {
    function FilterCollection() {
    }
    return FilterCollection;
}());
exports.FilterCollection = FilterCollection;
//# sourceMappingURL=github_types.js.map