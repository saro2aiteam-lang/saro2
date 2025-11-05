/**
 * 清除追踪数据的工具函数
 * 用于着陆页/跳转页面，防止被追踪
 */

// 常见的追踪 Cookie 名称列表
const TRACKING_COOKIE_PATTERNS = [
  // Google Analytics
  '_ga',
  '_gid',
  '_gat',
  '_gat_gtag_',
  '_gac_',
  '_gcl_',
  '_gcl_au',
  '_gcl_aw',
  '_gcl_dc',
  '_gtm',
  '_gtag',
  '_ga_',
  'AMP_TOKEN',
  '__utma',
  '__utmb',
  '__utmc',
  '__utmt',
  '__utmz',
  '__utmv',
  '__utmx',
  '__utmxx',
  
  // Facebook Pixel
  '_fbp',
  '_fbc',
  'fr',
  'sb',
  'datr',
  'c_user',
  'xs',
  'spin',
  'presence',
  'wd',
  'locale',
  'lu',
  'ct_rdr',
  'ct_rm',
  'ct_rmi',
  'ct_rmx',
  'ct_rmrx',
  'ct_rmrxv',
  
  // Hotjar
  '_hjid',
  '_hjIncludedInPageviewSample',
  '_hjIncludedInSessionSample',
  '_hjAbsoluteSessionInProgress',
  '_hjFirstSeen',
  '_hjSessionRejected',
  '_hjSessionTooLarge',
  '_hjSessionUser_',
  '_hjViewportId',
  '_hjRecordingEnabled',
  '_hjRecordingLastActivity',
  '_hjTLDTest',
  '_hjLocalStorageTest',
  '_hjUserAttributesHash',
  '_hjCachedUserAttributes',
  '_hjLocalStorageTest',
  '_hjClosedSurveyInvites',
  '_hjDonePolls',
  '_hjMinimizedPolls',
  '_hjDoneTestersWidgets',
  '_hjMinimizedTestersWidgets',
  '_hjIncludedInPageviewSample',
  '_hjIncludedInSessionSample',
  '_hjAbsoluteSessionInProgress',
  '_hjFirstSeen',
  '_hjSessionRejected',
  '_hjSessionTooLarge',
  '_hjSessionUser_',
  '_hjViewportId',
  '_hjRecordingEnabled',
  '_hjRecordingLastActivity',
  '_hjTLDTest',
  '_hjLocalStorageTest',
  '_hjUserAttributesHash',
  '_hjCachedUserAttributes',
  '_hjLocalStorageTest',
  '_hjClosedSurveyInvites',
  '_hjDonePolls',
  '_hjMinimizedPolls',
  '_hjDoneTestersWidgets',
  '_hjMinimizedTestersWidgets',
  
  // Microsoft Clarity
  '_clck',
  '_clsk',
  'CLID',
  'ANONCLK',
  'MR',
  'MUID',
  'SM',
  'SRCHUSR',
  'SRCHHPGUSR',
  'SRCHD',
  'SRCHUID',
  'SRCHSID',
  
  // Adobe Analytics
  's_cc',
  's_sq',
  's_vi',
  's_fid',
  'AMCV_',
  'AMCVS_',
  's_ppv',
  's_ppvl',
  's_ppvs',
  's_ppvr',
  's_ppvsr',
  's_ppvss',
  's_ppvssr',
  's_ppvsssr',
  's_ppvssssr',
  's_ppvsssssr',
  's_ppvssssssr',
  's_ppvsssssssr',
  's_ppvssssssssr',
  
  // LinkedIn
  'lidc',
  'li_at',
  'liap',
  'li_sugr',
  'lissc',
  'lissd',
  'lissu',
  'lissv',
  'lissw',
  'lissx',
  'lissz',
  
  // Twitter/X
  'personalization_id',
  'guest_id',
  'guest_id_ads',
  'guest_id_marketing',
  'muc_ads',
  'twid',
  
  // TikTok Pixel
  '_ttp',
  '_tt_enable_cookie',
  '_ttclid',
  '_ttclid_',
  '_ttclid_c',
  '_ttclid_g',
  '_ttclid_m',
  '_ttclid_p',
  '_ttclid_r',
  '_ttclid_s',
  '_ttclid_t',
  '_ttclid_u',
  '_ttclid_v',
  '_ttclid_w',
  '_ttclid_x',
  '_ttclid_y',
  '_ttclid_z',
  
  // Pinterest
  '_pinid',
  '_pinterest_ct',
  '_pinterest_ct_guid',
  '_pinterest_ct_ruid',
  '_pinterest_pma_ct',
  '_pinterest_pma_ct_guid',
  '_pinterest_pma_ct_ruid',
  '_pinterest_sess',
  '_pinterest_ct_uid',
  '_pinterest_ct_uid_ts',
  '_pinterest_ct_uid_ts_',
  '_pinterest_ct_uid_ts__',
  '_pinterest_ct_uid_ts___',
  '_pinterest_ct_uid_ts____',
  
  // Snapchat
  '_scid',
  '_sctr',
  's_pers',
  's_pers_v',
  's_pers_v_',
  's_pers_v__',
  's_pers_v___',
  's_pers_v____',
  
  // Other common tracking
  '__cfduid',
  '__cf_bm',
  '__stripe_mid',
  '__stripe_sid',
  '__paypal_storage__',
  '__hssc',
  '__hssrc',
  '__hstc',
  '__hs_opt_out',
  '__hs_do_not_track',
  '__hs_initial_opt_in',
  '__hs_opt_in',
  '__hs_opt_out',
  '__hs_do_not_track',
  '__hs_initial_opt_in',
  '__hs_opt_in',
  '__hs_opt_out',
  '__hs_do_not_track',
  '__hs_initial_opt_in',
  '__hs_opt_in',
  '__hs_opt_out',
  '__hs_do_not_track',
  '__hs_initial_opt_in',
  '__hs_opt_in',
];

// 常见的追踪 localStorage 键名
const TRACKING_LOCALSTORAGE_PATTERNS = [
  '_ga',
  '_gid',
  '_gat',
  '_gtm',
  '_gtag',
  '_fbp',
  '_fbc',
  '_hjid',
  '_hjIncludedInPageviewSample',
  '_hjIncludedInSessionSample',
  '_hjAbsoluteSessionInProgress',
  '_hjFirstSeen',
  '_hjSessionRejected',
  '_hjSessionTooLarge',
  '_hjSessionUser_',
  '_hjViewportId',
  '_hjRecordingEnabled',
  '_hjRecordingLastActivity',
  '_hjTLDTest',
  '_hjLocalStorageTest',
  '_hjUserAttributesHash',
  '_hjCachedUserAttributes',
  '_clck',
  '_clsk',
  'CLID',
  'ANONCLK',
  'MR',
  'MUID',
  'SM',
  'SRCHUSR',
  'SRCHHPGUSR',
  'SRCHD',
  'SRCHUID',
  'SRCHSID',
  's_cc',
  's_sq',
  's_vi',
  's_fid',
  'AMCV_',
  'AMCVS_',
  'personalization_id',
  'guest_id',
  'guest_id_ads',
  'guest_id_marketing',
  'muc_ads',
  'twid',
  '_ttp',
  '_tt_enable_cookie',
  '_ttclid',
  '_pinid',
  '_pinterest_ct',
  '_pinterest_ct_guid',
  '_pinterest_ct_ruid',
  '_pinterest_pma_ct',
  '_pinterest_pma_ct_guid',
  '_pinterest_pma_ct_ruid',
  '_pinterest_sess',
  '_pinterest_ct_uid',
  '_pinterest_ct_uid_ts',
  '_scid',
  '_sctr',
];

// 清除所有 Cookie
function clearAllCookies(): void {
  if (typeof document === 'undefined') return;
  
  // 获取所有 cookie
  const cookies = document.cookie.split(';');
  
  // 清除所有 cookie（设置为过期）
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    
    // 清除所有可能的域名和路径组合
    const domains = [
      '',
      window.location.hostname,
      `.${window.location.hostname}`,
      window.location.hostname.split('.').slice(-2).join('.'),
      `.${window.location.hostname.split('.').slice(-2).join('.')}`,
    ];
    
    const paths = ['/', ''];
    
    domains.forEach(domain => {
      paths.forEach(path => {
        // 设置为空值并立即过期
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; SameSite=None; Secure`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=None; Secure`;
      });
    });
  });
}

// 清除追踪相关的 Cookie
function clearTrackingCookies(): void {
  if (typeof document === 'undefined') return;
  
  const hostname = window.location.hostname;
  const domains = [
    '',
    hostname,
    `.${hostname}`,
    hostname.split('.').slice(-2).join('.'),
    `.${hostname.split('.').slice(-2).join('.')}`,
  ];
  
  const paths = ['/', ''];
  
  TRACKING_COOKIE_PATTERNS.forEach(pattern => {
    domains.forEach(domain => {
      paths.forEach(path => {
        // 清除匹配模式的 cookie（包括带前缀的）
        const variations = [
          pattern,
          ...TRACKING_COOKIE_PATTERNS.filter(p => p.startsWith(pattern) || pattern.startsWith(p)),
        ];
        
        variations.forEach(name => {
          // 设置为空值并立即过期
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; SameSite=None; Secure`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=None; Secure`;
          
          // 也尝试清除所有可能的子 cookie
          for (let i = 0; i < 100; i++) {
            document.cookie = `${name}${i}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
            document.cookie = `${name}_${i}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
          }
        });
      });
    });
  });
}

// 清除所有 localStorage
function clearAllLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  try {
    window.localStorage.clear();
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
}

// 清除追踪相关的 localStorage
function clearTrackingLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  try {
    // 清除已知的追踪键
    TRACKING_LOCALSTORAGE_PATTERNS.forEach(key => {
      try {
        window.localStorage.removeItem(key);
        // 也清除所有可能的变体
        for (let i = 0; i < 100; i++) {
          window.localStorage.removeItem(`${key}${i}`);
          window.localStorage.removeItem(`${key}_${i}`);
        }
      } catch (e) {
        // 忽略错误
      }
    });
    
    // 清除所有匹配模式的键
    const allKeys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        allKeys.push(key);
      }
    }
    
    allKeys.forEach(key => {
      const shouldRemove = TRACKING_LOCALSTORAGE_PATTERNS.some(pattern => 
        key.startsWith(pattern) || pattern.startsWith(key) || key.includes(pattern)
      );
      
      if (shouldRemove) {
        try {
          window.localStorage.removeItem(key);
        } catch (e) {
          // 忽略错误
        }
      }
    });
  } catch (e) {
    console.warn('Failed to clear tracking localStorage:', e);
  }
}

// 清除所有 sessionStorage
function clearAllSessionStorage(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  
  try {
    window.sessionStorage.clear();
  } catch (e) {
    console.warn('Failed to clear sessionStorage:', e);
  }
}

// 清除追踪相关的 sessionStorage
function clearTrackingSessionStorage(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  
  try {
    TRACKING_LOCALSTORAGE_PATTERNS.forEach(key => {
      try {
        window.sessionStorage.removeItem(key);
        for (let i = 0; i < 100; i++) {
          window.sessionStorage.removeItem(`${key}${i}`);
          window.sessionStorage.removeItem(`${key}_${i}`);
        }
      } catch (e) {
        // 忽略错误
      }
    });
    
    const allKeys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key) {
        allKeys.push(key);
      }
    }
    
    allKeys.forEach(key => {
      const shouldRemove = TRACKING_LOCALSTORAGE_PATTERNS.some(pattern => 
        key.startsWith(pattern) || pattern.startsWith(key) || key.includes(pattern)
      );
      
      if (shouldRemove) {
        try {
          window.sessionStorage.removeItem(key);
        } catch (e) {
          // 忽略错误
        }
      }
    });
  } catch (e) {
    console.warn('Failed to clear tracking sessionStorage:', e);
  }
}

// 清除第三方追踪脚本
function clearTrackingScripts(): void {
  if (typeof document === 'undefined') return;
  
  // 移除追踪脚本标签
  const scriptSelectors = [
    'script[src*="google-analytics"]',
    'script[src*="googletagmanager"]',
    'script[src*="gtag"]',
    'script[src*="facebook.net"]',
    'script[src*="connect.facebook.net"]',
    'script[src*="fbcdn.net"]',
    'script[src*="hotjar.com"]',
    'script[src*="clarity.ms"]',
    'script[src*="clarity.microsoft"]',
    'script[src*="analytics.js"]',
    'script[src*="gtm.js"]',
    'script[src*="doubleclick.net"]',
    'script[src*="googleadservices"]',
    'script[src*="googlesyndication"]',
    'script[src*="adsystem.com"]',
    'script[src*="advertising.com"]',
    'script[src*="adtech"]',
    'script[src*="bing.com"]',
    'script[src*="linkedin.com"]',
    'script[src*="twitter.com"]',
    'script[src*="tiktok.com"]',
    'script[src*="pinterest.com"]',
    'script[src*="snapchat.com"]',
    'script[src*="adobedtm.com"]',
    'script[src*="omniture"]',
    'script[src*="sitecatalyst"]',
    'script[src*="2o7.net"]',
    'script[src*="demdex.net"]',
    'script[src*="everesttech"]',
    'script[src*="advertising"]',
    'script[src*="tracking"]',
    'script[src*="analytics"]',
    'script[src*="pixel"]',
    'script[src*="track"]',
    'script[src*="beacon"]',
    'script[src*="tag"]',
  ];
  
  scriptSelectors.forEach(selector => {
    try {
      const scripts = document.querySelectorAll(selector);
      scripts.forEach(script => {
        script.remove();
      });
    } catch (e) {
      // 忽略错误
    }
  });
  
  // 清除全局追踪对象
  if (typeof window !== 'undefined') {
    try {
      // Google Analytics
      delete (window as any).ga;
      delete (window as any).gtag;
      delete (window as any).dataLayer;
      delete (window as any).google_tag_manager;
      
      // Facebook Pixel
      delete (window as any).fbq;
      delete (window as any)._fbq;
      
      // Hotjar
      delete (window as any).hj;
      delete (window as any).hotjar;
      
      // Microsoft Clarity
      delete (window as any).clarity;
      
      // Adobe Analytics
      delete (window as any).s;
      delete (window as any).s_gi;
      delete (window as any).s_account;
      
      // LinkedIn
      delete (window as any)._linkedin_partner_id;
      delete (window as any).lintrk;
      
      // Twitter
      delete (window as any).twq;
      delete (window as any).twttr;
      
      // TikTok
      delete (window as any).ttq;
      
      // Pinterest
      delete (window as any).pinimg;
      delete (window as any).pintrk;
      
      // Snapchat
      delete (window as any).snaptr;
      
      // 通用追踪
      delete (window as any).tracker;
      delete (window as any).tracking;
      delete (window as any).analytics;
    } catch (e) {
      // 忽略错误
    }
  }
}

// 清除 iframe 中的追踪
function clearTrackingIframes(): void {
  if (typeof document === 'undefined') return;
  
  const iframeSelectors = [
    'iframe[src*="google-analytics"]',
    'iframe[src*="googletagmanager"]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="facebook"]',
    'iframe[src*="hotjar"]',
    'iframe[src*="clarity"]',
    'iframe[src*="advertising"]',
    'iframe[src*="tracking"]',
    'iframe[src*="analytics"]',
    'iframe[src*="pixel"]',
    'iframe[src*="beacon"]',
  ];
  
  iframeSelectors.forEach(selector => {
    try {
      const iframes = document.querySelectorAll(selector);
      iframes.forEach(iframe => {
        iframe.remove();
      });
    } catch (e) {
      // 忽略错误
    }
  });
}

// 清除图片像素追踪
function clearTrackingPixels(): void {
  if (typeof document === 'undefined') return;
  
  const pixelSelectors = [
    'img[src*="google-analytics"]',
    'img[src*="googletagmanager"]',
    'img[src*="doubleclick"]',
    'img[src*="facebook"]',
    'img[src*="hotjar"]',
    'img[src*="clarity"]',
    'img[src*="advertising"]',
    'img[src*="tracking"]',
    'img[src*="analytics"]',
    'img[src*="pixel"]',
    'img[src*="beacon"]',
    'img[src*="track"]',
  ];
  
  pixelSelectors.forEach(selector => {
    try {
      const pixels = document.querySelectorAll(selector);
      pixels.forEach(pixel => {
        pixel.remove();
      });
    } catch (e) {
      // 忽略错误
    }
  });
}

/**
 * 清除所有追踪数据（推荐用于着陆页）
 * 包括：Cookie、localStorage、sessionStorage、追踪脚本、iframe、像素
 */
export function clearAllTracking(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  try {
    // 清除所有 Cookie
    clearAllCookies();
    
    // 清除所有 localStorage
    clearAllLocalStorage();
    
    // 清除所有 sessionStorage
    clearAllSessionStorage();
    
    // 清除追踪脚本
    clearTrackingScripts();
    
    // 清除追踪 iframe
    clearTrackingIframes();
    
    // 清除追踪像素
    clearTrackingPixels();
    
    console.log('✅ All tracking data cleared');
  } catch (e) {
    console.warn('Failed to clear all tracking:', e);
  }
}

/**
 * 仅清除追踪相关的数据（保留应用功能所需的 Cookie/localStorage）
 * 包括：追踪 Cookie、追踪 localStorage、追踪脚本等
 */
export function clearTrackingOnly(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  try {
    // 清除追踪 Cookie
    clearTrackingCookies();
    
    // 清除追踪 localStorage
    clearTrackingLocalStorage();
    
    // 清除追踪 sessionStorage
    clearTrackingSessionStorage();
    
    // 清除追踪脚本
    clearTrackingScripts();
    
    // 清除追踪 iframe
    clearTrackingIframes();
    
    // 清除追踪像素
    clearTrackingPixels();
    
    console.log('✅ Tracking data cleared');
  } catch (e) {
    console.warn('Failed to clear tracking:', e);
  }
}

/**
 * 清除 Cookie（所有或仅追踪相关的）
 */
export function clearCookies(trackingOnly: boolean = false): void {
  if (trackingOnly) {
    clearTrackingCookies();
  } else {
    clearAllCookies();
  }
}

/**
 * 清除 localStorage（所有或仅追踪相关的）
 */
export function clearLocalStorage(trackingOnly: boolean = false): void {
  if (trackingOnly) {
    clearTrackingLocalStorage();
  } else {
    clearAllLocalStorage();
  }
}

/**
 * 清除 sessionStorage（所有或仅追踪相关的）
 */
export function clearSessionStorage(trackingOnly: boolean = false): void {
  if (trackingOnly) {
    clearTrackingSessionStorage();
  } else {
    clearAllSessionStorage();
  }
}

/**
 * 清除追踪脚本
 */
export function clearScripts(): void {
  clearTrackingScripts();
}

// 默认导出
export default {
  clearAllTracking,
  clearTrackingOnly,
  clearCookies,
  clearLocalStorage,
  clearSessionStorage,
  clearScripts,
};

