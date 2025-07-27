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
        return interaction.reply({ content: "❌ You can't respond to someone else's contract!", ephemeral: true });
      }

      // Defer update to avoid interaction timeout
      await interaction.deferUpdate();

      const { managers } = require('./utils/managers');
      const db = require('./db/database');

      if (!managers[managerId]) {
        return interaction.editReply({ content: '❌ Invalid manager data.', components: [], embeds: [] });
      }

      const teamData = managers[managerId];
      const member = interaction.user;

     const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { managers, enabled } = require('../utils/managers');
const db = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('contract')
    .setDescription('Send a contract to a player')
    .addUserOption(option => option.setName('signee').setDescription('User to send the contract to').setRequired(true)),

  async execute(interaction) {
    if (!enabled) return interaction.reply({ content: '⚠️ The transfer window is currently closed.', ephemeral: true });

    const sender = interaction.user.id;
    const signee = interaction.options.getUser('signee');

    if (!managers[sender]) {
      return interaction.reply({ content: '❌ You are not an authorized manager.', ephemeral: true });
    }

    if (managers[signee.id]) {
      return interaction.reply({ content: `❌ You cannot contract another manager.`, ephemeral: true });
    }

    if (signee.id === sender) {
      return interaction.reply({ content: `❌ You cannot contract yourself.`, ephemeral: true });
    }

    if (signee.bot) {
      return interaction.reply({ content: `❌ You cannot contract bots.`, ephemeral: true });
    }

    try {
      const row = await db.getContractedTeam(signee.id);

      if (row) {
        return interaction.reply({ content: `❌ <@${signee.id}> is already contracted to ${row.emoji} \`${row.teamName}\``, ephemeral: true });
      }

      const teamData = managers[sender];

      const embed = new EmbedBuilder()
        .setTitle('📑 VBL Contract')
        .setDescription(
          `By accepting this contract, you agree to the terms established by the manager\n` +
          `and acknowledge the team assigned to you, <@${signee.id}>\n\n` +
          `⚠️ **Note**: You cannot join another team until you are released.\n\n` +
          `🧾 **Team**\n${teamData.emoji} \`${teamData.team}\`\n\n` +
          `🖊️ **Signed By**\n<@${sender}>\n\n`
        )
        .setFooter({
          text: 'VBL | Volta Blox League - ' + new Date().toLocaleString(),
          iconURL: 'https://media.discordapp.net/attachments/1398674144320819264/1398689899049390212/VBL-monogram-from-MakeMonogram.com-1748179371.png?ex=688646fa&is=6884f57a&hm=3d37ac7c9e31762f92eb910a42da2ce57216ed09b8d9365386c605be48c02b26&=&format=webp&quality=lossless&width=747&height=747'
        })
        .setColor(0x2f3136);

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_${sender}_${teamData.team}_${signee.id}`)
          .setLabel('Accept')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`decline_${sender}_${teamData.team}_${signee.id}`)
          .setLabel('Decline')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ content: `<@${signee.id}> Pending your decision!`, embeds: [embed], components: [buttons] });
    } catch (error) {
      console.error('Database error:', error);
      return interaction.reply({ content: '⚠️ Database error.', ephemeral: true });
    }
  }
};
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


