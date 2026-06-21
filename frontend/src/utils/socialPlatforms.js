// Single source of truth for the social platforms the editor supports, so the
// input form and the generated markdown never drift out of sync.

export const SOCIAL_PLATFORMS = {
  github: { label: 'GitHub', icon: 'bi-github', logo: 'github', color: '181717', baseUrl: 'https://github.com/', placeholder: 'octocat' },
  linkedin: { label: 'LinkedIn', icon: 'bi-linkedin', logo: 'linkedin', color: '0A66C2', baseUrl: 'https://linkedin.com/in/', placeholder: 'your-handle' },
  twitter: { label: 'Twitter / X', icon: 'bi-twitter', logo: 'twitter', color: '1DA1F2', baseUrl: 'https://twitter.com/', placeholder: 'handle' },
  instagram: { label: 'Instagram', icon: 'bi-instagram', logo: 'instagram', color: 'E4405F', baseUrl: 'https://instagram.com/', placeholder: 'handle' },
  youtube: { label: 'YouTube', icon: 'bi-youtube', logo: 'youtube', color: 'FF0000', baseUrl: 'https://youtube.com/@', placeholder: 'channel' },
  devto: { label: 'Dev.to', icon: 'bi-code-slash', logo: 'devdotto', color: '0A0A0A', baseUrl: 'https://dev.to/', placeholder: 'handle' },
  website: { label: 'Website', icon: 'bi-globe2', logo: 'googlechrome', color: '4285F4', baseUrl: '', placeholder: 'yourdomain.com' },
  email: { label: 'Email', icon: 'bi-envelope-fill', logo: 'gmail', color: 'D14836', baseUrl: 'mailto:', placeholder: 'you@example.com' },
};

export const buildSocialUrl = (platform, rawValue) => {
  const meta = SOCIAL_PLATFORMS[platform];
  if (!meta || !rawValue) return null;

  const value = rawValue.trim().replace(/^@/, '');
  if (!value) return null;

  if (platform === 'website') {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }
  if (platform === 'email') {
    return `mailto:${value}`;
  }
  return `${meta.baseUrl}${value}`;
};