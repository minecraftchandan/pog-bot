const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// 🔃 Load all feature modules from /features
const featuresPath = path.join(__dirname, 'features');
fs.readdirSync(featuresPath).forEach(file => {
  const feature = require(`./features/${file}`);
  if (typeof feature === 'function') feature(client);
});

// 🔃 Load all command modules from /commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  fs.readdirSync(commandsPath).forEach(file => {
    const command = require(`./commands/${file}`);
    if (typeof command === 'function') command(client);
  });
}

client.login(TOKEN);
