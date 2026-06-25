/**
 * Standardized API response utilities to ensure frontend
 * always receives data in exactly the same shape.
 */

const sendSuccess = (res, data = null, statusCode = 200) => {
  res.status(statusCode).json({
    status: 'success',
    data,
  });
};

const sendCreated = (res, data) => {
  sendSuccess(res, data, 201);
};

const sendNoContent = (res) => {
  res.status(204).json();
};

const sendPaginated = (res, data, paginationMeta) => {
  res.status(200).json({
    status: 'success',
    data,
    meta: paginationMeta,
  });
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
};
