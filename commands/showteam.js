const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');
const db = require('../db/database');
const { managers } = require('../utils/managers');


const allTeams = [...new Set(Object.values(managers).map(m => m.team))].slice(0, 25);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('showteam')
    .setDescription('Show team roster and staff')
    .addStringOption(option =>
      option.setName('team')
        .setDescription('Select a team')
        .setRequired(true)
        .addChoices(...allTeams.map(team => ({ name: team, value: team })))
    ),

  async execute(interaction) {
    const selectedTeam = interaction.options.getString('team');
    const guild = interaction.guild;

    await interaction.deferReply({ ephemeral: true }); 

    // Find all staff for selected team
    const staff = Object.entries(managers)
      .filter(([, value]) => value.team === selectedTeam)
      .map(([id, value]) => ({ id, emoji: value.emoji }));

    const staffDisplay = {
      managers: [],
      assistants: [],
    };

    for (const person of staff) {
      try {
        const member = await guild.members.fetch(person.id);
       if (member.roles.cache.some(role => role.name === 'VBL | Manager')) {
  staffDisplay.managers.push(`<@${person.id}>`);
} else if (member.roles.cache.some(role => role.name === 'VBL | Assistant Manager')) {
  staffDisplay.assistants.push(`<@${person.id}>`);
}
      } catch (e) {
        continue;
      }
    }

 
    const players = await db.getPlayersByTeam(selectedTeam);

    const embed = new EmbedBuilder()
      .setTitle(`${staff[0]?.emoji || ''} ${selectedTeam} Roster`)
      .setColor(0x2f3136)
      .addFields(
        { name: '👔 Manager(s)', value: staffDisplay.managers.join('\n') || 'None', inline: true },
        { name: '🧠 Assistant(s)', value: staffDisplay.assistants.join('\n') || 'None', inline: true },
        {
          name: '🧑‍💼 Contracted Players',
          value: players.length ? players.map(p => `<@${p.userId}>`).join('\n') : 'No players contracted yet.'
        }
      )
      .setFooter({
        text: 'VBL | Volta Blox League',
        iconURL: interaction.client.user.displayAvatarURL()
      });

    await interaction.editReply({ embeds: [embed] });
  }
};
