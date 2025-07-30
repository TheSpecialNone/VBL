const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
  ActivityType,
  Events,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const express = require('express');


const ANNOUNCE_CHANNEL_ID = '1400122725317607586';
const MINIMUM_ROLE_ID = '1335618455251980330';

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


const app = express();
const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(PORT, () => console.log(`Uptime server is running on port ${PORT}`));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
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

// Bot ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({
    status: 'dnd',
    activities: [{
      name: '/help',
      type: ActivityType.Listening
    }]
  });
  console.log('Bot status set to DND with /help activity');
});


const db = require('./db/database');
const { managers } = require('./utils/managers');


client.on(Events.InteractionCreate, async interaction => {
  try {
    // Slash Command
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

      if (!managers[managerId]) {
        return interaction.update({ content: '❌ Invalid manager data.', components: [], embeds: [] });
      }

      const teamData = managers[managerId];
      const member = interaction.user;

      if (action === 'accept') {
        try {
          const row = await db.getContractedTeam(member.id);
          if (row) {
            return interaction.update({ content: `❌ You are already contracted to ${row.emoji} \`${row.teamName}\`.`, components: [], embeds: [] });
          }

          await db.contractPlayer(member.id, teamName, teamData.emoji);

          const signingChannel = await interaction.client.channels.fetch('1400085329377099846');
          signingChannel.send(`🔔 | <@${member.id}> has joined ${teamData.emoji} \`${teamData.team}\``);

          return interaction.update({ content: `✅ Contract signed with ${teamData.emoji} \`${teamData.team}\`.`, components: [], embeds: [] });

        } catch (error) {
          console.error('Database error:', error);
          return interaction.update({ content: '⚠️ Database error.', components: [], embeds: [] });
        }
      }

      if (action === 'decline') {
        return interaction.update({ content: `❌ | <@${member.id}> has declined the contract.`, components: [], embeds: [] });
      }
    }


    else if (interaction.isModalSubmit() && interaction.customId === 'announceModal') {
      const member = interaction.member;
      const user = interaction.user;
      const guild = interaction.guild;

      const requiredRole = guild.roles.cache.get(MINIMUM_ROLE_ID);
      if (!requiredRole || member.roles.highest.comparePositionTo(requiredRole) < 0) {
        return interaction.reply({ content: '🚫 You do not have permission.', ephemeral: true });
      }

      const message = interaction.fields.getTextInputValue('announcementInput');

      const embed = new EmbedBuilder()
        .setColor('#f2f2f2')
        .setDescription(message)
        .setTimestamp()
        .setFooter({
          text: user.username,
          iconURL: user.displayAvatarURL({ extension: 'png', size: 64 })
        });

      try {
        const announceChannel = await interaction.client.channels.fetch(ANNOUNCE_CHANNEL_ID);
        await announceChannel.send({ content: '@everyone', embeds: [embed] });
        await interaction.reply({ content: '✅ Announcement sent!', ephemeral: true });
      } catch (error) {
        console.error('Error sending announcement:', error);
        await interaction.reply({ content: '⚠️ Failed to send the announcement.', ephemeral: true });
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
