import shell from 'shelljs';
import fs from 'fs';
import path from 'path';

// Generate regex patterns for replacements.txt
function generateRegexPatterns(keywords, replacementText) {
    return keywords.map(kw => {
        const regex = kw.split('').map(c => `[${c.toUpperCase()}${c.toLowerCase()}]`).join('');
        return `regex:${regex}==>${replacementText}`;
    }).join('\n');
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
    shell.exec('git filter-repo --sensitive-data-removal --force --replace-text ../replacements.txt');

    // Add remote and force push
    shell.exec(`git remote add origin git@github.com:${githubRepoName}.git`);
    console.log("Force-pushing to remote...");
    shell.exec('git push -f --all origin');

    // Cleanup: Remove the temporary directory
    console.log(`Cleaning up temporary directory: ${tmpDir}`);
    shell.exec(`rm -rf ${tmpDir}`);

    console.log("Done!");
}
