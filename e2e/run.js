const E2eSetup = require('./e2e.setup');
const createAndSearch = require('./createAndSearch');

async function runTests() {
  // Setup test environment
  const setup = new E2eSetup();
  await setup.startup();

  let returnCode = 0;

  try {
    // Run tests
    await createAndSearch(setup.page, setup.providerUrl);
  }
  catch (er) {
    console.log(er);
    returnCode = 1;
  } finally {
    // Stop test environment
    await setup.stop();
    await process.exit(returnCode);
  }
}

runTests();
