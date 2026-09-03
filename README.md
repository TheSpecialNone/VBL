# VBL

This is a Discord bot I built to run my own ro-soccer league, and I decided to make it public so other people running ro-soccer leagues can use it too.

## What it does

It handles the front office stuff so you don't have to do it all manually in a spreadsheet. Sign players, cut them, run free agency, track stats, all through Discord commands.

## Commands

**Team management**
| Command | What it does |
|---|---|
| `contract` | Sign a player for your team |
| `emergency` | Emergency sign a player for your team |
| `freeagent` | Allows you to post yourself in agency |
| `release` | Release a player from a team |
| `forcerelease` | Admin override to release a player without team approval |
| `showteam` | Display a team's current roster |
| `scout` | Allows manager to post what positions they need |

**League ops**
| Command | What it does |
|---|---|
| `leaderboard` | Show current top chatters |
| `vblstats` | Shows how many coins you have and levels for chatting |
| `resetstats` | Wipes a users stats |
| `friendly` | Pings for a friendly in dedicated channel |
| `announce` | Push an announcement to the announcements channel |

**Admin & utility**
| Command | What it does |
|---|---|
| `autorole` | Auto-assign roles based on what team players are in database |
| `help` | List commands and how to use them |

## Project structure

```
commands/       every slash/prefix command the bot supports
db/             database + contract storage
  contracts.db
  database.js
utils/
  managers.js   shared helper logic
```

## Getting started

1. Clone the repo
   ```bash
   git clone https://github.com/<your-org>/VBL.git
   cd VBL
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Set up your environment variables (bot token, database path, etc.) in a `.env` file
4. Run the bot
   ```bash
   node index.js
   ```

## Contributing

Found a bug or have an idea for a command? Open an issue or send a PR. Keep commands in their own file under `commands/` and reuse helpers from `utils/managers.js` where you can.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Used by asapmonty0 in Pure Soccer League as well as my own Volta Blox League, amassing over 1 million hours of playtime!

---

Built for my own league first, sharing it in case it helps other ro-soccer league runners out.
