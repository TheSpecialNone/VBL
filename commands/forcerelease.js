const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { managers } = require('../utils/managers');
const db = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forcerelease')
    .setDescription('Force release a player from their team (Admin Only)')
    .addUserOption(option => option.setName('releasee').setDescription('User to force release').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const releasee = interaction.options.getUser('releasee');
      const sender = interaction.user.id;

      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({ content: '❌ You need Administrator permissions to use this command.' });
      }
      if (managers[releasee.id]) {
        return interaction.editReply({ content: '❌ You cannot force release another manager.' });
      }
      if (releasee.id === sender) {
        return interaction.editReply({ content: '❌ You cannot force release yourself.' });
      }
      if (releasee.bot) {
        return interaction.editReply({ content: '❌ You cannot force release bots.' });
      }

      const row = await db.getContractedTeam(releasee.id);
      if (!row) {
        return interaction.editReply({ content: `❌ <@${releasee.id}> is not contracted to any team.` });
      }

      await db.releasePlayer(releasee.id);

      const releaseChannel = await interaction.client.channels.fetch('1398678255518613696');
      releaseChannel.send(`⚡ | **<@${releasee.id}>** has been **FORCE RELEASED** from ${row.emoji} \`${row.teamName}\` by <@${sender}>`);

      return interaction.editReply({ content: `✅ <@${releasee.id}> force released from ${row.emoji} \`${row.teamName}\`.` });
    } catch (error) {
      console.error(error);
      return interaction.editReply({ content: '⚠️ An error occurred while processing the forcerelease command.' });
    }
  }
};
