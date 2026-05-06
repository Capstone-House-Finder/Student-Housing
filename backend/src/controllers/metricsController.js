// Metrics controller – implements admin platform metrics endpoint (BE-15)

import { pool } from '../app.js';

/**
 * GET /api/admin/metrics
 * Returns platform statistics. Admin-only.
 * Query param `format=csv` returns CSV export.
 */
export async function getMetrics(req, res, next) {
  try {
    // Gather counts
    const [[{ total_users }]] = await pool.query('SELECT COUNT(*) AS total_users FROM users');
    const [[{ total_listings }]] = await pool.query('SELECT COUNT(*) AS total_listings FROM listings WHERE deleted_at IS NULL');
    const [[{ active_rentals }]] = await pool.query('SELECT COUNT(*) AS active_rentals FROM rentals');
    const [[{ total_reports }]] = await pool.query('SELECT COUNT(*) AS total_reports FROM reports');
    const [[{ flagged_content }]] = await pool.query('SELECT COUNT(*) AS flagged_content FROM listings WHERE flagged = true AND deleted_at IS NULL');

    const metrics = {
      total_users,
      total_listings,
      active_rentals,
      total_reports,
      flagged_content,
    };

    if (req.query.format === 'csv') {
      // Simple CSV: header then rows
      const header = 'metric,value';
      const rows = Object.entries(metrics).map(([k, v]) => `${k},${v}`).join('\n');
      const csv = `${header}\n${rows}`;
      res.setHeader('Content-Type', 'text/csv');
      return res.status(200).send(csv);
    }

    return res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
}
