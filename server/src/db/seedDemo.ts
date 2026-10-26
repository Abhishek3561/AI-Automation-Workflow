import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const SQL = `
CREATE SCHEMA IF NOT EXISTS demo;
DROP TABLE IF EXISTS demo.orders;
DROP TABLE IF EXISTS demo.customers;

CREATE TABLE demo.customers (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  plan TEXT NOT NULL
);

CREATE TABLE demo.orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES demo.customers(id),
  product TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL,
  ordered_at DATE NOT NULL,
  shipped_at DATE,
  expected_delivery DATE NOT NULL,
  delay_reason TEXT
);

INSERT INTO demo.customers VALUES
  (1, 'Priya Sharma', 'priya@example.com', 'premium'),
  (2, 'Rahul Verma', 'rahul@example.com', 'standard'),
  (3, 'Ananya Iyer', 'ananya@example.com', 'premium');

INSERT INTO demo.orders VALUES
  (1001, 1, 'Wireless Earbuds', 79.99, 'delivered', '2026-10-01', '2026-10-02', '2026-10-06', NULL),
  (1002, 2, 'Laptop Stand', 45.00, 'delivered', '2026-10-03', '2026-10-04', '2026-10-08', NULL),
  (1003, 1, 'Mechanical Keyboard', 129.00, 'delayed', '2026-10-10', NULL, '2026-10-15', 'Supplier stock shortage, restock expected in 7 days'),
  (1004, 2, 'Phone Case', 15.50, 'shipped', '2026-10-20', '2026-10-21', '2026-10-26', NULL),
  (1005, 3, 'Monitor', 249.00, 'delayed', '2026-10-08', '2026-10-12', '2026-10-14', 'Carrier strike in the destination region'),
  (1006, 3, 'USB Cable', 9.99, 'delivered', '2026-10-05', '2026-10-06', '2026-10-10', NULL);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wf_reader') THEN
    CREATE ROLE wf_reader NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA demo TO wf_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA demo TO wf_reader;
`;

async function main() {
  const url = new URL(process.env.DATABASE_URL || "");
  url.search = "";
  const pool = new Pool({ connectionString: url.toString() });
  await pool.query(SQL);
  await pool.end();
  console.log("Demo data ready (schema: demo)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});