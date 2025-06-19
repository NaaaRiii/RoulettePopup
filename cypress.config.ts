import 'dotenv/config';
import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: "8voy5z",

  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      // デフォルトの環境変数
      PRODUCTION_URL: 'http://localhost:4000',
      MOCK_API: 'true'
    }
  },
});
