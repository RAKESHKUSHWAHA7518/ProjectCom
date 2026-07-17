import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

export const getHealth = (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  if (isConnected) {
    return res.status(200).json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      db: 'connected',
      version,
    });
  }

  return res.status(503).json({
    status: 'error',
    db: 'disconnected',
    version,
  });
};
