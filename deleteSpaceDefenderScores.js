const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Replace with the path to your service account key

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteSpaceDefenderScores() {
    const collectionRef = db.collection('highscores');
    const query = collectionRef.where('game', '==', 'SpaceDefender');
    
    try {
        const snapshot = await query.get();
        if (snapshot.empty) {
            console.log('No matching documents.');
            return;
        }

        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log('Successfully deleted SpaceDefender high scores.');
    } catch (error) {
        console.error('Error deleting documents: ', error);
    }
}

deleteSpaceDefenderScores();
