const { SlashCommandBuilder } = require('discord.js');
const { managers } = require('../utils/managers');
const db = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('release')
    .setDescription('Release a player from your team')
    .addUserOption(option => option.setName('releasee').setDescription('User to release').setRequired(true)),

  async execute(interaction) {
    const releasee = interaction.options.getUser('releasee');
    const sender = interaction.user.id;

    if (!managers[sender]) 
      return interaction.reply({ content: '❌ You are not an authorized manager.', ephemeral: true });

    if (managers[releasee.id]) 
      return interaction.reply({ content: '❌ You cannot release another manager.', ephemeral: true });

    if (releasee.id === sender) 
      return interaction.reply({ content: '❌ You cannot release yourself.', ephemeral: true });

    if (releasee.bot) 
      return interaction.reply({ content: '❌ You cannot release bots.', ephemeral: true });

    const senderTeam = managers[sender].team;

    db.getContractedTeam(releasee.id, async (err, row) => {
      if (err) {
        return interaction.reply({ content: '⚠️ Database error.', ephemeral: true });
      }

      if (!row) {
        return interaction.reply({ content: `❌ <@${releasee.id}> is not contracted to any team.`, ephemeral: true });
      }

      if (row.teamName !== senderTeam) {
        return interaction.reply({ content: `❌ You can only release players contracted to your own team (${senderTeam}).`, ephemeral: true });
      }

      db.releasePlayer(releasee.id, async () => {
        const releaseChannel = await interaction.client.channels.fetch('1398678255518613696');
        releaseChannel.send(`🔔 | **<@${releasee.id}>** has been released from ${row.emoji} \`${row.teamName}\``);

        await interaction.reply({ content: `✅ <@${releasee.id}> released from ${row.emoji} \`${row.teamName}\`.`, ephemeral: true });
      });
    });
  }
};
