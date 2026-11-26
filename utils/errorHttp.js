function errorHttp(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = errorHttp;
