const { Client, Collection, GatewayIntentBits, REST, Routes, ActivityType } = require('discord.js');
require('dotenv').config();
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is online!');
});

app.listen(PORT, () => {
  console.log(`Uptime server is running on port ${PORT}`);
});


(async () => {
    try {
        console.log('Refreshing commands....');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('Commands refreshed.');
    } catch (error) {
        console.error(error);
    }
})();


client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({
        status: 'dnd',
        activities: [{
            name: '/help for commands',
            type: ActivityType.Listening
        }]
    });

    console.log('Bot status set to DND with /help activity');
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
    }
        else if (interaction.isButton()) {
          const [action, managerId, teamName, signeeId] = interaction.customId.split('_');
          if (interaction.user.id !== signeeId) {
            return interaction.reply({ content: "❌ You can't respond to someone else's contract!", ephemeral: true });
          }
          const { managers } = require('./utils/managers');
          const db = require('./db/database');
          if (!managers[managerId]) {
            return interaction.update({ content: '❌ Invalid manager data.', components: [], embeds: [] });
          }
          const teamData = managers[managerId];
          const member = interaction.user;
          if (action === 'accept') {
            db.getContractedTeam(member.id, async (err, row) => {
              if (err) {
                return interaction.update({ content: '⚠️ Database error.', components: [], embeds: [] });
              }
              if (row) {
                return interaction.update({ content: `❌ You are already contracted to ${row.emoji} \`${row.teamName}\`.`, components: [], embeds: [] });
              }
              db.contractPlayer(member.id, teamName, teamData.emoji, (contractErr) => {
                if (contractErr) {
                  return interaction.update({ content: '⚠️ Error saving contract to database.', components: [], embeds: [] });
                }
                interaction.client.channels.fetch('1398678243040559214')
                  .then(signingChannel => {
                    signingChannel.send(`🔔 | <@${member.id}> has joined ${teamData.emoji} \`${teamData.team}\``);
                    return interaction.update({ content: `✅ Contract signed with ${teamData.emoji} \`${teamData.team}\`.`, components: [], embeds: [] });
                  })
                  .catch(fetchErr => {
                    console.error('Error fetching signing channel:', fetchErr);
                    interaction.update({ content: '⚠️ Error sending message to signing channel.', components: [], embeds: [] });
                  });
              });
            });
          }
          else if (action === 'decline') {
            await interaction.update({ content: `❌ | <@${member.id}> has declined the contract.`, components: [], embeds: [] });
          }
        }
  } catch (err) {
    console.error('Error handling interaction:', err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '❌ There was an error processing this interaction.', ephemeral: true });
    } else {
      await interaction.reply({ content: '❌ There was an error processing this interaction.', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);