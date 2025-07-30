const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

const ANNOUNCE_CHANNEL_ID = '1400122725317607586';
const MINIMUM_ROLE_ID = '1335618455251980330';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Make an announcement that pings everyone')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('The announcement message')
        .setRequired(true)
    ),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    const user = interaction.user;

    const member = interaction.member;
    const guild = interaction.guild;

    const requiredRole = guild.roles.cache.get(MINIMUM_ROLE_ID);
    if (!requiredRole) {
      return interaction.reply({ content: '❌ Role restriction is misconfigured. Contact an admin.', ephemeral: true });
    }

    const hasPermission = member.roles.highest.comparePositionTo(requiredRole) >= 0;

    if (!hasPermission) {
      return interaction.reply({ content: '🚫 You do not have permission to use this command.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#f2f2f2')
      .setDescription(`${message}`)
      .setTimestamp()
      .setFooter({
        text: user.username,
        iconURL: user.displayAvatarURL({ extension: 'png', size: 64 })
      });

    try {
      const announceChannel = await interaction.client.channels.fetch(ANNOUNCE_CHANNEL_ID);
      await announceChannel.send({ content: '@everyone', embeds: [embed] });
      await interaction.reply({ content: '✅ Announcement sent!', ephemeral: true });
    } catch (error) {
      console.error('Error sending announcement:', error);
      await interaction.reply({ content: '⚠️ Failed to send the announcement.', ephemeral: true });
    }
  }
};
