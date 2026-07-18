#!/usr/bin/env node
/**
 * Verify the latest GitHub release is published under uwu6967 (not cursor[bot]).
 * Run locally after: gh auth login  (as uwu6967)
 */
const { execFileSync } = require('child_process');
const pkg = require('../package.json');
const version = pkg.version;
const tag = `v${version}`;

function runGh(args) {
    return execFileSync('gh', args, { encoding: 'utf8' }).trim();
}

function main() {
    let author;
    let target;

    try {
        author = runGh(['release', 'view', tag, '--json', 'author', '--jq', '.author.login']);
        target = runGh(['release', 'view', tag, '--json', 'targetCommitish', '--jq', '.targetCommitish']);
    } catch (err) {
        console.error(`FAIL: could not read GitHub release ${tag}`);
        console.error(err.stderr || err.message || err);
        process.exit(1);
    }

    const tagRefSha = runGh([
        'api',
        `repos/uwu6967/tf2autobot-pricedb/git/refs/tags/${tag}`,
        '--jq',
        '.object.sha'
    ]);
    const tagObject = JSON.parse(
        runGh(['api', `repos/uwu6967/tf2autobot-pricedb/git/tags/${tagRefSha}`])
    );
    const resolvedCommit =
        tagObject.object?.type === 'commit' ? tagObject.object.sha : tagRefSha;

    if (author !== 'uwu6967') {
        console.error(`FAIL: release ${tag} is published by ${author}, expected uwu6967`);
        process.exit(author === 'cursor[bot]' ? 1 : 2);
    }

    if (target !== resolvedCommit) {
        console.error(`FAIL: release ${tag} target ${target} does not match tag commit ${resolvedCommit}`);
        process.exit(1);
    }

    const tagger = tagObject.tagger?.login;
    if (tagger && tagger !== 'uwu6967') {
        console.error(`FAIL: tag ${tag} was created by ${tagger}, expected uwu6967`);
        process.exit(1);
    }

    console.log(`OK: release ${tag} is published by uwu6967 at ${target}`);
}

main();
