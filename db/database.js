const admin = require('firebase-admin');
const fs = require('fs');

if (process.env.FIREBASE_KEY_B64) {
  const buffer = Buffer.from(process.env.FIREBASE_KEY_B64, 'base64');
  fs.writeFileSync('firebase-key.json', buffer);
}

const serviceAccount = require('../firebase-key.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const contracts = db.collection('contracts');

module.exports = {
  getContractedTeam: async (userId) => {
    const doc = await contracts.doc(userId).get();
    return doc.exists ? doc.data() : null;
  },

  contractPlayer: async (userId, teamName, emoji) => {
    await contracts.doc(userId).set({ teamName, emoji });
  },

  releasePlayer: async (userId) => {
    await contracts.doc(userId).delete();
  }
};
