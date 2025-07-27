const { SlashCommandBuilder } = require('discord.js');
const { managers } = require('../utils/managers');
const db = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('release')
    .setDescription('Release a player from your team')
    .addUserOption(option => option.setName('releasee').setDescription('User to release').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const releasee = interaction.options.getUser('releasee');
      const sender = interaction.user.id;

      if (!managers[sender]) {
        return interaction.editReply({ content: '❌ You are not an authorized manager.' });
      }
      if (managers[releasee.id]) {
        return interaction.editReply({ content: '❌ You cannot release another manager.' });
      }
      if (releasee.id === sender) {
        return interaction.editReply({ content: '❌ You cannot release yourself.' });
      }
      if (releasee.bot) {
        return interaction.editReply({ content: '❌ You cannot release bots.' });
      }

      const senderTeam = managers[sender].team;

      const row = await db.getContractedTeam(releasee.id);
      if (!row) {
        return interaction.editReply({ content: `❌ <@${releasee.id}> is not contracted to any team.` });
      }
      if (row.teamName !== senderTeam) {
        return interaction.editReply({ content: `❌ You can only release players contracted to your own team (${senderTeam}).` });
      }

      await db.releasePlayer(releasee.id);

      const releaseChannel = await interaction.client.channels.fetch('1398678255518613696');
      await releaseChannel.send(`🔔 | **<@${releasee.id}>** has been released from ${row.emoji} \`${row.teamName}\``);

      return interaction.editReply({ content: `✅ <@${releasee.id}> released from ${row.emoji} \`${row.teamName}\`.` });
    } catch {
      return interaction.editReply({ content: '⚠️ An error occurred while processing the release command.' });
    }
  }
};
