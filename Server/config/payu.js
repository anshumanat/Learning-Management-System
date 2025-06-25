require("dotenv").config();
// PayU configuration for Node.js backend
const payuConfig = {
  merchantKey: process.env.PAYU_MERCHANT_KEY,
  merchantSalt: process.env.PAYU_MERCHANT_SALT,
  authHeader: process.env.PAYU_AUTH_HEADER, // For API calls if needed
  baseUrl: process.env.PAYU_BASE_URL || "https://test.payu.in", // or sandbox url
};

module.exports = payuConfig;