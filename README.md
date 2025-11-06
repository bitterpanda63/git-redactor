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

## Running on multiple repos
If you want to run this on all your GitHub repositories, you first need to get a list of all your repos : 
```shell
gh repo list -L 1000 --no-archived --jq "[.[] | .name]" --json name | cat
```

And then modify the run-tool.js script, afterwards simply type
```shell
node run-tool.js
```