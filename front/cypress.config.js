const { defineConfig } = require("cypress");

// Base URL can be overridden with the CYPRESS_BASE_URL environment variable,
// e.g. when running against an application deployed on Kubernetes:
//   CYPRESS_BASE_URL=http://frontend:80 npx cypress run --browser chrome
const baseUrl = process.env.CYPRESS_BASE_URL || "http://localhost:8082";

module.exports = defineConfig({
  screenshotOnRunFailure: false,
  video: false,

  e2e: {
    baseUrl,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },

  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
    specPattern: "**/*.cy.ts",
  },
});
