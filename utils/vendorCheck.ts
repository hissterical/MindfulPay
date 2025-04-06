/**
 * Utility to check if a UPI ID is in the blocklist
 */

// List of blacklisted UPI IDs
const BLACKLISTED_UPI_IDS = [
  'scammer@upi',           // Known scammer
  'fraud@paytm',           // Fraudulent account
  'phishing@ybl',          // Phishing attempt
  'malicious@okaxis',      // Malicious actor
  'suspicious@upi',        // Suspicious activity
  'blocked@paytm',         // Blocked by bank
  'reported@ybl',          // Reported by users
  'dangerous@okaxis',      // Dangerous transactions
  'risky@upi',             // High risk vendor
  'untrusted@paytm',       // Untrusted source
];

// Additional context for blacklisted vendors
const BLACKLISTED_VENDOR_INFO = {
  'scammer@upi': {
    reason: 'Multiple fraud reports',
    dateBlocked: '2023-01-15',
    reports: 42,
  },
  'fraud@paytm': {
    reason: 'Identity theft attempts',
    dateBlocked: '2023-02-20',
    reports: 28,
  },
  'phishing@ybl': {
    reason: 'Phishing website operator',
    dateBlocked: '2023-03-10',
    reports: 15,
  },
  'malicious@okaxis': {
    reason: 'Malware distribution',
    dateBlocked: '2023-04-05',
    reports: 33,
  },
  'suspicious@upi': {
    reason: 'Unusual transaction patterns',
    dateBlocked: '2023-05-12',
    reports: 19,
  },
  'blocked@paytm': {
    reason: 'Bank account frozen',
    dateBlocked: '2023-06-18',
    reports: 7,
  },
  'reported@ybl': {
    reason: 'Multiple user complaints',
    dateBlocked: '2023-07-22',
    reports: 24,
  },
  'dangerous@okaxis': {
    reason: 'High-risk transactions',
    dateBlocked: '2023-08-30',
    reports: 11,
  },
  'risky@upi': {
    reason: 'Suspicious business practices',
    dateBlocked: '2023-09-14',
    reports: 16,
  },
  'untrusted@paytm': {
    reason: 'Unverified business',
    dateBlocked: '2023-10-25',
    reports: 9,
  },
};

/**
 * Checks if a UPI ID is in the blocklist
 * @param upiId The UPI ID to check
 * @returns true if the UPI ID is blocked, false otherwise
 */
export const checkVendorBlocklist = (upiId: string): boolean => {
  return BLACKLISTED_UPI_IDS.includes(upiId.toLowerCase());
};

export const getVendorBlocklistInfo = (upiId: string) => {
  return BLACKLISTED_VENDOR_INFO[upiId.toLowerCase()] || null;
};