export const errorHandler = (err, req, res, next) => {
  // Structured logging for production observability
  const errorMeta = {
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    name: err.name,
    message: err.message,
    code: err.code
  };

  console.error('🔥 [API Exception Caught]:', JSON.stringify(errorMeta, null, 2));

  // Handle Prisma Known Request Errors gracefully
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A duplicate record with unique field already exists.',
      code: 'DUPLICATE_RECORD'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'The requested resource was not found in the database.',
      code: 'NOT_FOUND'
    });
  }

  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code || 'INTERNAL_ERROR',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
