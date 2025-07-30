const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { managers } = require('../utils/managers');
const db = require('../db/database'); // Firebase version
const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('freeagent')
    .setDescription('Register yourself as a free agent')
    .addStringOption(option =>
      option.setName('position')
        .setDescription('Your preferred position')
        .setRequired(true)
        .addChoices(
          { name: 'GK', value: 'GK' },
          { name: 'CB', value: 'CB' },
          { name: 'CDM', value: 'CDM' },
          { name: 'CM', value: 'CM' },
          { name: 'CAM', value: 'CAM' },
          { name: 'CF', value: 'CF' },
          { name: 'ST', value: 'ST' }
        )
    )
    .addStringOption(option =>
      option.setName('region')
        .setDescription('Your timezone/region')
        .setRequired(true)
        .addChoices(
          { name: 'GMT', value: 'GMT' },
          { name: 'BST', value: 'BST' },
          { name: 'EST', value: 'EST' },
          { name: 'CST', value: 'CST' },
          { name: 'PST', value: 'PST' },
          { name: 'UTC', value: 'UTC' },
          { name: 'WEST', value: 'WEST' },
          { name: 'EET', value: 'EET' },
          { name: 'EEST', value: 'EEST' },
          { name: 'MSK', value: 'MSK' },
          { name: 'OTHER', value: 'OTHER' }
        )
    ),

  async execute(interaction) {
    const user = interaction.user;
    const userId = user.id;
    const position = interaction.options.getString('position');
    const region = interaction.options.getString('region');

    if (managers[userId]) {
      return interaction.reply({ content: '❌ Managers cannot register as free agents.', ephemeral: true });
    }

    const cooldownAmount = 24 * 60 * 60 * 1000; // 24 hours in ms
    const now = Date.now();

    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);

        return interaction.reply({
          content: `⏰ You're on cooldown! Try again in ${hours}h ${minutes}m.`,
          ephemeral: true
        });
      }
    }

    try {
      const contract = await db.getContractedTeam(userId);
      if (contract) {
        return interaction.reply({
          content: `❌ You are already contracted to ${contract.emoji} \`${contract.teamName}\`.`,
          ephemeral: true
        });
      }

      cooldowns.set(userId, now);
      setTimeout(() => cooldowns.delete(userId), cooldownAmount);

      const embed = new EmbedBuilder()
        .setTitle('🏃‍♂️ Free Agent Registration')
        .setDescription(
          `<@${userId}> has registered as a free agent!\n\n` +
          `📍 **Position**: ${position}\n` +
          `🌍 **Region**: ${region}\n\n` +
          `Managers can send contracts to this player using \`/contract\``
        )
        .setThumbnail(user.displayAvatarURL())
        .setFooter({
          text: 'VBL | Volta Blox League - ' + new Date().toLocaleString(),
          iconURL: 'https://cdn.discordapp.com/attachments/1228373519386284156/1399496074804203621/image.png?ex=6889de89&is=68888d09&hm=c86984bb3b932b1a58a09e426efcd674b6df66b6ac862bdafcb63815f2bb9e30&'
        })
        .setColor(0xffa500)
        .setTimestamp();

      const targetChannel = interaction.client.channels.cache.get('1400084865591804045');

      if (!targetChannel) {
        return interaction.reply({
          content: '⚠️ Could not find the free agent channel.',
          ephemeral: true
        });
      }

      await targetChannel.send({ content: `<@${userId}>`, embeds: [embed] });
      await interaction.reply({
        content: '✅ You have been registered as a free agent!',
        ephemeral: true
      });

    } catch (err) {
      console.error('Free agent error:', err);
      return interaction.reply({ content: '⚠️ Something went wrong. Try again later.', ephemeral: true });
    }
  }
};
