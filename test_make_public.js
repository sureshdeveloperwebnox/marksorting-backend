const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, PutObjectAclCommand, ObjectCannedACL } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const axios = require('axios');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const s3Client = new S3Client({
  region: env.REGION || 'blr1',
  endpoint: env.S3_BASE_URL || 'https://blr1.digitaloceanspaces.com',
  credentials: {
    accessKeyId: env.ACCESS_KEY,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

const bucketName = env.BUCKET_NAME || 'webnox';
const key = 'marksorting/test_make_public_debug_url.txt';

function extractKey(urlOrKey) {
  if (!urlOrKey) return '';
  if (!urlOrKey.startsWith('http')) return urlOrKey;
  try {
    const url = new URL(urlOrKey);
    let pathname = url.pathname;
    if (pathname.startsWith('/')) {
      pathname = pathname.substring(1);
    }
    if (pathname.startsWith(`${bucketName}/`)) {
      pathname = pathname.substring(bucketName.length + 1);
    }
    return pathname;
  } catch (err) {
    return urlOrKey;
  }
}

async function test() {
  const testFileBuffer = Buffer.from('test dynamic url public data ' + Date.now());

  // 1. Get presigned URL
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: 'text/plain',
  });
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  // 2. Upload WITHOUT any ACL header
  console.log('Uploading file...');
  await axios.put(uploadUrl, testFileBuffer, {
    headers: { 'Content-Type': 'text/plain' }
  });

  // Check CDN - should be private
  const viewUrlCDN = `https://${bucketName}.${env.REGION}.digitaloceanspaces.com/${key}`;
  try {
    await axios.get(viewUrlCDN + '?t=' + Date.now());
    console.log('Check before PutObjectAcl: Accessible! (Unexpected)');
  } catch (e) {
    console.log('Check before PutObjectAcl: Private (Expected 403):', e.response ? e.response.status : e.message);
  }

  // 3. Make public using full URL input
  const fullUrlInput = viewUrlCDN;
  const extracted = extractKey(fullUrlInput);
  console.log('Input URL:', fullUrlInput);
  console.log('Extracted key:', extracted);

  console.log('Running PutObjectAclCommand...');
  try {
    const aclCommand = new PutObjectAclCommand({
      Bucket: bucketName,
      Key: extracted,
      ACL: ObjectCannedACL.public_read,
    });
    await s3Client.send(aclCommand);
    console.log('PutObjectAclCommand succeeded!');
  } catch (err) {
    console.error('PutObjectAclCommand failed:', err.message);
  }

  // Check CDN again
  try {
    const res = await axios.get(viewUrlCDN + '?t=' + Date.now());
    console.log('Check after PutObjectAcl: Accessible! Content:', res.data);
  } catch (e) {
    console.log('Check after PutObjectAcl: FAILED:', e.response ? e.response.status : e.message);
  }
}

test().catch(console.error);
