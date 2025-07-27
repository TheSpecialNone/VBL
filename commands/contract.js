const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { managers, enabled } = require('../utils/managers');
const db = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('contract')
    .setDescription('Send a contract to a player')
    .addUserOption(option => option.setName('signee').setDescription('User to send the contract to').setRequired(true)),

  async execute(interaction) {
    if (!enabled) return interaction.reply({ content: '⚠️ The transfer window is currently closed.', ephemeral: true });

    const sender = interaction.user.id;
    const signee = interaction.options.getUser('signee');

    if (!managers[sender]) {
      return interaction.reply({ content: '❌ You are not an authorized manager.', ephemeral: true });
    }

    if (managers[signee.id]) {
      return interaction.reply({ content: `❌ You cannot contract another manager.`, ephemeral: true });
    }

    if (signee.id === sender) {
      return interaction.reply({ content: `❌ You cannot contract yourself.`, ephemeral: true });
    }

    if (signee.bot) {
      return interaction.reply({ content: `❌ You cannot contract bots.`, ephemeral: true });
    }

    db.getContractedTeam(signee.id, async (err, row) => {
      if (err) {
        return interaction.reply({ content: '⚠️ Database error.', ephemeral: true });
      }

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
        iconURL: 'https://media.discordapp.net/attachments/1398674144320819264/1398689899049390212/VBL-monogram-from-MakeMonogram.com-1748179371.png?ex=688646fa&is=6884f57a&hm=3d37ac7c9e31762f92eb910a42da2ce57216ed09b8d9365386c605be48c02b26&=&format=webp&quality=lossless&width=747&height=747'
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
    });
  }
};

_

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
    const releasee = interaction.options.getUser('releasee');
    const sender = interaction.user.id;

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
    }

    if (managers[releasee.id]) {
      return interaction.reply({ content: '❌ You cannot force release another manager.', ephemeral: true });
    }

    if (releasee.id === sender) {
      return interaction.reply({ content: '❌ You cannot force release yourself.', ephemeral: true });
    }

    if (releasee.bot) {
      return interaction.reply({ content: '❌ You cannot force release bots.', ephemeral: true });
    }

    db.getContractedTeam(releasee.id, async (err, row) => {
      if (err) {
        return interaction.reply({ content: '⚠️ Database error.', ephemeral: true });
      }

      if (!row) {
        return interaction.reply({ content: `❌ <@${releasee.id}> is not contracted to any team.`, ephemeral: true });
      }


      db.releasePlayer(releasee.id, async () => {
        const releaseChannel = await interaction.client.channels.fetch('1398678255518613696');
        releaseChannel.send(`⚡ | **<@${releasee.id}>** has been **FORCE RELEASED** from ${row.emoji} \`${row.teamName}\` by <@${sender}>`);
        await interaction.reply({ content: `✅ <@${releasee.id}> force released from ${row.emoji} \`${row.teamName}\`.`, ephemeral: true });
      });
    });
  }
};
