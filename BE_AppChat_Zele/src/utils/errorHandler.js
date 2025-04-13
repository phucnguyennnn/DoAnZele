const handleValidationError = (error) => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((val) => val.message);
    return messages.join(", ");
  }
  return error.message;
};

module.exports = handleValidationError;
