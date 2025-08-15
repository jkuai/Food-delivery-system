// index.js
require('dotenv').config();           // load .env
const express    = require('express');
const oracledb   = require('oracledb');

const app = express();
app.use(express.json());

// Oracle connection pool
async function initDb() {
    await oracledb.createPool({
        user          : process.env.DB_USER,
        password      : process.env.DB_PASS,
        connectString : process.env.DB_CONNECT_STRING,
        poolMin       : 1,
        poolMax       : 5,
        poolIncrement : 1
    });
}
initDb().catch(err => {
    console.error('DB pool init failed:', err);
    process.exit(1);
});

// GET customer by ID
app.get('/api/customers/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid customer ID' });
    }
    let conn;
    try {
        conn = await oracledb.getConnection();
        const result = await conn.execute(
            `SELECT name FROM Customer WHERE id = :id`,
            { id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        // return the fetched name
        return res.json({ name: result.rows[0].NAME });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (_) {}
        }
    }
});

// POST new customer (signup)
app.post('/api/customers', async (req, res) => {
    const { id, name, point, streetNum, postalcode, unit, country } = req.body;
    let conn;
    try {
        conn = await oracledb.getConnection();
        // simple insert, adjust columns to match your DAO
        await conn.execute(
            `INSERT INTO Customer (id, name, point, "street#", postalcode, unit, country)
       VALUES (:id, :name, :point, :streetNum, :postalcode, :unit, :country)`,
            { id, name, point, streetNum, postalcode, unit, country },
            { autoCommit: true }
        );
        return res.status(201).json({ message: 'Customer inserted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Insert failed' });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (_) {}
        }
    }
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Node API listening on port ${PORT}`);
});
