# git-redactor

> **Warning**
> this repo isn't tested, and does force pushes & rewrites, use at your own risk.

## Running
Make sure git-filter-repo is installed
```shell
brew install git-filter-repo
```

Install dependencies
```shell
npm install
```

Run (interactive)
```shell
node index.js
# Answer CLI questions
```

Or you can run it using cli arguments
```shell
Usage: git-redactor [options]

CLI tool to redact keywords from a Git repository

Options:
  -V, --version                    output the version number
  -r, --repo <repo>                GitHub repository name (e.g., owner/repo)
  -k, --keywords <keywords>        Comma-separated keywords to redact
  -t, --replacement <replacement>  Replacement text
  -h, --help                       display help for command
```
