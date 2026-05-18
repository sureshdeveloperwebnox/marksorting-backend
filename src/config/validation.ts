import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  FOLDER_NAME: Joi.string().required(),
  BUCKET_NAME: Joi.string().required(),
  REGION: Joi.string().required(),
  ACCESS_KEY: Joi.string().required(),
  SECRET_ACCESS_KEY: Joi.string().required(),
  S3_BASE_URL: Joi.string().uri().required(),
});
