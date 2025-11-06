import {runTool} from "./tool.js";
import readline from 'readline';
import {Command} from 'commander';
import {readFileSync} from 'fs';

// Read package.json to get the version
const packageJson = JSON.parse(readFileSync("./package.json", {encoding: 'utf-8'}));
const version = packageJson.version;

const program = new Command();
program
    .name('git-redactor')
    .description('CLI tool to redact keywords from a Git repository')
    .version('1.0.0')
    .option('-r, --repo <repo>', 'GitHub repository name (e.g., owner/repo)')
    .option('-k, --keywords <keywords>', 'Comma-separated keywords to redact')
    .option('-t, --replacement <replacement>', 'Replacement text')
    .parse(process.argv);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// Main interactive function
async function mainInteractive() {
    console.log(`git-redactor v${version}`);
    console.log("--------------------------------");

    const githubRepoName = await askQuestion("Enter the GitHub repository name (e.g., owner/repo): ");
    const keywordsInput = await askQuestion("Enter the keywords to redact (comma-separated): ");
    const keywords = keywordsInput.split(',').map(kw => kw.trim()).filter(kw => kw);
    const replacementText = await askQuestion("Enter the replacement text: ");

    console.log("\nYou entered:");
    console.log(`- Repository: ${githubRepoName}`);
    console.log(`- Keywords: ${keywords.join(', ')}`);
    console.log(`- Replacement: ${replacementText}`);

    const confirm = await askQuestion("\nIs this correct? (y/n): ");
    if (confirm.toLowerCase() === 'y') {
        console.log("\nRunning the tool...");
        runTool(githubRepoName, keywords, replacementText);
    } else {
        console.log("Operation cancelled.");
    }

    rl.close();
}

// Main CLI function
function mainCLI() {
    const options = program.opts();
    if (!options.repo || !options.keywords || !options.replacement) {
        console.error("Error: Missing required arguments. Use --help for usage.");
        process.exit(1);
    }
    const keywords = options.keywords.split(',').map(kw => kw.trim()).filter(kw => kw);
    runTool(options.repo, keywords, options.replacement);
}

// Run the appropriate mode
if (program.args.length > 0 || Object.keys(program.opts()).length > 0) {
    mainCLI();
} else {
    await mainInteractive();
}
