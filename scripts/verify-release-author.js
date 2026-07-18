#!/usr/bin/env node
/**
 * Verify fork GitHub releases are published under uwu6967 (not cursor[bot])
 * and that the latest release matches package.json.
 *
 * Run locally after: gh auth login  (as uwu6967)
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const version = pkg.version;
const tag = `v${version}`;
const repo = 'uwu6967/tf2autobot-pricedb';
const expectedAuthor = 'uwu6967';

function runGh(args) {
    return execFileSync('gh', args, { encoding: 'utf8' }).trim();
}

function resolveTagCommit(tagName) {
    const tagRefSha = runGh([
        'api',
        `repos/${repo}/git/refs/tags/${tagName}`,
        '--jq',
        '.object.sha'
    ]);
    const tagObject = JSON.parse(runGh(['api', `repos/${repo}/git/tags/${tagRefSha}`]));
    return tagObject.object?.type === 'commit' ? tagObject.object.sha : tagRefSha;
}

function forkTagsUpTo(versionStr) {
    const patch = Number(versionStr.split('.')[2]);
    const tags = [];
    for (let i = 0; i <= patch; i++) {
        tags.push(`v1.0.${i}`);
    }
    return tags;
}

function readRestoreTargets() {
    const script = fs.readFileSync(path.join(__dirname, 'restore-github-releases.sh'), 'utf8');
    const targets = {};
    const re = /\[v1\.0\.(\d+)\]=([0-9a-f]{40})/g;
    let match;
    while ((match = re.exec(script)) !== null) {
        targets[`v1.0.${match[1]}`] = match[2];
    }
    return targets;
}

function main() {
    const forkTags = forkTagsUpTo(version);
    const restoreTargets = readRestoreTargets();

    let latestTag;
    try {
        latestTag = runGh(['release', 'list', '-R', repo, '--limit', '1', '--json', 'tagName', '--jq', '.[0].tagName']);
    } catch (err) {
        console.error('FAIL: could not read latest GitHub release');
        console.error(err.stderr || err.message || err);
        process.exit(1);
    }

    if (latestTag !== tag) {
        console.error(`FAIL: latest GitHub release is ${latestTag}, expected ${tag}`);
        process.exit(1);
    }

    let latestApiTag;
    try {
        latestApiTag = runGh(['api', `repos/${repo}/releases/latest`, '--jq', '.tag_name']);
    } catch (err) {
        console.error(`FAIL: could not read latest GitHub release via API`);
        console.error(err.stderr || err.message || err);
        process.exit(1);
    }

    if (latestApiTag !== tag) {
        console.error(`FAIL: GitHub latest release is ${latestApiTag}, expected ${tag}`);
        console.error('Run: ./scripts/restore-github-releases.sh  (logged in as uwu6967)');
        process.exit(1);
    }

    for (const forkTag of forkTags) {
        let author;
        let target;

        try {
            author = runGh(['release', 'view', forkTag, '-R', repo, '--json', 'author', '--jq', '.author.login']);
            target = runGh([
                'release',
                'view',
                forkTag,
                '-R',
                repo,
                '--json',
                'targetCommitish',
                '--jq',
                '.targetCommitish'
            ]);
        } catch (err) {
            console.error(`FAIL: missing GitHub release ${forkTag}`);
            console.error(err.stderr || err.message || err);
            process.exit(1);
        }

        if (author !== expectedAuthor) {
            console.error(`FAIL: release ${forkTag} is published by ${author}, expected ${expectedAuthor}`);
            console.error('Run: ./scripts/restore-github-releases.sh  (logged in as uwu6967)');
            process.exit(author === 'cursor[bot]' ? 1 : 2);
        }

        const expectedTarget = restoreTargets[forkTag];
        if (expectedTarget) {
            if (!/^[0-9a-f]{40}$/i.test(target)) {
                console.error(
                    `FAIL: release ${forkTag} target is "${target}" (branch/ref), expected commit ${expectedTarget}`
                );
                console.error('Run: ./scripts/restore-github-releases.sh  (logged in as uwu6967)');
                process.exit(1);
            }
            if (target !== expectedTarget) {
                console.error(
                    `FAIL: release ${forkTag} target ${target} does not match restore script ${expectedTarget}`
                );
                process.exit(1);
            }
        }

        if (/^[0-9a-f]{40}$/i.test(target)) {
            const resolvedCommit = resolveTagCommit(forkTag);
            if (target !== resolvedCommit) {
                console.error(
                    `FAIL: release ${forkTag} target ${target} does not match tag commit ${resolvedCommit}`
                );
                process.exit(1);
            }
        }
    }

    console.log(
        `OK: releases ${forkTags[0]}..${tag} are published by ${expectedAuthor}; latest is ${tag}`
    );
}

main();
