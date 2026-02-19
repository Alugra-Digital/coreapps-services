export function staticCacheHeaders(req, res, next) {
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico|webp)$/)) {
    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    });
  }
  next();
}
