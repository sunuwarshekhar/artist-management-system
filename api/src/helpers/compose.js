//pattern ref : https://oneuptime.com/blog/post/2026-01-27-composable-middleware-express/view
function compose(req, res, middleware) {
  let index = 0;

  function next() {
    const handler = middleware[index++];
    if (handler) handler(req, res, next);
  }

  next();
}

module.exports = { compose };
