const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db/database');

function makeProgressBar(current, needed, length = 10) {
  const filled = Math.round((current / needed) * length);
  const empty = length - filled;
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the top VBL Token earners'),

  async execute(interaction) {
    let leaders = await db.getLeaderboard();

    leaders = leaders.filter(p => p.bux > 0);

    leaders.sort((a, b) => {
      if (b.level === a.level) {
        return b.bux - a.bux;
      }
      return b.level - a.level;
    });

    let desc = leaders.map((p, i) => {
      const needed = (p.level + 1) * 5; 
      const bar = makeProgressBar(p.messages, needed, 12);
      return `**${i + 1}.** <@${p.userId}> — 💰 ${p.bux} Tokens | 🆙 Lvl ${p.level}\n\`${bar}\` (${p.messages}/${needed})`;
    }).join('\n\n');

    if (!desc) desc = "No data yet.";

    const embed = new EmbedBuilder()
      .setTitle('🏆 VBL Tokens Leaderboard')
      .setDescription(desc)
      .setFooter({
        text: 'VBL | Volta Blox League',
        iconURL: 'https://cdn.discordapp.com/attachments/1228373519386284156/1399496074804203621/image.png?ex=6889de89&is=68888d09&hm=c86984bb3b932b1a58a09e426efcd674b6df66b6ac862bdafcb63815f2bb9e30&'
      })
      .setColor(0xffffff);

    return interaction.reply({ embeds: [embed] });
  }
};
