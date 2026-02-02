/**
 * Email Validation Function
 *
 * Uses regex to validate email addresses according to common standards.
 * Handles plus addressing, subdomains, and various TLDs.
 */

/**
 * Validates an email address format.
 *
 * Regex breakdown:
 * ^                    - Start of string
 * [a-zA-Z0-9]          - Must start with alphanumeric
 * [a-zA-Z0-9._%+-]*    - Followed by valid local chars (no consecutive dots enforced separately)
 * @                    - Required @ symbol
 * [a-zA-Z0-9]          - Domain must start with alphanumeric
 * [a-zA-Z0-9.-]*       - Domain can contain dots/hyphens
 * [a-zA-Z0-9]          - Domain must end with alphanumeric
 * \.                   - Required dot before TLD
 * [a-zA-Z]{2,}         - TLD must be at least 2 letters
 * $                    - End of string
 *
 * @param email Email address to check
 * @returns True if the given email address is valid email
 */
export function isValidEmail(email: string): boolean {
  // Quick sanity checks
  if (!email || typeof email !== "string") {
    return false;
  }

  // Check for spaces (not allowed anywhere)
  if (email.includes(" ")) {
    return false;
  }

  // Check for consecutive dots (not allowed)
  if (email.includes("..")) {
    return false;
  }

  // Main email regex pattern
  const emailRegex =
    /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;

  // Handle edge case: single-char domain (e.g., user@a.com needs adjustment)
  const singleCharDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;

  return emailRegex.test(email) || singleCharDomainRegex.test(email);
}
