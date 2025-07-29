const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { managers, enabled } = require('../utils/managers');
const db = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('contract')
    .setDescription('Send a contract to a player')
    .addUserOption(option => 
      option.setName('signee')
        .setDescription('User to send the contract to')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!enabled) {
      return interaction.reply({ content: '⚠️ The transfer window is currently closed.', ephemeral: true });
    }

    const sender = interaction.user.id;
    const signee = interaction.options.getUser('signee');

    if (!managers[sender]) {
      return interaction.reply({ content: '❌ You are not an authorized manager.', ephemeral: true });
    }

    if (managers[signee.id]) {
      return interaction.reply({ content: '❌ You cannot contract another manager.', ephemeral: true });
    }

    if (signee.id === sender) {
      return interaction.reply({ content: '❌ You cannot contract yourself.', ephemeral: true });
    }

    if (signee.bot) {
      return interaction.reply({ content: '❌ You cannot contract bots.', ephemeral: true });
    }

    try {
      const row = await db.getContractedTeam(signee.id);

      if (row) {
        return interaction.reply({ content: `❌ <@${signee.id}> is already contracted to ${row.emoji} \`${row.teamName}\``, ephemeral: true });
      }

      const teamData = managers[sender];

      const embed = new EmbedBuilder()
        .setTitle('📑 VBL Contract')
        .setDescription(
          `By accepting this contract, you agree to the terms established by the manager\n` +
          `and acknowledge the team assigned to you, <@${signee.id}>\n\n` +
          `⚠️ **Note**: You cannot join another team until you are released.\n\n` +
          `🧾 **Team**\n${teamData.emoji} \`${teamData.team}\`\n\n` +
          `🖊️ **Signed By**\n<@${sender}>\n\n`
        )
        .setFooter({
          text: 'VBL | Volta Blox League - ' + new Date().toLocaleString(),
          iconURL: 'https://cdn.discordapp.com/attachments/1228373519386284156/1399496074804203621/image.png?ex=6889de89&is=68888d09&hm=c86984bb3b932b1a58a09e426efcd674b6df66b6ac862bdafcb63815f2bb9e30&'
        })
        .setColor(0x2f3136);

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_${sender}_${teamData.team}_${signee.id}`)
          .setLabel('Accept')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`decline_${sender}_${teamData.team}_${signee.id}`)
          .setLabel('Decline')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ content: `<@${signee.id}> Pending your decision!`, embeds: [embed], components: [buttons] });
    } catch (err) {
      console.error('Database error:', err);
      return interaction.reply({ content: '⚠️ Database error occurred.', ephemeral: true });
    }
  }
};
