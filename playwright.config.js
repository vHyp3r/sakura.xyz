/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  timeout: 120000,
  retries: 0,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  },
};
