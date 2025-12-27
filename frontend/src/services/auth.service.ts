import apiClient from '@/lib/api-client';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types/auth';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('🔐 开始登录:', credentials.username);
    
    // 登录前清除所有旧的token，确保不会携带无效token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
    }
    
    // FastAPI OAuth2 expects application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);
    
    console.log('📤 发送请求:', {
      url: '/auth/login',
      body: params.toString(),
      contentType: 'application/x-www-form-urlencoded'
    });
    
    try {
      // 使用apiClient，但拦截器已经处理了登录接口不添加token
      const response = await apiClient.post<AuthResponse>(
        '/auth/login', 
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000, // 30秒超时
        }
      );
      
      console.log('✅ 登录成功:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 登录失败:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        timeout: error.code === 'ECONNABORTED'
      });
      
      // 处理超时错误
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('请求超时，请检查网络连接或稍后重试');
      }
      
      // 处理网络错误
      if (!error.response) {
        throw new Error('网络错误，请检查后端服务是否正常运行');
      }
      
      throw error;
    }
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      // 清除所有认证相关的数据
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
      // 清除所有localStorage中以token相关的key
      Object.keys(localStorage).forEach(key => {
        if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
          localStorage.removeItem(key);
        }
      });
    }
  },

  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }
};

