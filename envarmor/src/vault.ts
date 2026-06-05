import fs from 'fs';
import path from 'path';
import { locateGitRepository } from './git.js';

/**
 * Parse .env file into key-value pairs
 */
export function parseEnvFile(content: string): Record<string, string> {
  const parsed: Record<string, string> = {};

  content.split('\n').forEach((line) => {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) return;

    // Parse KEY=VALUE
    const [key, ...rest] = trimmed.split('=');
    if (key && rest) {
      const value = rest.join('=').replace(/^['"]|['"]$/g, '');
      parsed[key] = value;
    }
  });

  return parsed;
}

/**
 * Format key-value pairs into .env content
 */
export function formatEnvFile(secrets: Record<string, string>): string {
  return Object.entries(secrets)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

/**
 * Read local .env file
 */
export function readLocalEnv(filePath: string = '.env.local'): Record<string, string> {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return parseEnvFile(content);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }

  return {};
}

/**
 * Write .env file
 */
export function writeEnvFile(
  content: string,
  filePath: string = '.env.local'
): boolean {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

/**
 * Detect the current project slug from git remote URL
 */
export function detectProjectSlug(): string | null {
  try {
    const repo = locateGitRepository();
    if (repo) {
      // 1. Check local .envarmor config first
      const configPath = path.join(repo.worktreeRoot, '.envarmor');
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (config && typeof config.project === 'string' && config.project.trim()) {
            return config.project.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
          }
        } catch {
          // ignore parsing error
        }
      }

      // 2. Fallback to git config remote URL
      const gitConfig = path.join(repo.gitDir, 'config');
      if (fs.existsSync(gitConfig)) {
        const content = fs.readFileSync(gitConfig, 'utf-8');
        const match = content.match(/url = .*?\/([^/]+)\.git/);
        if (match && match[1]) {
          return match[1].toLowerCase().replace(/[^a-z0-9-]/g, '-');
        }
      }
    }
  } catch (error) {
    console.error('Error detecting project slug:', error);
  }

  return null;
}
