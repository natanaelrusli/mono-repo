export interface ApiResponse {
  success: boolean;
  message?: string;
}
export interface LoginResponse {
  success: boolean;
  statusCode: number;
  token?: string;
  message?: string;
}

export interface ApiError extends Error {
  statusCode: number;
  message: string;
}
