const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { managers } = require('../utils/managers');
const db = require('../db/database');

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
    const user = interaction.user.id;
    const position = interaction.options.getString('position');
    const region = interaction.options.getString('region');

    if (managers[user]) {
      return interaction.reply({ content: '❌ Managers cannot register as free agents.', ephemeral: true });
    }

    const cooldownAmount = 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (cooldowns.has(user)) {
      const expirationTime = cooldowns.get(user) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);

        return interaction.reply({ 
          content: `⏰ You're on cooldown! You can register as a free agent again in ${hours}h ${minutes}m.`, 
          ephemeral: true 
        });
      }
    }

    db.getContractedTeam(user, async (err, row) => {
      if (err) {
        return interaction.reply({ content: '⚠️ Database error.', ephemeral: true });
      }

      if (row) {
        return interaction.reply({ content: `❌ You are already contracted to ${row.emoji} \`${row.teamName}\`. You must be released before becoming a free agent.`, ephemeral: true });
      }

     
      cooldowns.set(user, now);

   
      setTimeout(() => {
        cooldowns.delete(user);
      }, cooldownAmount);

      const embed = new EmbedBuilder()
        .setTitle('🏃‍♂️ Free Agent Registration')
        .setDescription(
          `<@${user}> has registered as a free agent!\n\n` +
          `📍 **Position**: ${position}\n` +
          `🌍 **Region**: ${region}\n\n` +
          `Managers can send contracts to this player using \`/contract\``
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({
          text: 'VBL | Volta Blox League - ' + new Date().toLocaleString(),
          iconURL: 'https://media.discordapp.net/attachments/1398674144320819264/1398689899049390212/VBL-monogram-from-MakeMonogram.com-1748179371.png?ex=688646fa&is=6884f57a&hm=3d37ac7c9e31762f92eb910a42da2ce57216ed09b8d9365386c605be48c02b26&=&format=webp&quality=lossless&width=747&height=747'
        })
        .setColor(0xffa500)
        .setTimestamp();

      const targetChannel = interaction.client.channels.cache.get('1398754075348303902');
      if (targetChannel) {
        await targetChannel.send({ content: `<@${user}>`, embeds: [embed] });
        await interaction.reply({ content: '✅ You have been registered as a free agent!', ephemeral: true });
      } else {
        await interaction.reply({ content: '⚠️ Could not find the free agent channel.', ephemeral: true });
      }
    });
  }
};