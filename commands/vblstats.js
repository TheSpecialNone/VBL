const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vblstats')
    .setDescription('Check your VBL Tokens and level')
    .addUserOption(option =>
      option.setName('member')
        .setDescription('Check another member\'s stats')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('member') || interaction.user;
    const profile = await db.getProfile(target.id);

    const embed = new EmbedBuilder()
      .setTitle('📊 VBL Stats')
      .setDescription(
        `**User:** <@${target.id}>\n` +
        `**Level:** ${profile.level}\n` +
        `**VBL Tokens:** ${profile.bux}`
      )
       .setFooter({
          text: 'VBL | Volta Blox League',
          iconURL: 'https://cdn.discordapp.com/attachments/1228373519386284156/1399496074804203621/image.png?ex=6889de89&is=68888d09&hm=c86984bb3b932b1a58a09e426efcd674b6df66b6ac862bdafcb63815f2bb9e30&'
        })
      .setColor(0xffffff);

    return interaction.reply({ embeds: [embed] });
  }
};
