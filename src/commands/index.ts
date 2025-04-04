import fs from "node:fs";
import path from "node:path";
import type { Message } from "discord.js";

type Command = {
  name: string;
  description?: string;
  execute: (message: Message, args: string[]) => Promise<void>;
};

const commands: Command[] = [];

// Load all command files dynamically
const commandFolders = fs.readdirSync(path.join(__dirname));
for (const folder of commandFolders) {
  if (folder === 'index.ts') continue;
  
  const commandFiles = fs.readdirSync(path.join(__dirname, folder))
    .filter(file => file.endsWith('.ts'));

  for (const file of commandFiles) {
    const command = require(path.join(__dirname, folder, file));
    commands.push({
      name: `${folder}:${file.replace('.ts', '')}`,
      description: command.description || "No description available",
      execute: command.execute
    });
  }
}

export { commands };

export function handleCommand(message: Message) {
  const prefix = "!";
  if (!message.content.startsWith(prefix)) return false;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return false;

  // Handle help command specifically
  if (commandName === 'help') {
    const helpCommand = commands.find(cmd => cmd.name === 'help:commands');
    if (helpCommand) {
      helpCommand.execute(message, args);
    }
    return true;
  }

  // Find command
  const command = commands.find(cmd => 
    cmd.name === commandName.replace(':', ':') || 
    cmd.name.endsWith(`:${commandName}`)
  );

  if (!command) return false;

  try {
    command.execute(message, args);
    return true;
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    return false;
  }
}
