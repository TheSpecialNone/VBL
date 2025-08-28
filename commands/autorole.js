const { SlashCommandBuilder } = require('discord.js');
const db = require('../db/database');
const { managers } = require('../utils/managers');

const allTeams = [...new Set(Object.values(managers).map(m => m.team))];

const roleNameMap = {
  "Man City": "Manchester City",
  "Man United": "Manchester United",
  "Tottenham": "Tottenham Hotspur",
  "Atletico Madrid": "Atlético de Madrid", 
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Auto-assign team roles to all contracted players'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    let updatedCount = 0;
    let skippedCount = 0;
    let missingRoles = [];

    for (const team of allTeams) {
      try {
        const players = await db.getPlayersByTeam(team);
        if (!players.length) continue;

        const roleName = roleNameMap[team] || team;

        const role = guild.roles.cache.find(
          r => r.name.toLowerCase() === roleName.toLowerCase()
        );
        if (!role) {
          missingRoles.push(roleName);
          continue;
        }

        for (const p of players) {
          try {
            const member = await guild.members.fetch(p.userId).catch(() => null);
            if (!member) continue;

            if (!member.roles.cache.has(role.id)) {
              await member.roles.add(role);
              updatedCount++;
            } else {
              skippedCount++;
            }
          } catch (err) {
            console.error(`❌ Failed to give role to ${p.userId} for ${team}:`, err);
          }
        }
      } catch (err) {
        console.error(`❌ Error processing team ${team}:`, err);
      }
    }

    let reply = `✅ Auto-role complete.\n📌 Added roles: **${updatedCount}**\n⏭️ Skipped (already had role): **${skippedCount}**`;
    if (missingRoles.length) {
      reply += `\n⚠️ Missing roles for: ${missingRoles.join(', ')}`;
    }

    await interaction.editReply({ content: reply });
  }
};
