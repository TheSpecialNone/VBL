const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { managers } = require('../utils/managers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display all available commands and their descriptions'),

  async execute(interaction) {
    const user = interaction.user.id;
    const isManager = managers[user] ? true : false;

    const embed = new EmbedBuilder()
      .setTitle('📋 VBL Command Help')
      .setDescription('Here are all the available commands in the Volta Blox League bot:')
      .setColor(0x2f3136)
      .setThumbnail('https://cdn.discordapp.com/attachments/1228373519386284156/1399496074804203621/image.png?ex=6889de89&is=68888d09&hm=c86984bb3b932b1a58a09e426efcd674b6df66b6ac862bdafcb63815f2bb9e30&')
      .setFooter({
        text: 'VBL | Volta Blox League - ' + new Date().toLocaleString(),
        iconURL: 'https://cdn.discordapp.com/attachments/1228373519386284156/1399496074804203621/image.png?ex=6889de89&is=68888d09&hm=c86984bb3b932b1a58a09e426efcd674b6df66b6ac862bdafcb63815f2bb9e30&'
      })
      .setTimestamp();

    // plr
    embed.addFields({
      name: '👥 Player Commands',
      value: 
        '`/freeagent` - Register yourself as a free agent\n' +
        '• Select your position and region\n' +
        '• 24-hour cooldown between uses\n' +
        '• Cannot be used if already contracted\n\n' +

        '`/friendly` - Look for friendly matches\n' +
        '• Choose region and match type\n' +
        '• 10-minute cooldown between uses\n' +
        '• Upload image if "IN GAME ALREADY"\n\n' +

        '`/help` - Display this help menu\n' +
        '• Shows all available commands\n' +
        '• Displays different info for managers vs players',
      inline: false
    });

    // manager
    if (isManager) {
      const teamData = managers[user];
      embed.addFields({
        name: '👔 Manager Commands',
        value: 
          '`/contract @user` - Send a contract to a player\n' +
          '• Send contracts to free agents\n' +
          '• Players can accept or decline\n' +
          '• Cannot contract other managers or bots\n\n' +

          '`/scout [position] [message]` - Scout for players\n' +
          '• Post scouting messages for specific positions\n' +
          '• Include custom message describing what you need\n' +
          '• Shows your team info in the post\n' +
          '• 24-hour cooldown between uses\n\n' +

          '`/release @user` - Release a player from your team\n' +
          '• Release players contracted to your team\n' +
          '• Cannot release managers or uncontracted players\n' +
          '• Announces release in dedicated channel\n\n' +

          '`/forcerelease @user` - Force release a player *(Director+ Only)*\n' +
          '• Force releases a player from their team\n' +
          '• Bypasses manager restrictions\n' +
          '• Director command only\n\n' +

          '`/friendly` - Look for friendly matches\n' +
          '• Enhanced display with team info\n' +
          '• Pings additional manager roles\n' +
          '• Same functionality as player version',
        inline: false
      });

      embed.addFields({
        name: '🏆 Your Team',
        value: `${teamData.emoji} \`${teamData.team}\``,
        inline: true
      });
    } else {
      embed.addFields({
        name: '👔 Manager Commands',
        value: 
          '`/contract @user` - Send contracts to players *(Managers Only)*\n' +
          '`/scout [position] [message]` - Scout for players *(Managers Only)*\n' +
          '`/release @user` - Release players from team *(Managers Only)*\n' +
          '`/forcerelease @user` - Force release players *(Director+)*',
        inline: false
      });
    }

    // gen
    embed.addFields({
      name: '📍 Available Positions',
      value: 'GK, CB, CDM, CM, CAM, CF, ST',
      inline: true
    });

    embed.addFields({
      name: '🤝 Friendly Match Options',
      value: 'DM TO PLAY, IN GAME ALREADY',
      inline: true
    });

    embed.addFields({
      name: '🌍 Available Regions',
      value: 'GMT, BST, EST, CST, PST, UTC, WEST, EET, EEST, MSK, OTHER',
      inline: true
    });

    embed.addFields({
      name: '❓ Need Help?',
      value: 
        '• Free agents are posted in the transfer channel\n' +
        '• Managers can scout, contract, and release players\n' +
        '• Players must be released before joining new teams\n' +
        '• Transfer window must be open for most actions\n' +
        '• Friendly matches help teams practice and stay active\n' +
        '• Use image uploads to show your server when "IN GAME ALREADY"',
      inline: false
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};