const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require('discord.js');
const mongoose = require('mongoose');
const Guild = require('../models/Guild');

// Connect to MongoDB with error handling
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Mongo connection error:', err));

// Utility to format large numbers as '1k', '1.1k', etc. up to '100k'
function formatNumber(num) {
  if (num < 1000) return num.toString();
  if (num < 100000) {
    // Show one decimal for e.g. 1.1k, remove .0 for whole k's
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'k';
  }
  // For 100k exactly, show '100k'
  if (num === 100000) return '100k';
  // If ever above (shouldn't happen), fallback to number as string
  return num.toString();
}

module.exports = (client) => {
  const targetBotId = '853629533855809596';
  client.on('messageCreate', async (message) => {
    if (message.author.id !== targetBotId) return;
    if (!message.components?.length) return;

    const mentionedUser = message.mentions.users.first();
    const username = mentionedUser ? mentionedUser.username : 'Unknown';

    // Extract heart values same as button.js
    const heartValues = [];
    for (const row of message.components) {
      for (const component of row.components) {
        const label = component.label || '';
        const numbers = label.match(/\d+/g);
        if (numbers) {
          heartValues.push(parseInt(numbers[0]));
        }
      }
    }

    // Only proceed with POG logic if message has attachments
    if (!message.attachments.size) return;

    const guildId = message.guildId;
    if (!guildId) return;

    const guildData = await Guild.findOne({ guild_id: guildId });
    if (!guildData?.targetChannelId) return;

    // Check if any value > 99 (testing) - only trigger once per message
    const maxValue = Math.max(...heartValues);
    if (maxValue > 99) {
      console.log('🔥 POG TRIGGERED! Max value:', maxValue, 'from values:', heartValues);
      await handlePog(message, guildData.targetChannelId);
    }
  });

  async function handlePog(message, targetChannelId) {
    const mentionedUser = message.mentions.users.first();

    // Extract heart values for display
    const heartValues = [];
    for (const row of message.components) {
      for (const component of row.components) {
        const label = component.label || '';
        const numbers = label.match(/\d+/g);
        if (numbers) {
          heartValues.push(parseInt(numbers[0]));
        }
      }
    }

    // Format hearts display using the short format
    const heartsDisplay = heartValues.map(value => `❤️ \`${formatNumber(value)}\``).join(' ｜');

    if (message.channel.isTextBased()) {
      await message.channel.send(`${mentionedUser ? `<@${mentionedUser.id}>` : ''}🎉 Check it out in <#${targetChannelId}>`);
    }

    const imageUrl = message.attachments.first()?.url;

    const embed = new EmbedBuilder()
      .setTitle('<a:AnimeGirljumping:1365978464435441675> 𝑷𝑶𝑮𝑮𝑬𝑹𝑺 <a:brown_jump:1365979505977458708>')
      .setDescription(`${mentionedUser ? `<@${mentionedUser.id}>` : 'Someone'} triggered a POG!\n\n**${heartsDisplay}**`)
      .setColor(0x87CEEB)
      .setImage(imageUrl)
      .setFooter({ text: `Dropped by: ${mentionedUser?.tag || 'Unknown#0000'}` });

    const button = new ButtonBuilder()
      .setLabel('Jump to Message')
      .setStyle(ButtonStyle.Link)
      .setURL(message.url);

    const row = new ActionRowBuilder().addComponents(button);

    const targetChannel = await client.channels.fetch(targetChannelId);
    if (targetChannel?.isTextBased()) {
      await targetChannel.send({ embeds: [embed], components: [row] });
    }
  }
};
