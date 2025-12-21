import simpleGit from 'simple-git';
import { resolve } from 'node:path';

/**
 * Get list of changed files since last commit or specific ref
 */
export async function getChangedFiles(basePath = '.', options = {}) {
  const git = simpleGit(basePath);
  
  try {
    // Check if we're in a git repository
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return null; // Not a git repo, return null to scan all files
    }
    
    const { since = 'HEAD', includeUntracked = true } = options;
    
    // Get modified and added files
    const status = await git.status();
    const changedFiles = [
      ...status.modified,
      ...status.created,
      ...status.renamed.map(r => r.to),
    ];
    
    // If includeUntracked, add untracked files
    if (includeUntracked) {
      changedFiles.push(...status.not_added);
    }
    
    // If since is not HEAD, get diff from that ref
    if (since !== 'HEAD') {
      try {
        const diff = await git.diff(['--name-only', since]);
        const diffFiles = diff.split('\n').filter(Boolean);
        changedFiles.push(...diffFiles);
      } catch (err) {
        // If ref doesn't exist, ignore
      }
    }
    
    // Remove duplicates and convert to absolute paths
    const uniqueFiles = [...new Set(changedFiles)];
    return uniqueFiles.map(file => resolve(basePath, file));
    
  } catch (error) {
    // If git operations fail, return null to scan all files
    return null;
  }
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(basePath = '.') {
  const git = simpleGit(basePath);
  
  try {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) return null;
    
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    return branch.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Get last commit hash
 */
export async function getLastCommit(basePath = '.') {
  const git = simpleGit(basePath);
  
  try {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) return null;
    
    const log = await git.log({ maxCount: 1 });
    return log.latest;
  } catch (error) {
    return null;
  }
}

/**
 * Check if working directory is clean
 */
export async function isWorkingDirClean(basePath = '.') {
  const git = simpleGit(basePath);
  
  try {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) return true;
    
    const status = await git.status();
    return status.isClean();
  } catch (error) {
    return true;
  }
}

/**
 * Get git repository info
 */
export async function getRepoInfo(basePath = '.') {
  const git = simpleGit(basePath);
  
  try {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return {
        isGitRepo: false,
        branch: null,
        lastCommit: null,
        isClean: true,
        changedFiles: 0,
      };
    }
    
    const [branch, lastCommit, status] = await Promise.all([
      getCurrentBranch(basePath),
      getLastCommit(basePath),
      git.status(),
    ]);
    
    return {
      isGitRepo: true,
      branch,
      lastCommit: lastCommit ? {
        hash: lastCommit.hash.substring(0, 7),
        message: lastCommit.message,
        author: lastCommit.author_name,
        date: lastCommit.date,
      } : null,
      isClean: status.isClean(),
      changedFiles: status.modified.length + status.created.length + status.not_added.length,
    };
  } catch (error) {
    return {
      isGitRepo: false,
      branch: null,
      lastCommit: null,
      isClean: true,
      changedFiles: 0,
    };
  }
}
