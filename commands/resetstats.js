const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetstats')
    .setDescription('Reset a user’s level, messages, and bux')
    .addUserOption(option =>
      option.setName('target')
            .setDescription('The user to reset')
            .setRequired(true)),
  
  async execute(interaction) {
    const target = interaction.options.getUser('target');

    try {
      let profile = await db.getProfile(target.id);
      profile.level = 0;
      profile.messages = 0;
      profile.bux = 0;
      await profile.save();

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`✅ Reset stats for <@${target.id}>!`);

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error('Error resetting stats:', err);
      await interaction.reply({ content: `❌ Failed to reset stats for <@${target.id}>.`, ephemeral: true });
    }
  },
};
