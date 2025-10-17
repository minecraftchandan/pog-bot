const Series = require('../models/Series');
async function findSeriesMatch(displayName) {
  // Remove trailing dots and normalize
  const cleanDisplay = displayName.replace(/\.+$/, '').trim();
  // Find exact match first
  let match = await Series.findOne({ series: displayName });
  if (match) return match;
  // Find partial match (for truncated names with ...)
  const regex = new RegExp(`^${cleanDisplay.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
  match = await Series.findOne({ series: regex });
  if (match) return match;
  
  // Try reverse match
  const allSeries = await Series.find({});
  match = allSeries.find(s => {
    const seriesName = s.series.replace(/\.+$/, '').trim();
    return seriesName.startsWith(cleanDisplay) || cleanDisplay.startsWith(seriesName);
  });
  
  return match;
}

module.exports = (client) => {
  const targetBotId = '853629533855809596';

  client.on('messageCreate', async (message) => {
    if (message.author.id !== targetBotId) return;
    if (!message.embeds?.length) return;

    const embed = message.embeds[0];
    
    const hasTimerDesc = embed.description?.includes('When the timer runs out, 2 random cards of the most voted for series will be generated!');
    const hasChooseDesc = embed.description?.includes('Choose a series to drop characters from:');
    
    if (!hasTimerDesc && !hasChooseDesc) return;
    if (!embed.description) return;

    const lines = embed.description.split('\n');
    
    let seriesLines;
    
    if (hasTimerDesc) {
      // For timer format: **1] The Empty Box and Zeroth Maria**
      seriesLines = lines.filter(line => {
        const trimmed = line.trim();
        return /^\*\*\d+\]/.test(trimmed);
      });
    } else {
      // For choose format: existing logic
      seriesLines = lines.filter(line => {
        const trimmed = line.trim();
        return /^(\*\*)?`?\d+`?[\]\s]*[•\]]/.test(trimmed) || /^\*\*\d+\]/.test(trimmed) || /^\d+\s*[•\]]/.test(trimmed);
      });
    }

    if (seriesLines.length === 0) return;

    let replyText = '';
    for (let i = 0; i < seriesLines.length; i++) {
      const line = seriesLines[i];
      let seriesName;
      
      if (hasTimerDesc) {
        // For timer format: **1] The Empty Box and Zeroth Maria**
        seriesName = line.trim()
          .replace(/^\*\*\d+\]\s*/, '')  // Remove **1] 
          .replace(/\*\*$/, '')  // Remove trailing **
          .trim();
      } else {
        // For choose format: existing logic
        seriesName = line.trim()
          .replace(/^\*\*/, '')  // Remove leading **
          .replace(/\*\*$/, '')  // Remove trailing **
          .replace(/^`\d+`\s*•\s*/, '')  // Remove `1` • 
          .replace(/^`\d+`\s*\]\s*/, '')  // Remove `1`] 
          .replace(/^\d+\s*•\s*/, '')  // Remove 1 • 
          .replace(/^\d+\]\s*/, '')  // Remove 1] 
          .trim();
      }
      
      const match = await findSeriesMatch(seriesName);
      const hearts = match ? match.hearts : '00';
      
      replyText += `\`${i}\`] • :heart: \`${hearts.padStart(3, ' ')}\` • ${seriesName}\n`;
    }

    if (replyText) {
      await message.reply(replyText.trim());
    }
  });
};
