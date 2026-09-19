const { execSync } = require('child_process');
const fs = require('fs');

async function deployFirestoreRules() {
  try {
    console.log('🔑 Obtaining access token from gcloud...');
    const token = execSync('gcloud.cmd auth print-access-token', { encoding: 'utf8' }).trim();
    const projectId = 'smarttrading-51b72';
    const rulesContent = fs.readFileSync('firestore.rules', 'utf8');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-goog-user-project': projectId
    };

    console.log('📝 Creating new Ruleset on Firebase Rules API...');
    const createRulesetRes = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: {
          files: [
            {
              name: 'firestore.rules',
              content: rulesContent
            }
          ]
        }
      })
    });

    const rulesetData = await createRulesetRes.json();
    if (!createRulesetRes.ok) {
      console.error('Failed to create ruleset:', JSON.stringify(rulesetData, null, 2));
      process.exit(1);
    }
    console.log('✅ Created Ruleset:', rulesetData.name);

    console.log('🚀 Updating release to point to new ruleset...');
    const releaseName = `projects/${projectId}/releases/cloud.firestore`;
    const updateReleaseRes = await fetch(`https://firebaserules.googleapis.com/v1/${releaseName}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        release: {
          name: releaseName,
          rulesetName: rulesetData.name
        }
      })
    });

    const releaseData = await updateReleaseRes.json();
    if (!updateReleaseRes.ok) {
      console.log('Release patch failed, attempting POST create...');
      const createReleaseRes = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: releaseName,
          rulesetName: rulesetData.name
        })
      });
      const createData = await createReleaseRes.json();
      console.log('Release create response:', createData);
    } else {
      console.log('✅ Release updated successfully:', releaseData.name);
    }

    console.log('🎉 Firestore rules deployed successfully!');
  } catch (err) {
    console.error('Error deploying rules:', err);
    process.exit(1);
  }
}

deployFirestoreRules();
