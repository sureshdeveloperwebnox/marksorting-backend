export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  s3: {
    folderName: process.env.FOLDER_NAME,
    bucketName: process.env.BUCKET_NAME,
    region: process.env.REGION,
    accessKey: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    baseUrl: process.env.S3_BASE_URL,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
  mail: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    user: process.env.SMTP_USER,
    pass: process.env.APP_PASSWORD,
    fromName: process.env.SMTP_FROM_NAME || 'Mark Sorting System',
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  whatsapp: {
    apiToken: process.env.ULTRAMSG_API_TOKEN,
    instanceId: process.env.ULTRAMSG_INSTANCE_ID,
    baseUrl: process.env.ULTRAMSG_BASE_URL || 'https://api.ultramsg.com',
    apiUrl: process.env.ULTRAMSG_API_URL,
    documentEndpoint: process.env.ULTRAMSG_DOCUMENT_ENDPOINT || '/messages/document',
    messageEndpoint: process.env.ULTRAMSG_MESSAGE_ENDPOINT || '/messages/chat',
  },
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672', 10),
    user: process.env.RABBITMQ_USER || 'admin',
    pass: process.env.RABBITMQ_PASS || 'admin',
    vhost: process.env.RABBITMQ_VHOST || '',
  },
});
