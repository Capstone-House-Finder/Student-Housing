import { getDatabasePool } from '../config/database.js';

let _pool = null;
function pool() {
    if (!_pool) _pool = getDatabasePool();
    return _pool;
}

export async function listAmenities(req, res, next) {
    try {
        const [rows] = await pool().query('SELECT id, name FROM amenities ORDER BY name ASC');
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
}

export async function createAmenity(req, res, next) {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, error: { message: 'Amenity name is required' } });
        }
        const [result] = await pool().query('INSERT INTO amenities (name) VALUES (?)', [name]);
        res.status(201).json({
            success: true,
            data: { id: result.insertId, name }
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: { message: 'Amenity already exists' } });
        }
        next(err);
    }
}

export async function updateAmenity(req, res, next) {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const [result] = await pool().query('UPDATE amenities SET name = ? WHERE id = ?', [name, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: { message: 'Amenity not found' } });
        }
        res.status(200).json({ success: true, message: `Amenity ${id} updated` });
    } catch (err) {
        next(err);
    }
}

export async function deleteAmenity(req, res, next) {
    try {
        const { id } = req.params;
        const [result] = await pool().query('DELETE FROM amenities WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: { message: 'Amenity not found' } });
        }
        res.status(200).json({ success: true, message: `Amenity ${id} deleted` });
    } catch (err) {
        next(err);
    }
}

