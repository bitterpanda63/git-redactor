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

function sanitizeReplacementText(replacementText) {
    // Regex pattern: Keep only alphanumeric, hyphens, underscores, and dots
    const pattern = /[^a-zA-Z0-9_\-\.]/g;
    let sanitized = replacementText.replace(pattern, "");
    sanitized = sanitized.replace(/^[-_.]+|[-_.]+$/g, '');
    return sanitized;
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
    /// python re-usable code snippets
    console.log("Applying git filter-repo...");
    const py_getKeywords = `
    keywords = [kw.strip() for kw in "${escapeQuotes(keywords.join(","))}".split(",")]`.trim()
    const py_createKeywordRegex = `
    kw_regex = re.compile(re.escape(str.encode(keyword)), re.IGNORECASE)`.trim()
    
    const commit_callback_py = `
    ${py_getKeywords}
    for keyword in keywords:
        ${py_createKeywordRegex}
        commit.author_name = kw_regex.sub(b"${escapeQuotes(replacementText)}", commit.author_name)
        commit.author_email = kw_regex.sub(b"${escapeQuotes(replacementText)}", commit.author_email)
        commit.committer_name = kw_regex.sub(b"${escapeQuotes(replacementText)}", commit.committer_name)
        commit.committer_email = kw_regex.sub(b"${escapeQuotes(replacementText)}", commit.committer_email)
    return commit`

    const refname_callback_py = `
    ${py_getKeywords}
    for keyword in keywords:
        print(refname)
        ${py_createKeywordRegex}
        refname = kw_regex.sub(b"${sanitizeReplacementText(replacementText)}", refname)
    return refname`

    const filename_callback_py = `
    ${py_getKeywords}
    for keyword in keywords:
        ${py_createKeywordRegex}
        filename = kw_regex.sub(b"${sanitizeReplacementText(replacementText)}", filename)
    return filename`

    const filterRepoRes = shell.cmd(
        'git', 'filter-repo',
        '--sensitive-data-removal', '--force',
        '--replace-text', '../replacements.txt',
        '--replace-message', '../replacements.txt',
        '--commit-callback', commit_callback_py,
        '--refname-callback', refname_callback_py,
        '--filename-callback', filename_callback_py
    );
    console.log(filterRepoRes.stdout);
    console.error(filterRepoRes.stderr);

    // Add remote and force push
    shell.exec(`git remote add origin git@github.com:${githubRepoName}.git`);
    console.log("Force-pushing to remote...");
    shell.exec('git push --force --all --prune origin');
    shell.exec('git push --force --mirror origin')

    // Cleanup: Remove the temporary directory
    console.log(`Cleaning up temporary directory: ${tmpDir}`);
    shell.exec(`rm -rf ${tmpDir}`);

    console.log("Done!");
}
