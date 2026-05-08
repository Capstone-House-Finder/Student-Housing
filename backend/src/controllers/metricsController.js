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
    const [[{ total_students }]] = await pool.query("SELECT COUNT(*) AS total_students FROM users WHERE role = 'student'");
    const [[{ total_landlords }]] = await pool.query("SELECT COUNT(*) AS total_landlords FROM users WHERE role = 'landlord'");
    
    const [[{ total_listings }]] = await pool.query('SELECT COUNT(*) AS total_listings FROM listings WHERE deleted_at IS NULL');
    const [[{ pending_listings }]] = await pool.query('SELECT COUNT(*) AS pending_listings FROM listings WHERE verified = false AND deleted_at IS NULL');
    
    const [[{ total_reviews }]] = await pool.query('SELECT COUNT(*) AS total_reviews FROM reviews');
    const [[{ total_reports }]] = await pool.query('SELECT COUNT(*) AS total_reports FROM reports');
    const [[{ pending_reports }]] = await pool.query("SELECT COUNT(*) AS pending_reports FROM reports WHERE status = 'pending'");

    const stats = {
      total_users,
      total_students,
      total_landlords,
      total_listings,
      pending_listings,
      total_reviews,
      total_reports,
      pending_reports,
    };

    if (req.query.format === 'csv') {
      const header = 'metric,value';
      const rows = Object.entries(stats).map(([k, v]) => `${k},${v}`).join('\n');
      const csv = `${header}\n${rows}`;
      res.setHeader('Content-Type', 'text/csv');
      return res.status(200).send(csv);
    }

    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export async function getRecentActivity(req, res, next) {
  try {
    // Combine recent users, listings, and reports for an activity feed
    const [users] = await pool.query("SELECT 'user' as type, CONCAT('New user registered: ', email) as description, created_at as time FROM users ORDER BY created_at DESC LIMIT 5");
    const [listings] = await pool.query("SELECT 'listing' as type, CONCAT('New listing: ', title) as description, created_at as time FROM listings ORDER BY created_at DESC LIMIT 5");
    const [reports] = await pool.query("SELECT 'report' as type, CONCAT('New report submitted for ', target_type, ' #', target_id) as description, created_at as time FROM reports ORDER BY created_at DESC LIMIT 5");

    const activity = [...users, ...listings, ...reports]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);

    return res.status(200).json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
}

