const { getAccountConnection } = require('./accountStore');

const COLLECTION_NAME = 'auditLogs';

async function getAuditCollection() {
  const connection = await getAccountConnection();
  const collection = connection.db.collection(COLLECTION_NAME);
  await collection.createIndex({ createdAt: -1 });
  await collection.createIndex({ actor: 1, createdAt: -1 });
  await collection.createIndex({ action: 1, createdAt: -1 });
  await collection.createIndex({ targetType: 1, targetId: 1, createdAt: -1 });
  return collection;
}

/**
 * Record an audit log entry
 * @param {Object} params
 * @param {string} params.actor - Username/admin who performed the action
 * @param {string} params.action - Action performed (e.g., 'balance.set', 'rank.assign', 'shop.create')
 * @param {string} params.targetType - Type of target (e.g., 'user', 'shopItem', 'rankKey')
 * @param {string} params.targetId - ID of target entity
 * @param {Object} params.details - Additional details (before/after values, etc.)
 * @param {string} params.ip - IP address of actor
 * @param {string} params.userAgent - User agent of actor
 */
async function recordAuditLog({ actor, action, targetType, targetId, details = {}, ip, userAgent }) {
  try {
    const collection = await getAuditCollection();
    await collection.insertOne({
      actor: String(actor || 'unknown').trim().toLowerCase(),
      action: String(action).trim(),
      targetType: String(targetType || '').trim(),
      targetId: String(targetId || '').trim(),
      details,
      ip: ip || null,
      userAgent: userAgent || null,
      createdAt: new Date(),
    });
  } catch (error) {
    // Audit logging should never break the main operation
    console.error('Audit log error:', error);
  }
}

/**
 * Get audit logs with filters
 */
async function getAuditLogs(options = {}) {
  const { actor, action, targetType, targetId, limit = 100, skip = 0, startDate, endDate } = options;
  const collection = await getAuditCollection();

  const query = {};
  if (actor) query.actor = actor;
  if (action) query.action = action;
  if (targetType) query.targetType = targetType;
  if (targetId) query.targetId = targetId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return collection.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}

module.exports = { recordAuditLog, getAuditLogs };