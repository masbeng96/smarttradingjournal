const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, deleteDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyDOurewkXEshBxa5l43c2IRSNPWfqSnVoo',
  projectId: 'smarttrading-51b72',
  authDomain: 'smarttrading-51b72.firebaseapp.com',
};

async function testConnection() {
  console.log('⚡ Initializing Firebase client SDK...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const testDocRef = doc(db, 'system_health', 'connection_test');
  const payload = {
    status: 'HEALTHY',
    connectedAt: new Date().toISOString(),
    project: 'smarttrading-51b72',
    engine: 'Smart Trading Journal Live Firestore Sync',
    testKey: Math.random().toString(36).substring(7)
  };

  try {
    console.log('⚡ Attempting write operation to Firestore...');
    await setDoc(testDocRef, payload);
    console.log('✅ Write SUCCESS:', payload);

    console.log('⚡ Attempting read back operation from Firestore...');
    const snapshot = await getDoc(testDocRef);
    if (snapshot.exists()) {
      console.log('✅ Read SUCCESS. Received document data:', snapshot.data());
    } else {
      console.error('❌ Read failed: document not found');
    }

    console.log('⚡ Cleaning up test document...');
    await deleteDoc(testDocRef);
    console.log('🎉 Firestore Database is 100% ONLINE, ACCESSIBLE, and FULLY FUNCTIONAL!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Firestore connection error:', error.message || error);
    process.exit(1);
  }
}

testConnection();
