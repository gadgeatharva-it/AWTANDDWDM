export function getWelcomeStorageKey(user) {
  const id = user?.id || user?._id;
  const email = user?.email;
  const stable = id || email;
  if (!stable) return '';
  return `eventflow_seen_user_${stable}`;
}

export function hasSeenWelcome(user) {
  const key = getWelcomeStorageKey(user);
  if (!key) return false;
  return localStorage.getItem(key) === '1';
}

export function markSeenWelcome(user) {
  const key = getWelcomeStorageKey(user);
  if (!key) return;
  localStorage.setItem(key, '1');
}

export function getWelcomeSessionKey(user) {
  const id = user?.id || user?._id;
  const email = user?.email;
  const stable = id || email;
  if (!stable) return '';
  return `eventflow_auth_action_${stable}`;
}

export function setAuthAction(user, action) {
  const key = getWelcomeSessionKey(user);
  if (!key) return;
  sessionStorage.setItem(key, String(action));
}

export function consumeAuthAction(user) {
  const key = getWelcomeSessionKey(user);
  if (!key) return '';
  const value = sessionStorage.getItem(key) || '';
  sessionStorage.removeItem(key);
  return value;
}
