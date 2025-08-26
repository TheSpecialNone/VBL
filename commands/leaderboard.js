const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the top VBL Token earners'),

  async execute(interaction) {
    const leaders = await db.getLeaderboard();

    let desc = leaders.map((p, i) =>
      `**${i + 1}.** <@${p.userId}> — 💰 ${p.bux} VBL Tokens (Lvl ${p.level})`
    ).join('\n');

    if (!desc) desc = "No data yet.";

    const embed = new EmbedBuilder()
      .setTitle('🏆 VBL Tokens Leaderboard')
      .setDescription(desc)
       .setFooter({
          text: 'VBL | Volta Blox League - ' + new Date().toLocaleString(),
          iconURL: 'https://cdn.discordapp.com/attachments/1228373519386284156/1399496074804203621/image.png?ex=6889de89&is=68888d09&hm=c86984bb3b932b1a58a09e426efcd674b6df66b6ac862bdafcb63815f2bb9e30&'
        })
      .setColor(0x2f3136);
      

    return interaction.reply({ embeds: [embed] });
  }
};
