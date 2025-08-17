const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { managers } = require('../utils/managers');

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scout')
    .setDescription('Scout for players in a specific position')
    .addStringOption(option => 
      option.setName('position')
        .setDescription('Position you are scouting for')
        .setRequired(true)
        .addChoices(
          {name : 'ALL', value: 'ALL'},
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
      option.setName('message')
        .setDescription('Your scouting message')
        .setRequired(true)
        .setMaxLength(1000)
    ),

  async execute(interaction) {
    const user = interaction.user.id;
    const position = interaction.options.getString('position');
    const message = interaction.options.getString('message');

    if (!managers[user]) {
      return interaction.reply({ content: '❌ Only authorized managers can use this command.', ephemeral: true });
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
          content: `⏰ You're on cooldown! You can scout again in ${hours}h ${minutes}m.`, 
          ephemeral: true 
        });
      }
    }


    cooldowns.set(user, now);


    setTimeout(() => {
      cooldowns.delete(user);
    }, cooldownAmount);

    const teamData = managers[user];

    const embed = new EmbedBuilder()
      .setTitle('🔍 Player Scout')
      .setDescription(
        `${teamData.emoji} \`${teamData.team}\` is scouting for players!\n\n` +
        `📌 **Position**: ${position}\n\n` +
        `💬 **Message**:\n${message}\n\n` +
        `*If you're interested and available, feel free to DM the manager!*`
      )
      .setAuthor({
        name: interaction.user.displayName,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setFooter({
        text: 'VBL | Volta Blox League - ' + new Date().toLocaleString(),
        iconURL: 'https://cdn.discordapp.com/attachments/1228373519386284156/1399496074804203621/image.png?ex=6889de89&is=68888d09&hm=c86984bb3b932b1a58a09e426efcd674b6df66b6ac862bdafcb63815f2bb9e30&'
      })
      .setColor(0x00ff00)
      .setTimestamp();

    const targetChannel = interaction.client.channels.cache.get('1400084855236198400');
    if (targetChannel) {
      await targetChannel.send({ embeds: [embed] });
      await interaction.reply({ content: '✅ Your scouting message has been posted!', ephemeral: true });
    } else {
      await interaction.reply({ content: '⚠️ Could not find the scouting channel.', ephemeral: true });
    }
  }
};