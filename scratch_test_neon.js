import dotenv from 'dotenv';
dotenv.config();

const connStrings = [
  process.env.DATABASE_URL
].filter(Boolean);

async function testAll() {
  for (const cs of connStrings) {
    console.log("Testing:", cs);
    const client = new Client({ connectionString: cs });
    try {
      await client.connect();
      const res = await client.query('SELECT count(*) FROM "User";');
      console.log("SUCCESS! User count:", res.rows[0]);
      await client.end();
      return;
    } catch (e) {
      console.error("FAILED:", e.message);
      try { await client.end(); } catch(_) {}
    }
  }
}

testAll();
