const { Sequelize } = require('sequelize');
const config = require('./index');

const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL || process.env.POSTGRES_URL || config.databaseUrl;

console.log('[DB] Connecting with:', dbUrl ? `${dbUrl.substring(0, 15)}...` : 'individual vars');
console.log('[DB] Database URL starts with sqlite:', dbUrl && dbUrl.startsWith('sqlite:'));

let sequelize;

if (dbUrl && dbUrl.startsWith('sqlite:')) {
  // SQLite configuration for development
  const sqlitePath = dbUrl.replace('sqlite:', '');
  console.log('[DB] Using SQLite database at:', sqlitePath);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath === ':memory:' ? ':memory:' : sqlitePath,
    logging: config.nodeEnv === 'development' ? console.log : false,
  });
} else if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))) {
  try {
    const url = new URL(dbUrl);
    sequelize = new Sequelize(url.pathname.slice(1), url.username, decodeURIComponent(url.password), {
      host: url.hostname,
      port: url.port || 5432,
      dialect: 'postgres',
      logging: config.nodeEnv === 'development' ? console.log : false,
      dialectOptions: {
        ssl: config.nodeEnv === 'production' ? { require: true, rejectUnauthorized: false } : false
      },
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    });
  } catch (e) {
    console.error('[DB] Failed to parse DATABASE_URL:', e.message);
    console.error('[DB] Raw value starts with:', dbUrl.substring(0, 20));
    process.exit(1);
  }
} else {
  const pgHost = process.env.PGHOST || process.env.POSTGRES_HOST || 'localhost';
  const pgPort = process.env.PGPORT || process.env.POSTGRES_PORT || 5432;
  const pgUser = process.env.PGUSER || process.env.POSTGRES_USER || 'postgres';
  const pgPass = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || '';
  const pgDb = process.env.PGDATABASE || process.env.POSTGRES_DB || 'railway';

  console.log(`[DB] Using individual vars: ${pgUser}@${pgHost}:${pgPort}/${pgDb}`);

  sequelize = new Sequelize(pgDb, pgUser, pgPass, {
    host: pgHost,
    port: pgPort,
    dialect: 'postgres',
    logging: config.nodeEnv === 'development' ? console.log : false,
    dialectOptions: {
      ssl: config.nodeEnv === 'production' ? { require: true, rejectUnauthorized: false } : false
    },
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
}

module.exports = sequelize;
