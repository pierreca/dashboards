Quick and dirty implementation of a small command-line utility that queries Github for Issues and PRs information.

## Usage
After cloning and compiling: 

`node lib/index.js <owner> <repository> [username] [token]`

## Features
Current search criteria supported:
- type (issue or pull request)
- state (open, close)
- time and type of last update (created, updated, closed)

## Notes and limitations
This utility starts by recursively downloading all issues descriptions. At most only 100 issues can be downloaded in an API call, 
which means that projects with a lot of issues and PRs will rapidly max-out the API calls rate limits (unauthenticated is 60 calls per hour).

If you want to get 5000 calls per hour, you have to authenticate with the API. Currently this utility supports basic authentication only
which means username and security token or password.