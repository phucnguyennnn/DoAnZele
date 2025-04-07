// utils/response.js

const sendResponse = (res, statusCode, message, status, data = {}) => {
  return res.status(statusCode).json({
    status: status,
    message: message,
    data: data,
  });
};

module.exports = sendResponse;
