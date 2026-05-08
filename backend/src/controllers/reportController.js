// Report controller – implements student reporting of listings or users (BE-12)

import { pool } from '../app.js';

/**
 * POST /api/reports
 * Allows an authenticated student to submit a report about a listing or a user.
 * Body must include:
 *   - target_type: "listing" | "user"
 *   - target_id: integer (id of the listing or user being reported)
 *   - reason: string (description of the issue)
 */
export async function submitReport(req, res, next) {
  try {
    const reporterId = req.user?.id;
    if (!reporterId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthenticated' } });
    }

    const { target_type, target_id, reason } = req.body;
    if (!target_type || !target_id || !reason) {
      return res.status(400).json({
        success: false,
        error: { message: 'target_type, target_id and reason are required' },
      });
    }

    if (!['listing', 'user'].includes(target_type)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid target_type' } });
    }

    const targetIdNum = Number(target_id);
    if (!Number.isInteger(targetIdNum) || targetIdNum <= 0) {
      return res.status(400).json({ success: false, error: { message: 'Invalid target_id' } });
    }

    await pool.query(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)',
      [reporterId, target_type, targetIdNum, reason]
    );

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllReports(req, res, next) {
  try {
    const [reports] = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
    return res.status(200).json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
}

export async function updateReportStatus(req, res, next) {
  try {
    const reportId = req.params.id;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid status' } });
    }


    const [result] = await pool.query(
      'UPDATE reports SET status = ? WHERE id = ?',
      [status, reportId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: { message: 'Report not found' } });
    }

    return res.status(200).json({ success: true, message: `Report ${status}` });
  } catch (err) {
    next(err);
  }
}

