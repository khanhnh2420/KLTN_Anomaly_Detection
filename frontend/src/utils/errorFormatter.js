export function formatErrorMessage(err) {
  if (!err) {
    return "Unexpected error occurred.";
  }

  /**
   * Axios error
   */
  if (err.response) {
    const { status, data } = err.response;

    // Backend trả string
    if (typeof data === "string") {
      return data;
    }

    // Backend trả JSON
    if (typeof data === "object") {
      return (
        data.message ||
        data.error ||
        `Request failed with status ${status}`
      );
    }

    return `Request failed with status ${status}`;
  }

  /**
   * Network / timeout
   */
  if (err.request) {
    return "Unable to connect to server. Please check your network.";
  }

  /**
   * Normal JS Error
   */
  if (err instanceof Error) {
    return err.message;
  }

  /**
   * Fallback – stringify an toàn
   */
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error occurred.";
  }
}
