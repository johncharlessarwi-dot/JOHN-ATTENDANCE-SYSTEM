// CI-only stand-in for AppDeploy's platform-provided browser client.
// AppDeploy production builds resolve the real @appdeploy/client package.
type ApiResponse = { data: any };
const unavailable = async (): Promise<ApiResponse> => {
  throw new Error('The AppDeploy client is available only inside the deployed AFAMS runtime.');
};
export const api = {
  get: unavailable,
  post: unavailable,
  put: unavailable,
  delete: unavailable,
};
