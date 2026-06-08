const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, ObjectCannedACL } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const axios = require('axios');

// Load .env
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
const key = 'marksorting/test_debug_upload';

async function runTest() {
  console.log('Using endpoint:', env.S3_BASE_URL);
  console.log('Using bucket:', bucketName);
  
  const testFileBuffer = Buffer.from('test image data ' + Date.now());

  // Test 1: Generate presigned URL with ACL: 'public-read' but no signableHeaders
  console.log('\n--- Test 1: Presigned URL with ACL public_read, default signing ---');
  const command1 = new PutObjectCommand({
    Bucket: bucketName,
    Key: key + '_1.txt',
    ContentType: 'text/plain',
    ACL: ObjectCannedACL.public_read,
  });

  const uploadUrl1 = await getSignedUrl(s3Client, command1, { expiresIn: 900 });
  console.log('Generated URL 1:', uploadUrl1);

  // Attempt PUT upload without x-amz-acl header
  console.log('Uploading WITHOUT x-amz-acl header...');
  try {
    const res = await axios.put(uploadUrl1, testFileBuffer, {
      headers: { 'Content-Type': 'text/plain' }
    });
    console.log('Upload Status:', res.status);
    const viewUrlCDN = `https://${bucketName}.${env.REGION}.digitaloceanspaces.com/${key}_1.txt`;
    console.log('CDN URL:', viewUrlCDN);
    try {
      const checkRes = await axios.get(viewUrlCDN + '?t=' + Date.now());
      console.log('View CDN status:', checkRes.status, '(PUBLICLY ACCESSIBLE!)');
      console.log('Content:', checkRes.data);
    } catch (e) {
      console.log('View CDN failed:', e.response ? e.response.status : e.message, '(NOT ACCESSIBLE)');
    }
  } catch (err) {
    console.error('Upload 1 failed:', err.response ? err.response.status : err.message);
  }

  // Attempt PUT upload with x-amz-acl header
  console.log('\nUploading WITH x-amz-acl: public-read header...');
  try {
    const res = await axios.put(uploadUrl1, testFileBuffer, {
      headers: { 
        'Content-Type': 'text/plain',
        'x-amz-acl': 'public-read'
      }
    });
    console.log('Upload Status:', res.status);
    const viewUrlCDN = `https://${bucketName}.${env.REGION}.digitaloceanspaces.com/${key}_1.txt`;
    try {
      const checkRes = await axios.get(viewUrlCDN + '?t=' + Date.now());
      console.log('View CDN status:', checkRes.status, '(PUBLICLY ACCESSIBLE!)');
      console.log('Content:', checkRes.data);
    } catch (e) {
      console.log('View CDN failed:', e.response ? e.response.status : e.message, '(NOT ACCESSIBLE)');
    }
  } catch (err) {
    if (err.response) {
      console.error('Upload with header failed:', err.response.status, err.response.data);
    } else {
      console.error('Upload with header failed:', err.message);
    }
  }
}

runTest().catch(console.error);
