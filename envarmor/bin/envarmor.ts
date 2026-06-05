#!/usr/bin/env node

import { Command } from "commander";
import {
  runAuditAi,
  runInit,
  runLogin,
  runProtect,
  runPull,
  runPush,
  runScan,
  runSanitize,
  runUninstall
} from "../src/index.js";

const program = new Command();

program
  .name("envarmor")
  .description("EnvArmor CLI - offline-first secret scanner")
  .version("0.1.0");

program
  .command("scan")
  .description("Scans files for potential secrets")
  .argument("[path]", "Path to scan", ".")
  .option("--all", "Scan all files (default)")
  .option("--staged", "Scan only staged files")
  .option("--fail-on-detection", "Exit 1 for HIGH or CRITICAL findings")
  .option("--fail-on-high", "Exit 1 for HIGH or CRITICAL findings (CI mode)")
  .option("--history", "Scan git history for leaked secrets")
  .option("--since <date>", "Scan history since a specific date (e.g. '2024-01-01')")
  .option("--branch <name>", "Scan history of a specific branch")
  .option("--ci", "Force CI output mode")
  .option("--json", "Output results as JSON")
  .option("--hook-mode", "Output for git pre-commit hook")
  .option("-p, --project <slug>", "Specify project slug manually")
  .action(async (path, options) => {
    const code = await runScan({
      path,
      all: Boolean(options.all),
      staged: Boolean(options.staged),
      failOnDetection: Boolean(options.failOnDetection),
      failOnHigh: Boolean(options.failOnHigh),
      history: Boolean(options.history),
      since: options.since,
      branch: options.branch,
      ci: Boolean(options.ci),
      json: Boolean(options.json),
      hookMode: Boolean(options.hookMode),
      project: options.project
    });
    process.exitCode = code;
  });

program
  .command("init")
  .description("Installs a pre-commit hook and local .envarmor config")
  .action(() => {
    runInit();
  });

program
  .command("login")
  .description("Stores API key in ~/.envarmor/config.json after verification")
  .requiredOption("--key <apiKey>", "EnvArmor API key")
  .action(async (options: { key: string }) => {
    const code = await runLogin(options.key);
    process.exitCode = code;
  });

program
  .command("protect")
  .description("Adds safe ignore rules for AI tools and git")
  .action(() => {
    runProtect();
  });

program
  .command("audit-ai")
  .description("Audits AI tool config exposure to secrets")
  .action(() => {
    runAuditAi();
  });

program
  .command("pull")
  .description("Pull secrets from vault to local .env file")
  .option("--env <environment>", "Environment: development, staging, production", "development")
  .option("--output <type>", "Output type: shell (stdout) or file", "file")
  .option("-p, --project <slug>", "Specify project slug manually")
  .action(async (options) => {
    const code = await runPull({
      env: options.env,
      output: options.output,
      project: options.project
    });
    process.exitCode = code;
  });

program
  .command("push")
  .description("Push secrets from .env.local to vault")
  .option("--env <environment>", "Environment: development, staging, production", "development")
  .option("--force", "Overwrite existing secrets")
  .option("-p, --project <slug>", "Specify project slug manually")
  .action(async (options) => {
    const code = await runPush({
      env: options.env,
      force: Boolean(options.force),
      project: options.project
    });
    process.exitCode = code;
  });

program
  .command("sanitize <text>")
  .description("Redacts potential secrets from a string of text")
  .action((text) => {
    runSanitize(text);
  });

program
  .command("uninstall")
  .description("Removes the EnvArmor pre-commit hook")
  .action(() => {
    runUninstall();
  });

// Preprocess argument typos like -all -> --all
const args = process.argv.map(arg => arg === '-all' ? '--all' : arg);
program.parse(args);
