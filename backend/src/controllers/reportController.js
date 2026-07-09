// Report controller – implements student reporting of listings or users (BE-12)

import { pool } from '../app.js';
import { sendNotification } from './pushController.js';

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

    // Notify admins about the new report
    try {
      const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins) {
        sendNotification(
          admin.id,
          'New Report Submitted',
          `A new report has been submitted regarding a ${target_type}.`,
          { screen: 'admin/reports' }
        ).catch(err => console.error('Failed to send new report push notification to admin:', err));
      }
    } catch (err) {
      console.error('Failed to send new report push notification to admins:', err);
    }

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
    const [reports] = await pool.query(
      `SELECT r.*, u.email as reporter_email 
       FROM reports r 
       JOIN users u ON r.reporter_id = u.id 
       ORDER BY r.created_at DESC`
    );
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


    // Fetch reporter_id before updating
    const [reportRows] = await pool.query(
      'SELECT reporter_id FROM reports WHERE id = ? LIMIT 1',
      [reportId]
    );

    const [result] = await pool.query(
      'UPDATE reports SET status = ? WHERE id = ?',
      [status, reportId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: { message: 'Report not found' } });
    }

    // Notify the reporter about the update
    try {
      if (reportRows.length > 0) {
        const reporterId = reportRows[0].reporter_id;
        sendNotification(
          reporterId,
          'Report Update',
          `Your report has been reviewed and marked as ${status}.`,
          { screen: 'profile' }
        ).catch(err => console.error('Failed to send report update push notification to reporter:', err));
      }
    } catch (err) {
      console.error('Failed to send report update push notification:', err);
    }

    return res.status(200).json({ success: true, message: `Report ${status}` });
  } catch (err) {
    next(err);
  }
}

