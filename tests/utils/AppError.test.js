const AppError = require('../../utils/AppError');

describe('AppError Utility', () => {
  it('should create an operational error with the correct properties', () => {
    const error = new AppError('Test error', 400, 'TEST_CODE');
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('TEST_CODE');
    expect(error.status).toBe('fail'); // 4xx starts with 'fail'
    expect(error.isOperational).toBe(true);
  });

  it('should format 5xx status codes with "error"', () => {
    const error = new AppError('Server error', 500);
    expect(error.status).toBe('error');
  });

  it('should use the badRequest factory method correctly', () => {
    const error = AppError.badRequest('Invalid ID');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
  });

  it('should use the notFound factory method correctly', () => {
    const error = AppError.notFound('User');
    expect(error.message).toBe('User not found');
    expect(error.statusCode).toBe(404);
  });
});
