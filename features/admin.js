const { EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');

module.exports = (client) => {
  const botOwnerId = '587709425708695552'; // Your user ID

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('minfo')) return;

    if (message.author.id !== botOwnerId) {
      return message.reply('SOJA BRO 😁');
    }

    const guildId = message.guildId;
    if (!guildId) return message.reply('❌ Use this command inside a server.');

    const guild = message.guild;
    const guildData = await Guild.findOne({ guild_id: guildId });

    const embed = new EmbedBuilder()
      .setTitle('📊 Server Information')
      .setColor(0x5865F2)
      .addFields(
        { name: '🏰 Server Name', value: guild.name, inline: true },
        { name: '🆔 Server ID', value: guildId, inline: true },
        { name: '📺 Set Channel ID', value: guildData?.targetChannelId || 'Not set', inline: true },
        { name: '🔗 Channel Link', value: guildData?.targetChannelId ? `<#${guildData.targetChannelId}>` : 'Not set', inline: true }
      )
      .setThumbnail(guild.iconURL())
      .setFooter({ text: `Requested by ${message.author.tag}` });

    await message.reply({ embeds: [embed] });
  });
};