// requireRole: middleware factory that accepts allowed roles (case-insensitive)
module.exports = function requireRole(...allowedRoles) {
  const allowed = allowedRoles.map(r => r.toString().toLowerCase());
  return (req, res, next) => {
    if (!req.user || !req.user.rol) return res.status(401).json({ error: 'No autorizado' });
    const userRole = String(req.user.rol).toLowerCase();
    if (allowed.includes(userRole)) return next();
    return res.status(403).json({ error: 'Permiso denegado' });
  };
};
