const { Pool } = require("pg");
require("dotenv").config({ path: "apps/web/.env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool
	.query(
		`select "products"."id", "products"."name", "products"."description", "products"."price", "products"."in_stock", "products"."user_uid", "products"."category", "products"."hsn", "products"."taxable", "products"."barcode", "products"."sku", "products"."unit", "products"."created_at", "products_productBatches"."data" as "productBatches" from "products" "products" left join lateral (select coalesce(json_agg(json_build_array("products_productBatches"."id", "products_productBatches"."product_id", "products_productBatches"."batch_number", "products_productBatches"."quantity", "products_productBatches"."mrp", "products_productBatches"."selling_price", "products_productBatches"."purchase_price", "products_productBatches"."expiry_date", "products_productBatches"."manufacture_date", "products_productBatches"."location", "products_productBatches"."warehouse_id", "products_productBatches"."created_at")), '[]'::json) as "data" from "product_batches" "products_productBatches" where "products_productBatches"."product_id" = "products"."id") "products_productBatches" on true`,
	)
	.then((res) => {
		console.log("Success", res.rows.length);
		pool.end();
	})
	.catch((err) => {
		console.error("Error", err.message);
		pool.end();
	});
