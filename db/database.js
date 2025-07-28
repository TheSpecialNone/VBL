const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/contracts.db');

db.run(`CREATE TABLE IF NOT EXISTS contracts (
  userId TEXT PRIMARY KEY,
  teamName TEXT,
  emoji TEXT
)`);

module.exports = {
  getContractedTeam: (userId, callback) => {
    db.get('SELECT teamName, emoji FROM contracts WHERE userId = ?', [userId], (err, row) => {
      callback(err, row);
    });
  },

  contractPlayer: (userId, teamName, emoji, callback) => {
    db.run('INSERT INTO contracts (userId, teamName, emoji) VALUES (?, ?, ?)', [userId, teamName, emoji], callback);
  },

  releasePlayer: (userId, callback) => {
    db.run('DELETE FROM contracts WHERE userId = ?', [userId], callback);
  }
};
