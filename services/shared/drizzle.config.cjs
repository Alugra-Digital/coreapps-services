require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') });

module.exports = {
  dialect: 'postgresql',
  schema: './db/schema.js',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DB_URL,
  },
};
