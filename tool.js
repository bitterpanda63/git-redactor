import shell from 'shelljs';
import fs from 'fs';
import path from 'path';

function generateRegexPatterns(keywords, replacementText) {
    return keywords.map(kw => {
        const regex = kw.split('').map(c => `[${c.toUpperCase()}${c.toLowerCase()}]`).join('');
        return `regex:${regex}==>${replacementText}`;
    }).join('\n');
}
function escapeQuotes(str) {
    return str.replace(/"/g, '\\"');
}

// Main function
export function runTool(githubRepoName, keywords, replacementText) {
    // Create a temporary directory
    const timestamp = Date.now();
    const tmpDir = path.join('/tmp', `git-redact-${timestamp}`);
    shell.mkdir('-p', tmpDir);
    shell.cd(tmpDir);
    console.log(`Working in temporary directory: ${tmpDir}`);

    // Clone the repository
    console.log(`Cloning repository: ${githubRepoName}`);
    shell.exec(`git clone git@github.com:${githubRepoName}.git`);
    shell.cd(githubRepoName.split('/').pop());

    // make sure everything is there
    shell.exec("git fetch --all");
    shell.exec("git pull --all");

    // Generate replacements.txt
    const replacementsContent = generateRegexPatterns(keywords, replacementText);
    fs.writeFileSync('../replacements.txt', replacementsContent);
    console.log("Generated replacements.txt:");
    console.log(replacementsContent);

    // Apply git filter-repo
    console.log("Applying git filter-repo...");
    const commit_callback_py = `
    keywords = [kw.strip() for kw in "${escapeQuotes(keywords.join(","))}".split(",")]
    for keyword in keywords:
        kw_regex = re.compile(re.escape(str.encode(keyword)), re.IGNORECASE)
        commit.author_name = kw_regex.sub(b"${escapeQuotes(replacementText)}", commit.author_name)
        commit.author_email = kw_regex.sub(b"${escapeQuotes(replacementText)}", commit.author_email)
        commit.committer_name = kw_regex.sub(b"${escapeQuotes(replacementText)}", commit.committer_name)
        commit.committer_email = kw_regex.sub(b"${escapeQuotes(replacementText)}", commit.committer_email)
        commit.message = kw_regex.sub(b"${escapeQuotes(replacementText)}", commit.message)
    return commit`
    const filterRepoRes = shell.cmd(
        'git', 'filter-repo',
        '--sensitive-data-removal', '--force',
        '--replace-text', '../replacements.txt',
        '--commit-callback', commit_callback_py
    );
    console.log(filterRepoRes.stdout);
    console.error(filterRepoRes.stderr);

    // Add remote and force push
    shell.exec(`git remote add origin git@github.com:${githubRepoName}.git`);
    console.log("Force-pushing to remote...");
    shell.exec('git push -f --all origin');

    // Cleanup: Remove the temporary directory
    console.log(`Cleaning up temporary directory: ${tmpDir}`);
    shell.exec(`rm -rf ${tmpDir}`);

    console.log("Done!");
}
