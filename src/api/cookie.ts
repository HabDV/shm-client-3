const COOKIE_NAME = 'session_id';
const COOKIE_DAYS = 3;

export function setCookie(value: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookie(): string | null {
  const name = COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export function removeCookie(): void {
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

export function extendCookie(): void {
  const value = getCookie();
  if (value) {
    setCookie(value);
  }
}

const PARTNER_COOKIE_NAME = 'partner_id';
const PARTNER_COOKIE_DAYS = 30;

export function setPartnerCookie(value: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + PARTNER_COOKIE_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${PARTNER_COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getPartnerCookie(): string | null {
  const name = PARTNER_COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export function removePartnerCookie(): void {
  document.cookie = `${PARTNER_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

// --- Invite link encoding (base64url) ---

export function encodeInvite(partnerId: string | number): string {
  const json = JSON.stringify({ pid: String(partnerId) });
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Validates that a partner ID contains only digits (1–20 chars)
function isValidPartnerId(pid: string): boolean {
  return /^\d{1,20}$/.test(pid);
}

export function decodeInvite(encoded: string): string | null {
  if (!encoded || encoded.length > 512) return null;
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(base64 + padding);
    const obj = JSON.parse(json);
    if (obj && typeof obj.pid === 'string' && isValidPartnerId(obj.pid)) {
      return obj.pid;
    }
    return null;
  } catch {
    return null;
  }
}

export function parseAndSavePartnerId(): void {
  const urlParams = new URLSearchParams(window.location.search);

  // New format: ?invite=<base64url>
  const invite = urlParams.get('invite');
  if (invite && invite.trim()) {
    const partnerId = decodeInvite(invite.trim());
    if (partnerId) {
      setPartnerCookie(partnerId);
    }
    urlParams.delete('invite');
    const newSearch = urlParams.toString();
    window.history.replaceState({}, '', window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash);
    return;
  }

  // Legacy format: ?partner_id=<id> (backward compatibility)
  const partnerId = urlParams.get('partner_id');
  if (partnerId && isValidPartnerId(partnerId.trim())) {
    setPartnerCookie(partnerId.trim());
    urlParams.delete('partner_id');
    const newSearch = urlParams.toString();
    window.history.replaceState({}, '', window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash);
  }
}

export function parseAndSaveSessionId(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  if (sessionId) {
    setCookie(sessionId);
    urlParams.delete('session_id');
    const newSearch = urlParams.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  }
}

const RESET_TOKEN_COOKIE_NAME = 'reset_token';
const RESET_TOKEN_COOKIE_MINUTES = 60;

export function setResetTokenCookie(value: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + RESET_TOKEN_COOKIE_MINUTES * 60 * 1000);
  document.cookie = `${RESET_TOKEN_COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getResetTokenCookie(): string | null {
  const name = RESET_TOKEN_COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export function removeResetTokenCookie(): void {
  document.cookie = `${RESET_TOKEN_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

export function parseAndSaveResetToken(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    setResetTokenCookie(token);
    urlParams.delete('token');
    const newSearch = urlParams.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
    return token;
  }
  return null;
}