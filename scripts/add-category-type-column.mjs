import mysql from 'mysql2/promise';

const conn = await mysql.createConnection('mysql://root@localhost:3306/hub_parent');
const [rows] = await conn.execute(
  "SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_schema='hub_parent' AND table_name='categories' AND column_name='type'",
);
const exists = rows[0].cnt > 0;
console.log('Column type exists:', exists);
if (!exists) {
  await conn.execute("ALTER TABLE categories ADD COLUMN `type` VARCHAR(255) NOT NULL DEFAULT 'post'");
  console.log('Added type column');
} else {
  console.log('Column already exists, no action needed');
}
await conn.end();
