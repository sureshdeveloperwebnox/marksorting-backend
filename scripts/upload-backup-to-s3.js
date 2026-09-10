/**
 * DigitalOcean Spaces / S3 Backup Uploader
 * 
 * Uploads compressed database backups to DigitalOcean Spaces S3 bucket
 * and logs the public/presigned URI.
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// 1. Resolve .env
const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
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

const region = process.env.REGION || env.REGION || 'blr1';
const bucketName = process.env.BUCKET_NAME || env.BUCKET_NAME || 'webnox';
const endpoint = process.env.S3_BASE_URL || env.S3_BASE_URL || 'https://blr1.digitaloceanspaces.com';
const accessKeyId = process.env.ACCESS_KEY || env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY || env.SECRET_ACCESS_KEY;
const folderName = process.env.FOLDER_NAME || env.FOLDER_NAME || 'marksorting';

async function uploadToS3(filePath, manifest = null) {
  if (!accessKeyId || !secretAccessKey) {
    console.warn('Skipping S3 upload: ACCESS_KEY or SECRET_ACCESS_KEY not configured.');
    return null;
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist at: ${filePath}`);
  }

  const s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: false,
  });

  const fileName = path.basename(filePath);
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const s3Key = `${folderName}/backups/${yearMonth}/${fileName}`;

  console.log(`\nUploading backup to DigitalOcean Spaces...`);
  console.log(`Target Bucket: ${bucketName}`);
  console.log(`Target Key   : ${s3Key}`);

  const fileStream = fs.createReadStream(filePath);
  const uploadCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: fileStream,
    ContentType: fileName.endsWith('.gz') ? 'application/gzip' : 'application/sql',
    Metadata: manifest ? {
      'table-count': String(manifest.tableCount || ''),
      'sha256': String(manifest.sha256Checksum || ''),
      'timestamp': String(manifest.timestamp || ''),
    } : {},
  });

  await s3Client.send(uploadCommand);
  console.log(`Successfully uploaded ${fileName} to DigitalOcean Spaces!`);

  // Also upload manifest if available
  if (manifest) {
    const manifestKey = `${folderName}/backups/${yearMonth}/manifest_${fileName.replace(/\.sql(\.gz)?$/, '')}.json`;
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: manifestKey,
      Body: JSON.stringify(manifest, null, 2),
      ContentType: 'application/json',
    }));
    console.log(`Manifest uploaded: ${manifestKey}`);
  }

  return { bucketName, s3Key };
}

if (require.main === module) {
  const targetFile = process.argv[2];
  if (!targetFile) {
    console.log('Usage: node upload-backup-to-s3.js <path-to-backup-file>');
    process.exit(1);
  }
  uploadToS3(path.resolve(process.cwd(), targetFile))
    .catch(err => {
      console.error('Upload failed:', err);
      process.exit(1);
    });
}

module.exports = { uploadToS3 };
