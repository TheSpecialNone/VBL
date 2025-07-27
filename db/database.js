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
  getContractedTeam: async (userId) => {
    return await Contract.findOne({ userId });
  },

  contractPlayer: async (userId, teamName, emoji) => {
    await Contract.updateOne(
      { userId },
      { $set: { teamName, emoji } },
      { upsert: true }
    );
  },

  releasePlayer: async (userId) => {
    await Contract.deleteOne({ userId });
  }
};
