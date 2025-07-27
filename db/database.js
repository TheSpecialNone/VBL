const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const contractSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  teamName: String,
  emoji: String,
});

const Contract = mongoose.model('Contract', contractSchema);

module.exports = {
  getContractedTeam: async (userId, callback) => {
    try {
      const contract = await Contract.findOne({ userId });
      callback(null, contract);
    } catch (err) {
      callback(err);
    }
  },

  contractPlayer: async (userId, teamName, emoji, callback) => {
    try {
      await Contract.updateOne(
        { userId },
        { $set: { teamName, emoji } },
        { upsert: true }
      );
      callback(null);
    } catch (err) {
      callback(err);
    }
  },

  releasePlayer: async (userId, callback) => {
    try {
      await Contract.deleteOne({ userId });
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
};
