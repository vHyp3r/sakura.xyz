const { ObjectId } = require('mongodb');
const { getAccountConnection } = require('./accountStore');

const PERIODS = new Set(['daily', 'weekly', 'monthly', 'seasonal', 'permanent']);
const MAX_ITEMS = 100;

function normalizeItem(input) {
  const name = String(input.name || '').trim().slice(0, 80);
  const type = String(input.type || '').trim().slice(0, 50);
  const period = String(input.period || 'weekly').trim().toLowerCase();
  const price = input.price === null || input.price === '' ? null : Number(input.price);
  const benefits = Array.isArray(input.benefits)
    ? input.benefits.map((benefit) => String(benefit).trim().slice(0, 120)).filter(Boolean).slice(0, 8)
    : [];

  if (!name || !type) throw new Error('Item name and type are required.');
  if (!PERIODS.has(period)) throw new Error('That shop rotation period is not supported.');
  if (price !== null && (!Number.isInteger(price) || price < 0)) {
    throw new Error('Shop item price must be a whole number or empty.');
  }

  return {
    name,
    type,
    period,
    price,
    icon: String(input.icon || '✦').trim().slice(0, 8) || '✦',
    color: /^#[0-9a-f]{6}$/i.test(String(input.color || '')) ? input.color : '#f4c2d7',
    benefits,
    active: input.active !== false,
    rotationLimit: Math.min(20, Math.max(1, Number(input.rotationLimit) || 3)),
  };
}

async function getCollection() {
  const collection = (await getAccountConnection()).db.collection('shopItems');
  await collection.createIndex({ active: 1, period: 1 });
  await collection.createIndex({ createdAt: -1 });
  return collection;
}

function hash(value) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  }
  return result >>> 0;
}

function periodKey(period, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now).map((part) => [part.type, part.value]));
  if (period === 'daily') return `${parts.year}-${parts.month}-${parts.day}`;
  if (period === 'monthly') return `${parts.year}-${parts.month}`;
  if (period === 'seasonal') return `${parts.year}-${parts.month}`;
  if (period === 'weekly') {
    const date = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);
    return `${parts.year}-W${String(Math.ceil((((date - new Date(Date.UTC(date.getUTCFullYear(), 0, 1))) / 86400000) + date.getUTCDay() + 1) / 7)).padStart(2, '0')}`;
  }
  return 'permanent';
}

function publicItem(item) {
  return {
    id: `catalog-${item._id.toString()}`,
    name: item.name,
    type: item.type,
    period: item.period,
    price: item.price,
    icon: item.icon,
    color: item.color,
    benefits: item.benefits,
  };
}

async function listShopItems({ activeOnly = false, limit = MAX_ITEMS } = {}) {
  const collection = await getCollection();
  const query = activeOnly ? { active: true } : {};
  const documents = await collection.find(query).sort({ createdAt: -1 }).limit(Math.min(MAX_ITEMS, Math.max(1, Number(limit) || MAX_ITEMS))).toArray();
  return documents.map((item) => ({ ...item, id: item._id.toString() }));
}

async function getPublicShopItems() {
  const items = await listShopItems({ activeOnly: true });
  const grouped = new Map();
  items.forEach((item) => {
    if (!grouped.has(item.period)) grouped.set(item.period, []);
    grouped.get(item.period).push(item);
  });
  return [...grouped.entries()].flatMap(([period, periodItems]) => {
    const seed = `${period}:${periodKey(period)}`;
    const limit = Math.min(periodItems.length, Math.max(...periodItems.map((item) => item.rotationLimit || 3)));
    return periodItems
      .sort((left, right) => hash(`${seed}:${left._id}`) - hash(`${seed}:${right._id}`))
      .slice(0, limit)
      .map(publicItem);
  });
}

async function createShopItem(input) {
  const collection = await getCollection();
  const item = normalizeItem(input);
  const result = await collection.insertOne({ ...item, createdAt: new Date(), updatedAt: new Date() });
  return { ...item, id: result.insertedId.toString() };
}

async function updateShopItem(id, input) {
  if (!ObjectId.isValid(id)) throw new Error('Shop item not found.');
  const collection = await getCollection();
  const item = normalizeItem(input);
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...item, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!result) throw new Error('Shop item not found.');
  return { ...result, id: result._id.toString() };
}

async function deleteShopItem(id) {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await getCollection()).deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

module.exports = {
  createShopItem,
  deleteShopItem,
  getPublicShopItems,
  listShopItems,
  updateShopItem,
};
