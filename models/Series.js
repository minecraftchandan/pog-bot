const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({
  line_number: Number,
  hearts: String,
  series: String
}, { collection: 'series' });

module.exports = mongoose.model('Series', seriesSchema);