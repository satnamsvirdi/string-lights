import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Pinned to release-please so local previews and GitHub releases share one parser/strategy.
const { parseConventionalCommits } = require('release-please/build/src/commit.js');
const {
  DefaultVersioningStrategy,
} = require('release-please/build/src/versioning-strategies/default.js');
const { Version } = require('release-please/build/src/version.js');
const quiet = { debug() {}, info() {}, warn() {}, error() {} };

export function planVersion(version, messages, { initialRelease = false } = {}) {
  const commits = parseConventionalCommits(
    messages.map((message, i) => ({ sha: String(i), message, files: [] })),
    quiet,
  );
  const releasable = commits.filter(
    (commit) => commit.breaking || ['feat', 'fix', 'perf'].includes(commit.type),
  );
  if (!releasable.length) return { current: version, next: version, release: false, commits: [] };
  const strategy = new DefaultVersioningStrategy({
    bumpMinorPreMajor: false,
    bumpPatchForMinorPreMajor: false,
    logger: quiet,
  });
  return {
    current: version,
    next: initialRelease ? version : strategy.bump(Version.parse(version), releasable).toString(),
    release: true,
    commits: releasable.map((commit) => commit.message),
  };
}
