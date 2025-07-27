const { Client, Collection, GatewayIntentBits, REST, Routes, ActivityType } = require('discord.js');
require('dotenv').config();
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = [];

const express = require("express");
const app = express();

app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Refreshing commands...');
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
        await interaction.deferUpdate();
        return interaction.followUp({ content: "❌ You can't respond to someone else's contract!", ephemeral: true });
      }

    
      await interaction.deferUpdate();

      const { managers } = require('./utils/managers');
      const db = require('./db/database');

      if (!managers[managerId]) {
        return interaction.followUp({ content: '❌ Invalid manager data.', ephemeral: true });
      }

      const teamData = managers[managerId];
      const member = interaction.user;

      if (action === 'accept') {
        db.getContractedTeam(member.id, async (err, row) => {
          if (err) {
            return interaction.followUp({ content: '⚠️ Database error.', ephemeral: true });
          }
          if (row) {
            return interaction.followUp({ content: `❌ You are already contracted to ${row.emoji} \`${row.teamName}\`.`, ephemeral: true });
          }
          db.contractPlayer(member.id, teamName, teamData.emoji, (contractErr) => {
            if (contractErr) {
              return interaction.followUp({ content: '⚠️ Error saving contract to database.', ephemeral: true });
            }
            interaction.client.channels.fetch('1398678243040559214')
              .then(signingChannel => {
                signingChannel.send(`🔔 | <@${member.id}> has joined ${teamData.emoji} \`${teamData.team}\``);
                return interaction.followUp({ content: `✅ Contract signed with ${teamData.emoji} \`${teamData.team}\`.`, ephemeral: true });
              })
              .catch(fetchErr => {
                console.error('Error fetching signing channel:', fetchErr);
                interaction.followUp({ content: '⚠️ Error sending message to signing channel.', ephemeral: true });
              });
          });
        });
      }
      else if (action === 'decline') {
        await interaction.followUp({ content: `❌ | <@${member.id}> has declined the contract.`, ephemeral: true });
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
