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
  .option("--staged", "Scan only staged files")
  .option("--fail-on-detection", "Exit 1 for HIGH or CRITICAL findings")
  .option("--hook-mode", "Output for git pre-commit hook")
  .action(async (path, options) => {
    const code = await runScan({
      path,
      staged: Boolean(options.staged),
      failOnDetection: Boolean(options.failOnDetection),
      hookMode: Boolean(options.hookMode)
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
  .action(async (options) => {
    const code = await runPull({
      env: options.env,
      output: options.output
    });
    process.exitCode = code;
  });

program
  .command("push")
  .description("Push secrets from .env.local to vault")
  .option("--env <environment>", "Environment: development, staging, production", "development")
  .option("--force", "Overwrite existing secrets")
  .action(async (options) => {
    const code = await runPush({
      env: options.env,
      force: Boolean(options.force)
    });
    process.exitCode = code;
  });

program
  .command("uninstall")
  .description("Removes the EnvArmor pre-commit hook")
  .action(() => {
    runUninstall();
  });

program.parse(process.argv);
