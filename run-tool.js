import {runTool} from "./tool.js";

// e.g. ["secret-keyword1", "secret-keyword2"]
const KEYWORDS = []

// e.g. "<REDACTED>"
const REPLACEMENT_TEXT = ""

// e.g. myuser
const REPOSITORY_PREFIX = ""

// e.g. ["fruit-store", "chess-game"]
const REPOSITORIES = []

for (const repo of REPOSITORIES) {
    runTool(`${REPOSITORY_PREFIX}/${repo}`, KEYWORDS, REPLACEMENT_TEXT);
}