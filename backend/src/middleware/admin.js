export function admin(req, res, next) {
  const user = req.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { message: 'Admin role required' },
    });
  }
  next();
}
