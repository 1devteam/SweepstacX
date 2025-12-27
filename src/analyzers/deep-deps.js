import { exec as _exec } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildDepTree, LockfileType } from 'snyk-nodejs-lockfile-parser';
import * as licenseChecker from 'license-checker-rseidelsohn';

const exec = promisify(_exec);

/**
 * Runs deep dependency analysis: license, security, and graph.
 * @param {string} root - The root directory to scan.
 * @returns {Promise<{issues: object[], stats: object, graph: object}>}
 */
export async function deepDependencyAnalysis(root) {
  const issues = [];
  const stats = {
    totalDependencies: 0,
    uniqueLicenses: 0,
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
  };
  let depGraph = null;

  // --- 1. Dependency Graph Generation ---
  try {
    const packageJsonPath = resolve(root, 'package.json');
    const lockfilePath = resolve(root, 'pnpm-lock.yaml'); // Assuming pnpm for SweepstacX

    const manifestFile = await readFile(packageJsonPath, 'utf-8');
    const lockFile = await readFile(lockfilePath, 'utf-8');

    // snyk-nodejs-lockfile-parser supports pnpm-lock.yaml
    depGraph = await buildDepTree(
      manifestFile,
      lockFile,
      false, // production mode (no dev dependencies)
      LockfileType.pnpm,
      true, // strictOutOfSync
      'package.json'
    );
    stats.totalDependencies = depGraph.dependencies.length;
  } catch (error) {
    issues.push({
      type: 'dependency_graph_error',
      severity: 'error',
      message: `Failed to build dependency graph: ${error.message}`,
    });
  }

  // --- 2. License Compliance ---
  try {
    const licenseData = await new Promise((resolve, reject) => {
      licenseChecker.init({
        start: root,
        json: true,
        production: true, // Only check production dependencies
      }, (err, json) => {
        if (err) {
          return reject(err);
        }
        resolve(json);
      });
    });

    const licenses = new Set();
    for (const [pkg, data] of Object.entries(licenseData)) {
      const license = data.licenses || 'UNKNOWN';
      licenses.add(license);

      // Simple check for restrictive licenses (e.g., GPL)
      if (license.includes('GPL')) {
        issues.push({
          type: 'license_compliance',
          severity: 'critical',
          message: `Restrictive license '${license}' found in production dependency: ${pkg}`,
          dependency: pkg,
          license: license,
        });
      }
    }
    stats.uniqueLicenses = licenses.size;
  } catch (error) {
    issues.push({
      type: 'license_check_error',
      severity: 'error',
      message: `Failed to check licenses: ${error.message}`,
    });
  }

  // --- 3. Security Vulnerability Analysis (via npm audit) ---
  try {
    const { stdout } = await exec('npm audit --json', { cwd: root });
    const auditReport = JSON.parse(stdout);

    // npm audit output structure is complex, but we can extract the summary
    const summary = auditReport.metadata.vulnerabilities;
    stats.vulnerabilities = {
      critical: summary.critical || 0,
      high: summary.high || 0,
      medium: summary.medium || 0,
      low: summary.low || 0,
    };

    // Extract issues for the report
    for (const [pkg, data] of Object.entries(auditReport.vulnerabilities)) {
      for (const vuln of data.via) {
        if (typeof vuln === 'object' && vuln.url) {
          issues.push({
            type: 'security_vulnerability',
            severity: vuln.severity,
            message: `${vuln.title} in ${pkg} (via ${data.via.length} paths)`,
            dependency: pkg,
            vulnerability: vuln.title,
            url: vuln.url,
          });
        }
      }
    }
  } catch (error) {
    // npm audit exits with a non-zero code if vulnerabilities are found,
    // but the output is still in stdout. We need to check if the error
    // is due to a non-zero exit code or a real execution error.
    if (error.stdout) {
      try {
        const auditReport = JSON.parse(error.stdout);
        const summary = auditReport.metadata.vulnerabilities;
        stats.vulnerabilities = {
          critical: summary.critical || 0,
          high: summary.high || 0,
          medium: summary.medium || 0,
          low: summary.low || 0,
        };
        // Still extract issues for the report
        for (const [pkg, data] of Object.entries(auditReport.vulnerabilities)) {
          for (const vuln of data.via) {
            if (typeof vuln === 'object' && vuln.url) {
              issues.push({
                type: 'security_vulnerability',
                severity: vuln.severity,
                message: `${vuln.title} in ${pkg} (via ${data.via.length} paths)`,
                dependency: pkg,
                vulnerability: vuln.title,
                url: vuln.url,
              });
            }
          }
        }
      } catch (parseError) {
        issues.push({
          type: 'security_audit_error',
          severity: 'error',
          message: `Failed to run or parse npm audit: ${parseError.message}`,
        });
      }
    } else {
      issues.push({
        type: 'security_audit_error',
        severity: 'error',
        message: `Failed to run npm audit: ${error.message}`,
      });
    }
  }

  return { issues, stats, graph: depGraph };
}
