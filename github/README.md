Quick and dirty implementation of two small command-line utilities that query Github for Issues and PRs information.

- `ghprompt` is an interactive command line interface that can be used to query github for issues and pull-requests information in an almost natural language
- `ghquery` just demonstrate how to use the Github API module to query for various statistics in case you want to write your own script

## Install
> npm install -g gh-issues-cli

This will install utilties ghprompt and ghquery.

## Usage

Both `ghprompt` and `ghquery` take the same parameters:
- `--user <github username>` (optional) Username to send when authenticating with github to raise API call rate limits.
- `--password <github security token>` (optional) Security token (or password) to send when authenticating with github to raise API call rate limits.
- `<owner>` (mandatory) name of the repository owner. 
- `<repository>` (mandatory) repository for which you want to get numbers.

**Why authenticate?**
Github limits the number of unauthenticated calls that can be made to its API to 60 per hour. That limit might be maxed out quickly if you're using these utilities intensively. 
In that case, authenticating raise the limit to 5000 calls per hour (which should be more than enough).

### ghprompt
The basic idea is to allow a user to query for issues and pull requests statistics. queries can be written in almost natural language, although it doesn't pretend like it's a chat bot.
It's actually not even intelligent. it just recognizes keywords. A few commands:
- **usage** will show usage examples
- **help <keyword>** will show help about a specific command or keyword
- **load** will load issues and pull requests from the repository and into a database for later querying. If you don't load, you can't query. Mandatory first step.
- **list** will list stuff
- **count** will count stuff
- **link <number>** will show the link to take you to the github page of the issue/pull-request

And now a few examples of queries:

`> count open issues assigned to pierreca`

`> list closed issues created in the last 7 days`

`> list issues not assigned`

`> count closed issues labeled bug in the past 4 weeks`

`> list open issues not updated in the last 24 hours`

### ghquery
Run `ghquery` with the aforementionned parameters and it will spit out stats about open and closed issues and pull requests in the past 24 hours, 7 days, and overall. Not much here. it's intended more as a sample code.

## Features
Current search criteria supported:
- type (issue or pull request)
- current state (open, closed)
- time and type of last update (created, updated, closed)
- assignee
- labels

## Developer notes
This repository is structure to be really easy to use with Visual Studio Code, since it provides a great Typescript developer experience.

> **Why did you use typescript?**

> Because I wanted to learn. Obviously, I'm not there yet.

> **OMG the code sucks!**

> Yeah. makes me sad too. Any kind of feedback will be taken seriously, pull-requests will be studied with care.

## TODOs
### Housekeeping
- [ ] Issue type (issue or PR) and state (open/closed) are currently treated differently from other filtering mechanisms. unify this.
- [ ] Write tests
- [ ] Better docs
- [ ] Better decoupling of the command parser
- [x] Better Github API file structure
- [ ] Find a way to not grow the call stack when looping between commands
- [ ] Turn all commands into promises?
- [ ] Custom issue interface from github json object (for type-safety and stuff)

### Features
- [ ] Save and load configuration from a file
- [ ] Save and load database to a file
- [ ] Differential queries to update the database
- [ ] Show and handle Github API calls rate limits
- [ ] Save query results to a file
- [ ] Add an option to specify a query directly from the command line
- [ ] Index the database
- [ ] Figure out a way to make multiple-word labels work (probably by dynamically creating a collection of labels from the Github JSON)
- [ ] Detailed view of an issue (with timestamps etc)