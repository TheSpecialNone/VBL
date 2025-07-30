const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const managersDB = require('../utils/managers.js');

const MANAGER_ROLE_ID = '1335618302726373397';
const ASSISTANT_ROLE_ID = '1335618236716285984';
const FRIENDLY_ROLE_ID = '1339320152335847546';
const FRIENDLY_CHANNEL_ID = '1400084874437726309';

const regions = ['GMT', 'BST', 'EST', 'CST', 'PST', 'OTHER'];
const types = ['DM TO PLAY', 'IN GAME ALREADY'];

const cooldowns = new Map();
const COOLDOWN_TIME = 10 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('friendly')
    .setDescription('Announce that you are looking for a friendly match')
    .addStringOption(option =>
      option
        .setName('region')
        .setDescription('Your region')
        .setRequired(true)
        .addChoices(...regions.map(r => ({ name: r, value: r })))
    )
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Type of friendly')
        .setRequired(true)
        .addChoices(...types.map(t => ({ name: t, value: t })))
    )
    .addAttachmentOption(option =>
      option
        .setName('image')
        .setDescription('Upload an image (required if IN GAME ALREADY)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const now = Date.now();

    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + COOLDOWN_TIME;
      if (now < expirationTime) {
        const timeLeft = Math.ceil((expirationTime - now) / 1000);
        return interaction.reply({ content: `⏳ Please wait ${timeLeft} more second(s) before using this command again.`, ephemeral: true });
      }
    }

    const user = interaction.user;
    const region = interaction.options.getString('region');
    const type = interaction.options.getString('type');
    const image = interaction.options.getAttachment('image');

    if (type === 'IN GAME ALREADY' && !image) {
      return interaction.reply({ content: '❌ You must upload an image when type is "IN GAME ALREADY".', ephemeral: true });
    }
    if (type === 'DM TO PLAY' && image) {
      return interaction.reply({ content: '❌ You cannot upload an image when type is "DM TO PLAY".', ephemeral: true });
    }

    cooldowns.set(userId, now);

    const isManager = userId in managersDB.managers;
    const managerData = managersDB.managers[userId];
    const member = interaction.guild.members.cache.get(userId);
    const displayName = member ? member.displayName : user.username;

    let pingString;
    if (isManager) {
      pingString = `<@${userId}> <@&${MANAGER_ROLE_ID}> <@&${ASSISTANT_ROLE_ID}> <@&${FRIENDLY_ROLE_ID}>`;
    } else {
      pingString = `<@${userId}> <@&${FRIENDLY_ROLE_ID}>`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTimestamp()
      .setFooter({ text: 'VBL | Volta Blox League', iconURL: 'https://cdn.discordapp.com/attachments/1228373519386284156/1399496074804203621/image.png?ex=6889de89&is=68888d09&hm=c86984bb3b932b1a58a09e426efcd674b6df66b6ac862bdafcb63815f2bb9e30&' })
      .setAuthor({ name: displayName, iconURL: user.displayAvatarURL({ extension: 'png', size: 128 }) });

    if (isManager) {
      embed.setTitle(`${managerData.emoji} \`${managerData.team}\` is Looking for a Match!`)
        .addFields(
          { name: 'Region', value: region, inline: true },
          { name: 'Status', value: type === 'IN GAME ALREADY' ? 'In Game' : 'DM to Play', inline: true },

          { 
            name: 'Info', 
            value: type === 'DM TO PLAY' 
              ? `DM <@${userId}> if you want to friendly!` 
              : 'Team is in a server waiting to friendly!', 
            inline: false 
          }
        );
    } else {
      embed.setTitle(`${displayName} is Looking for a Friendly!`)
        .addFields(
          { name: 'Region', value: region, inline: true },
          { name: 'Status', value: type === 'IN GAME ALREADY' ? 'In Game' : 'DM to Play', inline: true },
          { 
            name: 'Info', 
            value: type === 'DM TO PLAY' 
              ? `DM <@${userId}> if you want to friendly!` 
              : 'Team is in a server waiting to friendly!', 
            inline: false 
          }
        );
    }

    if (type === 'IN GAME ALREADY' && image) {
      embed.setImage(image.url);
    }

    try {
      const channel = await interaction.client.channels.fetch(FRIENDLY_CHANNEL_ID);
      await channel.send({ content: pingString, embeds: [embed] });
      await interaction.reply({ content: '✅ Your friendly announcement has been sent!', ephemeral: true });
    } catch (error) {
      console.error('Error sending friendly message:', error);
      cooldowns.delete(userId);
      await interaction.reply({ content: '⚠️ Failed to send friendly announcement.', ephemeral: true });
    }
  }
};
