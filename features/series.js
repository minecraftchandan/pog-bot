const Series = require('../models/Series');

// simple in-memory cache for series data to avoid frequent database queries
let _seriesCache = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

async function getAllSeries() {
  if (!_seriesCache || (Date.now() - _cacheTimestamp) > CACHE_TTL) {
    _seriesCache = await Series.find({});
    _cacheTimestamp = Date.now();
  }
  return _seriesCache;
}

// generic helper that matches a display name against a list of series documents
function matchSeriesInList(displayName, list) {
  const cleanDisplay = displayName.replace(/\.+$/, '').trim();

  // direct lookup (case-sensitive) is fast when we build a map
  // but list is small enough we can iterate
  // exact match first
  let match = list.find(s => s.series === displayName);
  if (match) return match;

  // partial match using regex on cleaned name
  const regex = new RegExp(`^${cleanDisplay.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
  match = list.find(s => regex.test(s.series));
  if (match) return match;

  // reverse match with trimmed names
  match = list.find(s => {
    const seriesName = s.series.replace(/\.+$/, '').trim();
    return seriesName.startsWith(cleanDisplay) || cleanDisplay.startsWith(seriesName);
  });
  return match || null;
}

// an async version for callers that need DB access directly
async function findSeriesMatch(displayName) {
  const allSeries = await Series.find({});
  return matchSeriesInList(displayName, allSeries);
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

    // fetch all series once (cached) and build in-memory list
    const allSeries = await getAllSeries();

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
      
      // synchronous match using cache
      const match = matchSeriesInList(seriesName, allSeries);
      const hearts = match ? match.hearts : '00';
      
      replyText += `\`${i}\`] • :heart: \`${hearts.padStart(3, ' ')}\` • ${seriesName}\n`;
    }

    if (replyText) {
      await message.reply(replyText.trim());
    }
  });
};
