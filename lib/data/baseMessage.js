'use strict';

/**
 * Base class for Message objects with common utility methods
 *
 * Inherited by:
 *    - Message
 *    - TemplatedMessage
 */
class BaseMessage {
  // Safely base64 encodes a string, handling null and empty strings
  safeBase64Encode(text) {
    if (text === null || text === undefined || text === '') {
      return null;
    } else {
      return Buffer.from(text).toString('base64');
    }
  }

  // Parses an input to a boolean value, always returns a boolean value.
  parseBool(value) {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return String(value).trim().toLowerCase() === 'true';
  }
}
module.exports = BaseMessage;
