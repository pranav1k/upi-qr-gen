/**
 * UPI QR Code and Deep Link Utilities
 * Compliant with NPCI Unified Payments Interface Specifications.
 */

// UPI ID (VPA) pattern: username@handle
// Username: 2-256 characters (alphanumeric, dot, underscore, hyphen)
// Handle: 2-64 characters (alphanumeric, dot, hyphen)
export const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$/;

/**
 * Validates whether a given string is a valid UPI ID (VPA).
 * @param {string} upiId
 * @returns {boolean}
 */
export function isValidUpiId(upiId) {
  if (!upiId || typeof upiId !== 'string') return false;
  return UPI_ID_REGEX.test(upiId.trim());
}

/**
 * Validates an amount string or number.
 * Can be empty/null/undefined (allowed in UPI when payer enters amount).
 * If provided, must be a finite positive number.
 * @param {string|number|null|undefined} amount
 * @returns {{ valid: boolean, error?: string, value?: number }}
 */
export function validateAmount(amount) {
  if (amount === '' || amount === null || amount === undefined) {
    return { valid: true, value: undefined };
  }

  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).trim());

  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (num <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (num > 1000000) {
    return { valid: false, error: 'Amount exceeds maximum UPI limit (₹10,00,000)' };
  }

  return { valid: true, value: num };
}

/**
 * Builds a compliant UPI deep link URI (`upi://pay?...`).
 * Parameters are strictly encoded and stripped of undefined/empty values.
 *
 * @param {Object} options
 * @param {string} options.upiId - Payee VPA / UPI ID (required)
 * @param {string} options.name - Payee Name (required/recommended)
 * @param {string|number} [options.amount] - Payment amount (optional)
 * @param {string} [options.note] - Transaction note / remark (optional)
 * @param {string} [options.currency='INR'] - Currency code (default 'INR')
 * @param {string} [options.mc] - Merchant category code (optional)
 * @param {string} [options.tr] - Transaction reference ID (optional)
 * @returns {string} Fully encoded UPI deep link URI
 */
export function buildUpiUri({
  upiId,
  name,
  amount,
  note,
  currency = 'INR',
  mc,
  tr,
}) {
  if (!upiId || typeof upiId !== 'string' || !upiId.trim()) {
    throw new Error('UPI ID (pa) is required');
  }

  const trimmedUpi = upiId.trim();
  const params = [];

  // Payee Virtual Address (pa)
  params.push(`pa=${encodeURIComponent(trimmedUpi)}`);

  // Payee Name (pn)
  if (name && typeof name === 'string' && name.trim()) {
    params.push(`pn=${encodeURIComponent(name.trim())}`);
  }

  // Merchant Category Code (mc) - optional
  if (mc && typeof mc === 'string' && mc.trim()) {
    params.push(`mc=${encodeURIComponent(mc.trim())}`);
  }

  // Transaction Reference ID (tr) - optional
  if (tr && typeof tr === 'string' && tr.trim()) {
    params.push(`tr=${encodeURIComponent(tr.trim())}`);
  }

  // Transaction Note / Remarks (tn) - optional
  if (note && typeof note === 'string' && note.trim()) {
    params.push(`tn=${encodeURIComponent(note.trim())}`);
  }

  // Transaction Amount (am) - optional
  // If amount is not set or empty, DO NOT include `am` parameter so payer enters it
  if (amount !== undefined && amount !== null && amount !== '') {
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount).trim());
    if (!isNaN(num) && num > 0) {
      params.push(`am=${encodeURIComponent(num.toFixed(2))}`);
    }
  }

  // Currency (cu) - default 'INR'
  if (currency && typeof currency === 'string' && currency.trim()) {
    params.push(`cu=${encodeURIComponent(currency.trim())}`);
  }

  return `upi://pay?${params.join('&')}`;
}

/**
 * Parses an existing UPI deep link URI into its constituent parameters.
 * @param {string} uri
 * @returns {Object}
 */
export function parseUpiUri(uri) {
  if (!uri || !uri.startsWith('upi://pay?')) {
    throw new Error('Invalid UPI URI scheme');
  }

  const queryString = uri.replace('upi://pay?', '');
  const searchParams = new URLSearchParams(queryString);

  return {
    upiId: searchParams.get('pa') || '',
    name: searchParams.get('pn') || '',
    amount: searchParams.get('am') || '',
    currency: searchParams.get('cu') || 'INR',
    note: searchParams.get('tn') || '',
    mc: searchParams.get('mc') || '',
    tr: searchParams.get('tr') || '',
  };
}
