const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guild_id: String,
  targetChannelId: String
}, { collection: 'servers' });

module.exports = mongoose.model('Guild', guildSchema);