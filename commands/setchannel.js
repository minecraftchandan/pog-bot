const { SlashCommandBuilder } = require('discord.js');
const Guild = require('../models/Guild');

module.exports = (client) => {
  const BOT_OWNER_ID = '587709425708695552'; // replace with your Discord ID or load from env

  client.once('ready', async () => {
    if (!client.application?.commands) return;
    await client.application.commands.create(
      new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription('Set the target channel by ID (leave empty to remove)')
        .addStringOption(option =>
          option
            .setName('channelid')
            .setDescription('The channel ID to send alerts to')
            .setRequired(false)
        )
        .toJSON()
    );
    console.log('✅ /setchannel slash command registered.');
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'setchannel') return;

    const guildId = interaction.guildId;
    if (!guildId) {
      return await interaction.reply('❌ Use this command inside a server.');
    }

    // permission check: only bot owner or administrators
    const isOwner = interaction.user.id === BOT_OWNER_ID;
    const member = interaction.member;
    const isAdmin = member?.permissions?.has('Administrator');
    if (!isOwner && !isAdmin) {
      return await interaction.reply({ content: '🚫 You don’t have permission to use this command. Only server administrators or the bot owner may run it.', ephemeral: true });
    }

    const channelId = interaction.options.getString('channelid');
    if (!channelId) {
      await Guild.findOneAndUpdate(
        { guild_id: guildId },
        { targetChannelId: null },
        { upsert: true }
      );
      return await interaction.reply('✅ Target channel removed.');
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel)
      return await interaction.reply('❌ Invalid channel ID.');

    await Guild.findOneAndUpdate(
      { guild_id: guildId },
      { targetChannelId: channelId },
      { upsert: true }
    );

    await interaction.reply(`✅ Target channel set to <#${channelId}>`);
  });
};
