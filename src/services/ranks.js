const RANKS = {
  member: { label: 'Member', color: '#8fa3aa' },
  donator: { label: 'Donator', color: '#43c7df' },
  dev: { label: 'Dev', color: '#9800ff' },
  'vip++': { label: 'VIP++', color: '#24f14a' },
  'sr-admin': { label: 'Sr. Admin', color: '#ffd54d' },
  tester: { label: 'Tester', color: '#1021a8' },
  'vip+': { label: 'VIP+', color: '#27bd4e' },
  admin: { label: 'Admin', color: '#4aa9df' },
  trainee: { label: 'Trainee', color: '#9818d2' },
  vip: { label: 'VIP', color: '#3d9700' },
  overlord: { label: 'Overlord', color: '#c60000' },
  'co-owner': { label: 'Co-Owner', color: '#125364' },
  mvp: { label: 'MVP', color: '#ff8500' },
  'mvp+': { label: 'MVP+', color: '#ca6b00' },
  mod: { label: 'Mod', color: '#d63891' },
  owner: { label: 'Owner', color: '#3ab5d0' },
  'mvp++': { label: 'MVP++', color: '#874600' },
  'sr-mod': { label: 'Sr. Mod', color: '#570934' },
  gold: { label: 'Gold', color: '#ffd84f' },
  'gold+': { label: 'Gold+', color: '#ffc400' },
};

const BADGES = {
  'early-supporter': { label: 'Early Supporter Role', icon: '🌸' },
  'sakura-plus': { label: 'Sakura+', icon: '🌸' },
  'gold-plus': { label: 'Gold+', icon: '👑' },
  booster: { label: 'Booster', icon: '💠' },
};

function getRank(rank) {
  return RANKS[rank] || RANKS.member;
}

function normalizeRank(rank) {
  return RANKS[rank] ? rank : 'member';
}

function normalizeBadges(badges) {
  return Array.isArray(badges) ? badges.filter((badge) => BADGES[badge]) : [];
}

function getBadges(badges) {
  return normalizeBadges(badges).map((id) => ({ id, ...BADGES[id] }));
}

module.exports = { BADGES, RANKS, getBadges, getRank, normalizeBadges, normalizeRank };
