const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const contractSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  teamName: { type: String, required: true },
  emoji: { type: String, required: true }
});

const Contract = mongoose.model('Contract', contractSchema);

module.exports = {
  getContractedTeam: async (userId) => {
    try {
      return await Contract.findOne({ userId }).exec();
    } catch (err) {
      throw err;
    }
  },

  contractPlayer: async (userId, teamName, emoji) => {
    try {
      const newContract = new Contract({ userId, teamName, emoji });
      await newContract.save();
      return newContract;
    } catch (err) {
      throw err;
    }
  },

  releasePlayer: async (userId) => {
    try {
      return await Contract.deleteOne({ userId });
    } catch (err) {
      throw err;
    }
  },

 getPlayersByTeam: async (teamName) => {
  try {
    return await Contract.find({ teamName }).exec();
  } catch (err) {
    throw err;
  }
}
  
};


