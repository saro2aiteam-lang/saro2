import Clarity from '@microsoft/clarity';

// Microsoft Clarity 配置
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || 'tkke8cr6ge';

export const initClarity = () => {
  if (typeof window !== 'undefined' && CLARITY_PROJECT_ID) {
    try {
      Clarity.init(CLARITY_PROJECT_ID);
      console.log('Microsoft Clarity initialized with project ID:', CLARITY_PROJECT_ID);
    } catch (error) {
      console.error('Failed to initialize Microsoft Clarity:', error);
    }
  }
};

export default Clarity;
