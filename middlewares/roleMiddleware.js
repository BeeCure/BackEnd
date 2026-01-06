export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.role || req.userData?.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak: role tidak diizinkan",
      });
    }
    next();
  };
};
