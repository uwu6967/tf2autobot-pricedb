#!/usr/bin/env node
/**
 * Verify bot version is consistent across tracked files.
 * Run: node scripts/verify-version.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pkg = require(path.join(ROOT, 'package.json'));
const version = pkg.version;

function assert(condition, message) {
    if (!condition) {
        console.error('FAIL:', message);
        process.exit(1);
    }
}

function read(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

assert(/^\d+\.\d+\.\d+$/.test(version), `package.json version must be semver: ${version}`);

const lockLines = read('package-lock.json').split('\n');
assert(lockLines[2].includes(`"version": "${version}"`), 'package-lock.json top-level version');
assert(lockLines[8].includes(`"version": "${version}"`), 'package-lock.json package entry version');

const checks = [
    {
        file: 'package.json',
        test: (content) => content.includes(`"version": "${version}"`),
        label: 'package.json version field'
    },
    {
        file: 'README.md',
        test: (content) => content.includes(`**Current version:** ${version}`),
        label: 'README current version'
    },
    {
        file: 'README.md',
        test: (content) => content.includes(`/releases/tag/v${version}`),
        label: 'README latest release link'
    },
    {
        file: 'README.md',
        test: (content) => content.includes(`bot **v${version}**`),
        label: 'README panel compatibility version'
    },
    {
        file: `scripts/release-notes/v${version}.md`,
        test: (content) => content.includes(`v${version}`) || content.includes(version),
        label: 'release notes file exists and references version'
    },
    {
        file: 'scripts/restore-github-releases.sh',
        test: (content) => content.includes(`[v${version}]=`) && content.includes(`v${version} -`),
        label: 'restore-github-releases.sh entry for current version'
    }
];

for (const check of checks) {
    const fullPath = path.join(ROOT, check.file);
    assert(fs.existsSync(fullPath), `missing file: ${check.file}`);
    assert(check.test(read(check.file)), check.label);
}

console.log(`OK: version ${version} is consistent across tracked files`);
