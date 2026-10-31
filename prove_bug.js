const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('C:\\Users\\admin\\AppData\\Roaming\\electron-pos\\database.sqlite', sqlite3.OPEN_READONLY, (err) => {
  if (err) { console.log('ERROR:', err.message); return; }

  const menuQuery = `
  SELECT
    s.sub_id,
    s.order_menu_id,
    s.menu_qty,
    s.varient_id,
    v.variantName,
    f.ProductsID,
    f.ProductName,
    f.productvat,
    s.total_price,
    GROUP_CONCAT(a.add_on_id) AS add_on_ids,
    GROUP_CONCAT(a.add_on_name) AS add_on_names,
    GROUP_CONCAT(a.price) AS add_on_prices,
    s.adons_qty AS addonsqty
  FROM sub_order s

  LEFT JOIN item_foods f
    ON s.order_menu_id = f.ProductsID

  LEFT JOIN variant v
    ON s.varient_id = v.variantid

  LEFT JOIN add_ons a
    ON s.adons_id IS NOT NULL
    AND ',' || s.adons_id || ',' LIKE '%,' || a.add_on_id || ',%'

  WHERE s.order_id = ? AND s.status = 0

  GROUP BY s.sub_id
`;

  console.log('=== STEP 1: confirm sub_order row 120 exists for order 37, with integer order_id ===');
  db.all("SELECT sub_id, order_id, typeof(order_id) AS order_id_type, status FROM sub_order WHERE sub_id = 120", (e0, r0) => {
    console.log('Query: SELECT sub_id, order_id, typeof(order_id) AS order_id_type, status FROM sub_order WHERE sub_id = 120');
    console.log('Output:', JSON.stringify(r0, null, 2));

    console.log('\n=== STEP 2: run the EXACT current showsplitorder query, binding orderId AS STRING "37" (current behavior, req.params.id is always a string) ===');
    db.all(menuQuery, ["37"], (e1, r1) => {
      console.log('Param: ["37"] (string)');
      console.log('Output:', JSON.stringify(r1, null, 2));
      console.log('Row count:', r1.length, '<-- WRONG row (old legacy sub_id 36), not the real order');

      console.log('\n=== STEP 3: same exact query, binding parseInt("37",10) => 37 (number) ===');
      db.all(menuQuery, [parseInt("37", 10)], (e2, r2) => {
        console.log('Param: [37] (number, via parseInt)');
        console.log('Output:', JSON.stringify(r2, null, 2));
        console.log('Row count:', r2.length, '<-- correct row, sub_id 120, the real new order');

        console.log('\n=== STEP 4: a "clean" order with NO legacy collision, to show the true zero-row failure mode ===');
        db.all("SELECT order_id, COUNT(*) AS cnt FROM sub_order WHERE typeof(order_id) = 'integer' AND order_id NOT IN (SELECT order_id FROM sub_order WHERE typeof(order_id) = 'text') GROUP BY order_id ORDER BY order_id DESC LIMIT 1", (e3, r3) => {
          console.log('Clean candidate (integer order_id with no text-typed counterpart):', JSON.stringify(r3));
          const cleanOrderId = r3[0].order_id;

          db.all(menuQuery, [String(cleanOrderId)], (e4, r4) => {
            console.log(`\nRunning exact current query with orderId = "${cleanOrderId}" (string, current behavior):`);
            console.log('Output:', JSON.stringify(r4));
            console.log('Row count:', r4.length, '<-- zero rows, true failure mode (no collision to mask it)');

            db.all(menuQuery, [cleanOrderId], (e5, r5) => {
              console.log(`\nSame query with orderId = ${cleanOrderId} (number, via parseInt):`);
              console.log('Output:', JSON.stringify(r5, null, 2));
              console.log('Row count:', r5.length, '<-- correct, matches');
              db.close();
            });
          });
        });
      });
    });
  });
});
