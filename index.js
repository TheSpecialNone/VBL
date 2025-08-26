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

const emojiMap = {};

require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const express = require('express');

const ANNOUNCE_CHANNEL_ID = '1335624758842101853';
const MINIMUM_ROLE_ID = '1335618455251980330';
const ADVANCEMENT_CHANNEL = '1376541428846563390'; 

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});
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

// ────────────── IMPORT DB ──────────────
const db = require('./db/database');
const { managers } = require('./utils/managers');

// ────────────── MESSAGE XP / LEVELING ──────────────
const talkedRecently = new Set();

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;

  if (talkedRecently.has(message.author.id)) return;
  talkedRecently.add(message.author.id);
  setTimeout(() => talkedRecently.delete(message.author.id), 60000);

  try {
    let userDoc = await db.getProfile(message.author.id);

    userDoc.messages = (userDoc.messages || 0) + 1;

    // level-up formula: scale by 50 messages per level
    const needed = (userDoc.level + 1) * 50;

    if (userDoc.messages >= needed) {
      userDoc.level = (userDoc.level || 0) + 1;
      userDoc.messages = 0;

      const award = 25 + ((userDoc.level - 1) * 5);
      userDoc.bux = (userDoc.bux || 0) + award;

      await db.saveLevel(userDoc); // ensure this exists in database.js

      const channel = await client.channels.fetch(ADVANCEMENT_CHANNEL);
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor('#00FFAA')
          .setDescription(`🎉 <@${message.author.id}> reached **Level ${userDoc.level}**!\n💸 Awarded **${award} VRF Bux**`)
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        channel.send({ embeds: [embed] });
      }
    } else {
      await db.saveLevel(userDoc);
    }
  } catch (err) {
    console.error('Leveling error:', err);
  }
});


// ────────────── BOOST REWARD ──────────────
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (!oldMember.premiumSince && newMember.premiumSince) {
    try {
      let userDoc = await db.getProfile(newMember.id);
      userDoc.bux = (userDoc.bux || 0) + 25;
      await db.saveLevel(userDoc);

      const embed = new EmbedBuilder()
        .setColor('#FF73FA')
        .setDescription(`💎 <@${newMember.id}> boosted the server!\n+25 VBL Tokens`)
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      const channel = await client.channels.fetch(ADVANCEMENT_CHANNEL);
      channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('Boost reward error:', err);
    }
  }
});

// ────────────── INTERACTIONS ──────────────
client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
    }

    else if (interaction.isButton()) {
      const customIdParts = interaction.customId.split('_');

      if (customIdParts[0] === 'emergency') {
        const [, emergencyAction, managerId, teamName, signeeId] = customIdParts;

        if (interaction.user.id !== signeeId) {
          return interaction.reply({ content: "❌ You can't respond to someone else's contract!", ephemeral: true });
        }

        if (!managers[managerId]) {
          return interaction.update({ content: '❌ Invalid manager data.', components: [], embeds: [] });
        }

        const teamData = managers[managerId];
        const member = interaction.user;

        if (emergencyAction === 'accept') {
          try {
            const existingContract = await db.getContractedTeam(member.id);
            if (existingContract) {
              console.log(`Emergency signing: ${member.id} being moved from ${existingContract.teamName} to ${teamName}`);
            }

            await db.contractPlayer(member.id, teamName, teamData.emoji);

            const signingChannel = await interaction.client.channels.fetch('1400085329377099846');
            signingChannel.send(`🚨 **EMERGENCY SIGNING** | <@${member.id}> has joined ${teamData.emoji} \`${teamData.team}\``);

            return interaction.update({ 
              content: `✅ Emergency contract signed with ${teamData.emoji} \`${teamData.team}\`.`, 
              components: [], 
              embeds: [] 
            });
          } catch (error) {
            console.error('Emergency contract database error:', error);
            return interaction.update({ content: '⚠️ Database error during emergency signing.', components: [], embeds: [] });
          }
        }

        if (emergencyAction === 'decline') {
          return interaction.update({ 
            content: `❌ | <@${member.id}> has declined the emergency contract.`, 
            components: [], 
            embeds: [] 
          });
        }
      } 
      else {
        const [action, managerId, teamName, signeeId] = customIdParts;

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
    }

    else if (interaction.isModalSubmit() && interaction.customId === 'announceModal') {
      const member = interaction.member;
      const guild = interaction.guild;

      const requiredRole = guild.roles.cache.get(MINIMUM_ROLE_ID);
      if (!requiredRole || member.roles.highest.comparePositionTo(requiredRole) < 0) {
        return interaction.reply({ content: '🚫 You do not have permission.', ephemeral: true });
      }

      let message = interaction.fields.getTextInputValue('announcementInput');

      for (const [shortcut, emoji] of Object.entries(emojiMap)) {
        message = message.replaceAll(shortcut, emoji);
      }

      const embed = new EmbedBuilder()
        .setColor('#f2f2f2')
        .setDescription(message)
        .setTimestamp()
        .setFooter({
          text: member.displayName,
          iconURL: member.displayAvatarURL({ extension: 'png', size: 64 })
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
