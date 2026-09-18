function validateMongoUri(uri) {
  if (!uri) {
    return null;
  }

  let parsed;

  try {
    parsed = new URL(uri);
  } catch (error) {
    return `MongoDB URI is invalid: ${error.message}`;
  }

  if (parsed.protocol === 'mongodb+srv:' && parsed.port) {
    return 'MongoDB SRV URI cannot include a port. Remove :27017 (or any :port) from the hostname.';
  }

  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol)) {
    return 'MongoDB URI must start with mongodb:// or mongodb+srv://.';
  }

  return null;
}

module.exports = { validateMongoUri };