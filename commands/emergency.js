const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { managers, enabled } = require('../utils/managers');
const db = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emergencysign')
    .setDescription('Emergency sign a player (bypasses normal restrictions)')
    .addUserOption(option => 
      option.setName('player')
        .setDescription('Player to emergency sign')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for emergency signing')
        .setRequired(true)
    ),

  async execute(interaction) {
    const sender = interaction.user.id;
    const player = interaction.options.getUser('player');
    const reason = interaction.options.getString('reason');


    if (!managers[sender]) {
      return interaction.reply({ content: '❌ You are not an authorized manager.', ephemeral: true });
    }


    if (!managers[sender].canContract) {
      return interaction.reply({ content: '⚠️ You are not authorized to make contracts.', ephemeral: true });
    }

    // Basic validation checks
    if (managers[player.id]) {
      return interaction.reply({ content: '❌ You cannot sign another manager.', ephemeral: true });
    }

    if (player.id === sender) {
      return interaction.reply({ content: '❌ You cannot sign yourself.', ephemeral: true });
    }

    if (player.bot) {
      return interaction.reply({ content: '❌ You cannot sign bots.', ephemeral: true });
    }

    try {
      const existingContract = await db.getContractedTeam(player.id);
      const teamData = managers[sender];

      const embed = new EmbedBuilder()
        .setTitle('🚨 VBL Emergency Contract')
        .setDescription(
          `**EMERGENCY SIGNING**\n` +
          `By accepting this emergency contract, <@${player.id}>, you agree to join the team immediately.\n\n` +
          `${existingContract ? `⚠️ **Current Team**: ${existingContract.emoji} \`${existingContract.teamName}\`\n` : ''}` +
          `🆕 **New Team**: ${teamData.emoji} \`${teamData.team}\`\n\n` +
          `📋 **Emergency Reason**\n\`${reason}\`\n\n` +
          `🖊️ **Authorized By**\n<@${sender}>\n\n` +
          `⚠️ **Note**: This is an emergency signing that may override existing contracts.`
        )
        .setFooter({
          text: 'VBL Emergency Contract - ' + new Date().toLocaleString(),
          iconURL: 'https://cdn.discordapp.com/attachments/1228373519386284156/1399496074804203621/image.png?ex=6889de89&is=68888d09&hm=c86984bb3b932b1a58a09e426efcd674b6df66b6ac862bdafcb63815f2bb9e30&'
        })
        .setColor(0xff6b6b); 

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`emergency_accept_${sender}_${teamData.team}_${player.id}`)
          .setLabel('Accept Emergency Contract')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🚨'),
        new ButtonBuilder()
          .setCustomId(`emergency_decline_${sender}_${teamData.team}_${player.id}`)
          .setLabel('Decline')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ 
        content: `🚨 <@${player.id}> **EMERGENCY CONTRACT** - Immediate response required!`, 
        embeds: [embed], 
        components: [buttons] 
      });

    } catch (err) {
      console.error('Database error:', err);
      return interaction.reply({ content: '⚠️ Database error occurred.', ephemeral: true });
    }
  }
};