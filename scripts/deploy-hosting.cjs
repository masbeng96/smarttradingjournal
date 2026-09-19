const { execSync } = require('child_process');

try {
  console.log('🔑 Fetching gcloud access token...');
  const token = execSync('gcloud.cmd auth print-access-token', { encoding: 'utf8' }).trim();
  console.log('🚀 Deploying web app to Firebase Hosting (smarttrading-51b72)...');
  const result = execSync(
    `npx.cmd -y firebase-tools deploy --only hosting --token "${token}" --project smarttrading-51b72`,
    { encoding: 'utf8', stdio: 'inherit' }
  );
  console.log('🎉 Firebase Hosting deployment complete!');
} catch (err) {
  console.error('Deployment error:', err.message || err);
}
