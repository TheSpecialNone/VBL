const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Contract Schema
const contractSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  teamName: { type: String, required: true },
  emoji: { type: String, required: true }
});
const Contract = mongoose.model('Contract', contractSchema);

// Economy + Levels Schema
const profileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  bux: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  messages: { type: Number, default: 0 } 
});
const Profile = mongoose.model('Profile', profileSchema);

module.exports = {
  // --- Contracting Functions ---
  getContractedTeam: async (userId) => Contract.findOne({ userId }).exec(),
  contractPlayer: async (userId, teamName, emoji) => {
    const newContract = new Contract({ userId, teamName, emoji });
    await newContract.save();
    return newContract;
  },
  releasePlayer: async (userId) => Contract.deleteOne({ userId }),
  getPlayersByTeam: async (teamName) => Contract.find({ teamName }).exec(),

  // --- Economy + Levels ---
getProfile: async (userId) => {
  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $setOnInsert: { bux: 0, level: 0, messages: 0 } },
    { upsert: true, new: true }
  );
  return profile;
},

addMessageXP: async (userId, channel, client) => {
  // Use findOneAndUpdate with upsert to avoid duplicates
  let profile = await Profile.findOneAndUpdate(
    { userId },
    { $setOnInsert: { bux: 0, level: 0, messages: 0 } },
    { upsert: true, new: true }
  );

  profile.messages += 1;

  const needed = (profile.level + 1) * 5;
  if (profile.messages >= needed) {
    profile.level++;
    profile.messages = 0;

    const reward = 5
    profile.bux += reward;

    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
      .setTitle('🎉 Level Up!')
      .setDescription(`You reached **Level ${profile.level}**!\nYou earned **${reward} VBL Tokens**`)
      .setFooter({
          text: 'VBL | Volta Blox League',
          iconURL: 'https://cdn.discordapp.com/attachments/1228373519386284156/1399496074804203621/image.png?ex=6889de89&is=68888d09&hm=c86984bb3b932b1a58a09e426efcd674b6df66b6ac862bdafcb63815f2bb9e30&'
        })
      .setColor(0xffffff);


    client.channels.cache.get("1376541428846563390").send({
      content: `<@${userId}>`,
      embeds: [embed]
    });
  }

  await profile.save();
},


  saveLevel: async (profile) => {
  if (!profile) return;
  await profile.save();
},

  getLeaderboard: async () => {
    return Profile.find().sort({ bux: -1 }).limit(10).exec();
  }
};
