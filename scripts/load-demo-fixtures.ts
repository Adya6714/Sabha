import {
  loadAllDemoFixtures,
  loadFixtureIntoDb,
} from "@sabha/ledger";

async function main() {
  const fixtures = loadAllDemoFixtures();
  for (const fixture of fixtures) {
    const loaded = await loadFixtureIntoDb(fixture);
    console.log(
      `✓ ${fixture.id}: ${loaded.written.length} ledger rows, lane=${loaded.expectedLane}`,
    );
  }
  console.log(`Loaded ${fixtures.length} demo fixtures into Postgres.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
