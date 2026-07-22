
/**
 * Format date/time in UTC
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date/time string
 */
export const formatDateTime = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'  // Force UTC timezone
    });
};

/**
 * Format date only in UTC
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    });
};

/**
 * Format time only in UTC
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
    });
};

// Default export for convenience
export default {
    formatDateTime,
    formatDate,
    formatTime
};