const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Use your Oracle XE credentials here:
const dbConfig = {
    user: 'ora_jkuai',            // !!replace with your Oracle username, "system" is my default
    password: 'a78296944',        //  !!replace with your Oracle password
    connectString: 'dbhost.students.cs.ubc.ca:1522/stu' // my local oracle xe database
};

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Utility: convert Oracle row keys to lower-case
function mapKeysToLower(row) {
    const mapped = {};
    Object.keys(row).forEach(k => mapped[k.toLowerCase()] = row[k]);
    return mapped;
}


//get orders from User
app.get('/api/orders/user/:custid', async (req, res) => {
    const cid = req.params.custid;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);

        const sql = `
            SELECT o.order_number,
                   o.cardnumber,
                   r.name                          AS rest_name,
                   SUM(i.price * oi.quantity)      AS total,
                   i.id                            AS item_id,
                   i.name                          AS item_name,
                   oi.quantity
            FROM   Order_2     o
                       JOIN Restaurant  r ON r.id = o.restid
                       JOIN Order_Item  oi ON oi.ordernum = o.order_number
                       JOIN Item        i  ON i.id = oi.itemid
            WHERE  o.custid = :cid
            GROUP  BY o.order_number, o.cardnumber, r.name,
                      i.id, i.name, oi.quantity
            ORDER  BY o.order_number`;


        const raw = await conn.execute(sql, { cid }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const rows = raw.rows.map(mapKeysToLower);
        const grouped = {};
        rows.forEach(row => {
            const num = row.order_number;
            if (!grouped[num]) {
                grouped[num] = {
                    order_number: num,
                    total: row.total,
                    restaurant: row.rest_name,
                    cardnumber: row.cardnumber,
                    items: []
                };
            }
            grouped[num].items.push({ name: row.item_name, quantity: row.quantity });
        });
        res.json(Object.values(grouped));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (conn) await conn.close();
    }
});


// GET /api/customers/list  – return {id, name} for all customers
app.get('/api/customers/list', async (req, res) => {
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const result = await conn.execute(
            `SELECT id, name FROM Customer ORDER BY id`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows.map(mapKeysToLower));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally { if (conn) await conn.close(); }
});


// GET /api/customers/:id (login/info)
app.get('/api/customers/:id', async (req, res) => {
    const id = req.params.id;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT * FROM CUSTOMER WHERE ID = :id`,
            [id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer ID does not exist' });
        }
        // convert to lower-case keys
        res.json(mapKeysToLower(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) await connection.close();
    }
});


// POST /api/customers (signup)
app.post('/api/customers', async (req, res) => {
    const {
        name,
        country,
        postalcode,
        province,
        city,
        streetNum,
        unit
    } = req.body;

    if (!name || !country || !postalcode || !province || !city || !streetNum || !unit) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // 1. Check Address_1
        const address1CheckSql = `SELECT 1 FROM Address_1 WHERE country = :country AND postalcode = :postalcode AND province = :province AND city = :city`;
        const address1CheckResult = await connection.execute(address1CheckSql, { country, postalcode, province, city });
        if (address1CheckResult.rows.length === 0) {
            const address1InsertSql = `INSERT INTO Address_1 (country, postalcode, province, city) VALUES (:country, :postalcode, :province, :city)`;
            await connection.execute(address1InsertSql, { country, postalcode, province, city }, { autoCommit: false });
        }

        // 2. Check Address_2
        const address2CheckSql = `SELECT 1 FROM Address_2 WHERE street_num = :street_num AND postalcode = :postalcode AND unit = :unit AND country = :country`;
        const address2CheckResult = await connection.execute(address2CheckSql, { street_num: streetNum, postalcode, unit, country });
        if (address2CheckResult.rows.length === 0) {
            const address2InsertSql = `INSERT INTO Address_2 (street_num, postalcode, unit, country) VALUES (:street_num, :postalcode, :unit, :country)`;
            await connection.execute(address2InsertSql, { street_num: streetNum, postalcode, unit, country }, { autoCommit: false });
        }

        // 3. Check if Customer already exists (full address match)
        const custCheckSql = `SELECT 1 FROM Customer WHERE name = :name AND street_num = :street_num AND postalcode = :postalcode AND unit = :unit AND country = :country`;
        const custCheckResult = await connection.execute(
            custCheckSql,
            { name, street_num: streetNum, postalcode, unit, country }
        );
        if (custCheckResult.rows.length > 0) {
            await connection.rollback();
            return res.status(409).json({ error: 'User already exists' });
        }

        // 4. Generate unique customer id
        let id;
        let found = false;
        for (let i = 0; i < 1000; i++) {
            id = Math.floor(Math.random() * 90000) + 10000; // 5 digit
            const checkSql = `SELECT 1 FROM Customer WHERE id = :id`;
            const checkResult = await connection.execute(checkSql, { id });
            if (checkResult.rows.length === 0) {
                found = true;
                break;
            }
        }
        if (!found) {
            await connection.rollback();
            return res.status(500).json({ error: 'No available ID' });
        }

        // 5. Insert into Customer
        const insertCustomerSql = `INSERT INTO Customer (id, name, point, street_num, postalcode, unit, country) VALUES (:id, :name, :point, :street_num, :postalcode, :unit, :country)`;
        await connection.execute(
            insertCustomerSql,
            {
                id,
                name,
                point: 0,
                street_num: streetNum,
                postalcode,
                unit,
                country
            }
        );
        await connection.commit();

        res.status(201).json({ message: 'Signup successful', id });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) await connection.close();
    }
});




// GET /api/restaurants/:id/items
app.get('/api/restaurants/:id/items', async (req, res) => {
    const id = req.params.id;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id, name, price FROM Item WHERE restid = :id ORDER BY id`,
            [id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows.map(mapKeysToLower));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) await connection.close();
    }
});



const BEST_SQL_CORE = `
    SELECT r.id, r.name, AVG(TO_NUMBER(rv.rating)) AS avg_rating
    FROM   Restaurant r
           JOIN Review rv ON r.id = rv.restid
    GROUP  BY r.id, r.name
    HAVING AVG(TO_NUMBER(rv.rating)) >= :min
`;


// GET /api/restaurants/best/:min – restaurants with AVG(rating) ≥ min
app.get('/api/restaurants/best/:min', async (req, res) => {
    const min = Number(req.params.min);
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const sql = `${BEST_SQL_CORE} ORDER BY avg_rating DESC`;
        const result = await conn.execute(sql, [min], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows.map(mapKeysToLower));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (conn) await conn.close();
    }
});

// GET count of restaurants with AVG(rating) ≥ min
app.get('/api/restaurants/bestcount/:min', async (req, res) => {
    const min = Number(req.params.min);
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const sql = `SELECT COUNT(*) AS cnt FROM (${BEST_SQL_CORE})`;
        const result = await conn.execute(sql, [min], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(mapKeysToLower(result.rows[0]));   // { cnt: N }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (conn) await conn.close();
    }
});


// add reviews
app.post('/api/reviews', async (req, res) => {
    const { custid, restid, rating } = req.body;
    if (![0,1,2,3,4,5].includes(Number(rating))) {
        return res.status(400).json({ error: 'Rating must be 0-5' });
    }
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const nextIdSql = `SELECT NVL(MAX(review#),100) + 1 AS nid FROM Review`;
        const { rows } = await conn.execute(nextIdSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const nid = rows[0].NID;
        await conn.execute(
            `INSERT INTO Review (review#, rating, custid, restid) VALUES (:id, :rating, :cust, :rest)`,
            { id: nid, rating, cust: custid, rest: restid },
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Review added', id: nid });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (conn) await conn.close();
    }
});

//  GET reviews for a user
app.get('/api/reviews/user/:custid', async (req, res) => {
    const custid = req.params.custid;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const sql = `
            SELECT rv.review#   AS review_id,
                   rv.rating    AS rating,
                   r.name       AS rest_name
            FROM   Review rv
            JOIN   Restaurant r ON r.id = rv.restid
            WHERE  rv.custid = :cust
            ORDER  BY rv.review#`;
        const result = await conn.execute(sql, { cust: custid }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows.map(mapKeysToLower));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally { if (conn) await conn.close(); }
});

// DELETE review by id
app.delete('/api/reviews/:id', async (req, res) => {
    const id = req.params.id;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const del = await conn.execute(
            `DELETE FROM Review WHERE review# = :id`,
            { id },
            { autoCommit: true }
        );
        if (del.rowsAffected === 0) return res.status(404).json({ error: 'Review not found' });
        res.json({ message: 'Review deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally { if (conn) await conn.close(); }
});




// GET all saved cards for a customer
app.get('/api/payments/user/:custid', async (req, res) => {
    const custid = req.params.custid;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const sql = `
            SELECT cardnumber,
                   TO_CHAR(expireddate, 'YYYY-MM-DD') AS expireddate
            FROM   Payment
            WHERE  custid = :cust
            ORDER BY cardnumber`;
        const result = await conn.execute(sql, { cust: custid }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows.map(mapKeysToLower));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (conn) await conn.close();
    }
});

// POST /api/payments  – insert or update by card number
app.post('/api/payments', async (req, res) => {
    const { custid, card, expDate, cvv } = req.body;
    if (!custid || !card || !expDate || !cvv) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);

        // check if card already exists
        const chk = await conn.execute(
            `SELECT 1 FROM Payment WHERE cardnumber = :card`,
            { card },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (chk.rows.length > 0) {
            // update existing record
            await conn.execute(
                `UPDATE Payment
                 SET custid = :cust, expireddate = TO_DATE(:exp,'YYYY-MM-DD'), cvv = :cvv
                 WHERE cardnumber = :card`,
                { cust: custid, exp: expDate, cvv, card },
                { autoCommit: true }
            );
        } else {
            // insert new record
            await conn.execute(
                `INSERT INTO Payment (cardnumber, expireddate, cvv, custid)
                 VALUES (:card, TO_DATE(:exp,'YYYY-MM-DD'), :cvv, :cust)`,
                { card, exp: expDate, cvv, cust: custid },
                { autoCommit: true }
            );
        }
        res.json({ message: 'Saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally { if (conn) await conn.close(); }
});

// GET custid by card number
app.get('/api/payments/card/:cardnumber', async (req, res) => {
    const card = req.params.cardnumber;
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const sql = `SELECT custid FROM Payment WHERE cardnumber = :card`;
        const result = await conn.execute(sql, { card }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }
        res.json(mapKeysToLower(result.rows[0]));   // { custid: ... }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally { if (conn) await conn.close(); }
});

// POST /api/checkout – create Order_1, Order_2, OrderItem rows
app.post('/api/checkout', async (req, res) => {
    const { custid, card, items } = req.body;           // items: [{id,name,price}]
    if (!custid || !card || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Missing data' });
    }

    // simple pricing: subtotal = sum price, amountsaved = 0
    const subtotal     = items.reduce((s,i)=>s+Number(i.price),0);
    const amountsaved  = 0;
    const total        = subtotal - amountsaved;

    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);

        // 1. insert into Order_1
        await conn.execute(
            `INSERT INTO Order_1 (subtotal, amountsaved, total)
             VALUES (:sub, :save, :tot)`,
            { sub: subtotal, save: amountsaved, tot: total }
        );

        // 2. generate new order number
        const { rows } = await conn.execute(
            `SELECT NVL(MAX(order_number),1000) + 1 AS newnum FROM Order_2`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const orderNum = rows[0].NEWNUM;

        // choose first item's restid (simplest case)
        const restidRow = await conn.execute(
            `SELECT restid FROM Item WHERE id = :id`,
            { id: items[0].id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const restid = restidRow.rows.length ? restidRow.rows[0].RESTID : null;

        // 3. insert into Order_2
        await conn.execute(
            `INSERT INTO Order_2
             (order_number, subtotal, amountsaved, custid, restid, driveid, cardnumber)
             VALUES (:num, :sub, :save, :cid, :rid, NULL, :card)`,
            { num: orderNum, sub: subtotal, save: amountsaved,
                cid: custid, rid: restid, card: card },
            { autoCommit: false }
        );


        // 4. insert every item into OrderItem (order#, itemid)
        for (const it of items) {
            await conn.execute(
                `MERGE INTO Order_Item oi
                 USING (SELECT :num AS onum, :iid AS iid FROM dual) src
                 ON (oi.ordernum = src.onum AND oi.itemid = src.iid)
                 WHEN MATCHED THEN
                     UPDATE SET quantity = quantity + 1
                 WHEN NOT MATCHED THEN
                     INSERT (ordernum, itemid, quantity)
                     VALUES (src.onum, src.iid, 1)`,
                { num: orderNum, iid: it.id }
            );
        }



        await conn.commit();
        res.status(201).json({ message: 'Order placed', orderNum });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally { if (conn) await conn.close(); }
});


// GET customers who have reviewed every restaurant
app.get('/api/reviews/good', async (req, res) => {
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const sql = `
            SELECT c.id, c.name
            FROM   Customer c
            WHERE  NOT EXISTS (
                      SELECT r.id
                      FROM   Restaurant r
                      MINUS
                      SELECT v.restid
                      FROM   Review v
                      WHERE  v.custid = c.id
                  )
            ORDER  BY c.id`;
        const result = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows.map(mapKeysToLower));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (conn) await conn.close();
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
