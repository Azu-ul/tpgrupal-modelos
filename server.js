const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'resto_db'
});

db.connect(err => {
    if (err) throw err;
    console.log('Conectado a MySQL');
});

// Personal
app.get('/api/personal', (req, res) => {
    db.query('SELECT * FROM personal', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/api/personal', (req, res) => {
    const { nombre, rol } = req.body;
    db.query('INSERT INTO personal (nombre, rol) VALUES (?, ?)', [nombre, rol], (err, result) => {
        if (err) {
            res.status(400).json({ error: 'Error al agregar personal' });
            return;
        }
        res.json({ id: result.insertId, nombre, rol });
    });
});

app.put('/api/personal/:id', (req, res) => {
    const { nombre, rol } = req.body;
    db.query('UPDATE personal SET nombre = ?, rol = ? WHERE id = ?', [nombre, rol, req.params.id], (err) => {
        if (err) return res.status(400).json({ error: 'Error al actualizar' });
        res.json({ success: true });
    });
});

app.delete('/api/personal/:id', (req, res) => {
    db.query('DELETE FROM personal WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(400).json({ error: 'No se puede eliminar, tiene relaciones' });
        res.json({ success: true });
    });
});

// Mesas
app.get('/api/mesas', (req, res) => {
    db.query(`SELECT m.*, p.nombre as mozo_nombre 
              FROM mesas m 
              LEFT JOIN personal p ON m.mozo_id = p.id`, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/api/mesas', (req, res) => {
    const { numero, capacidad } = req.body;
    db.query('INSERT INTO mesas (numero, capacidad) VALUES (?, ?)', [numero, capacidad], (err, result) => {
        if (err) {
            res.status(400).json({ error: 'Mesa ya existe o error en BD' });
            return;
        }
        res.json({ id: result.insertId, numero, capacidad });
    });
});

app.put('/api/mesas/:id/asignar', (req, res) => {
    const { mozo_id } = req.body;
    db.query('UPDATE mesas SET mozo_id = ? WHERE id = ?', [mozo_id, req.params.id], (err) => {
        if (err) throw err;
        res.json({ success: true });
    });
});

app.put('/api/mesas/:id', (req, res) => {
    const { numero, capacidad } = req.body;
    db.query('UPDATE mesas SET numero = ?, capacidad = ? WHERE id = ?', [numero, capacidad, req.params.id], (err) => {
        if (err) return res.status(400).json({ error: 'Número duplicado o error' });
        res.json({ success: true });
    });
});

app.delete('/api/mesas/:id', (req, res) => {
    db.query('DELETE FROM mesas WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(400).json({ error: 'No se puede eliminar, tiene pedidos asociados' });
        res.json({ success: true });
    });
});

// Menú
app.get('/api/menu', (req, res) => {
    db.query('SELECT * FROM menu ORDER BY categoria, nombre', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/api/menu', (req, res) => {
    const { nombre, precio, categoria } = req.body;
    db.query('INSERT INTO menu (nombre, precio, categoria) VALUES (?, ?, ?)', [nombre, precio, categoria], (err, result) => {
        if (err) {
            res.status(400).json({ error: 'Error al agregar menú' });
            return;
        }
        res.json({ id: result.insertId, nombre, precio, categoria });
    });
});

app.put('/api/menu/:id', (req, res) => {
    const { nombre, precio, categoria } = req.body;
    db.query('UPDATE menu SET nombre = ?, precio = ?, categoria = ? WHERE id = ?',
        [nombre, precio, categoria, req.params.id], (err) => {
            if (err) return res.status(400).json({ error: 'Error al actualizar' });
            res.json({ success: true });
        });
});

app.delete('/api/menu/:id', (req, res) => {
    db.query('DELETE FROM menu WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(400).json({ error: 'No se puede eliminar, está en pedidos' });
        res.json({ success: true });
    });
});

// Pedidos
app.get('/api/pedidos', (req, res) => {
    const query = `
    SELECT p.*, m.numero as mesa_numero, per.nombre as mozo_nombre,
           c.nombre as cocinero_nombre, ch.nombre as chef_nombre
    FROM pedidos p
    JOIN mesas m ON p.mesa_id = m.id
    JOIN personal per ON p.mozo_id = per.id
    LEFT JOIN personal c ON p.cocinero_id = c.id
    LEFT JOIN personal ch ON p.chef_id = ch.id
    ORDER BY p.fecha DESC
`;
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.get('/api/pedidos/:id/items', (req, res) => {
    const query = `
        SELECT pi.*, m.nombre, m.categoria
        FROM pedido_items pi
        JOIN menu m ON pi.menu_id = m.id
        WHERE pi.pedido_id = ?
    `;
    db.query(query, [req.params.id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/api/pedidos', (req, res) => {
    const { mesa_id, mozo_id, items, cocinero_id, chef_id } = req.body;
    const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // Obtener el chef_id del usuario actual si no se proporciona
    const finalChefId = chef_id || mozo_id; // Usa mozo_id como fallback

    db.query('INSERT INTO pedidos (mesa_id, mozo_id, total, cocinero_id, chef_id) VALUES (?, ?, ?, ?, ?)',
        [mesa_id, mozo_id, total, cocinero_id || null, finalChefId], (err, result) => {
            if (err) throw err;
            const pedido_id = result.insertId;

            items.forEach(item => {
                db.query('INSERT INTO pedido_items (pedido_id, menu_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                    [pedido_id, item.menu_id, item.cantidad, item.precio]);
            });

            res.json({ id: pedido_id, total });
        });
});

app.put('/api/pedidos/:id/asignar-cocinero', (req, res) => {
    const { cocinero_id, chef_id } = req.body;
    db.query('UPDATE pedidos SET cocinero_id = ?, chef_id = ?, estado = ? WHERE id = ?',
        [cocinero_id, chef_id || null, 'asignado', req.params.id], (err) => {
            if (err) throw err;
            res.json({ success: true });
        });
});

app.put('/api/pedidos/:id/estado', (req, res) => {
    const { estado } = req.body;
    db.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, req.params.id], (err) => {
        if (err) throw err;
        res.json({ success: true });
    });
});

// Reportes
app.get('/api/reportes/top-menu', (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    const query = `
        SELECT m.nombre, m.categoria, SUM(pi.cantidad) as total_vendido, 
               SUM(pi.cantidad * pi.precio_unitario) as ingresos
        FROM pedido_items pi
        JOIN menu m ON pi.menu_id = m.id
        JOIN pedidos p ON pi.pedido_id = p.id
        WHERE DATE(p.fecha) BETWEEN ? AND ?
        GROUP BY m.id
        ORDER BY total_vendido DESC
        LIMIT 5
    `;
    db.query(query, [fecha_inicio, fecha_fin], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

app.get('/api/reportes/ventas', (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    const query = `
        SELECT SUM(total) as total_ventas, COUNT(*) as total_pedidos
        FROM pedidos
        WHERE DATE(fecha) BETWEEN ? AND ? AND estado = 'pagado'
    `;
    db.query(query, [fecha_inicio, fecha_fin], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});

app.listen(3000, () => console.log('Server en http://localhost:3000'));