// Input sanitization utilities
import DOMPurify from "dompurify";

/**
 * Sanitize text input to prevent XSS attacks
 * Removes HTML tags and dangerous content
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== "string") return "";
  
  // Remove HTML tags and sanitize
  const sanitized = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  // Trim and limit length
  return sanitized.trim().slice(0, 100000); // 100KB max
};

/**
 * Sanitize transcript title
 */
export const sanitizeTitle = (title: string): string => {
  if (!title || typeof title !== "string") return "";
  
  const sanitized = DOMPurify.sanitize(title, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  // Limit title length
  return sanitized.trim().slice(0, 200);
};

/**
 * Sanitize search term
 */
export const sanitizeSearchTerm = (term: string): string => {
  if (!term || typeof term !== "string") return "";
  
  const sanitized = DOMPurify.sanitize(term, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  return sanitized.trim().slice(0, 500);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate user ID format (Firebase UID)
 */
export const isValidUserId = (userId: string): boolean => {
  if (!userId || typeof userId !== "string") return false;
  // Firebase UIDs are alphanumeric and typically 28 characters
  return /^[a-zA-Z0-9]{20,}$/.test(userId);
};

