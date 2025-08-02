# 📱 Mobile Deployment Guide

Complete guide for deploying Cursor Mobile AI to various platforms with mobile optimization.

## 🚀 Vercel Deployment (Recommended)

### **One-Click Deploy**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/cursor-mobile-ai)

### **Manual Deployment**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure Domain** (Optional)
   ```bash
   vercel domains add your-domain.com
   vercel alias your-deployment.vercel.app your-domain.com
   ```

### **Vercel Configuration**

The `vercel.json` is pre-configured with:
- Mobile-optimized headers
- PWA caching strategies
- Security headers
- Serverless function optimization

## 📱 PWA Features

### **Installation**
Users can install the app by:
1. Opening in mobile browser
2. Tapping "Add to Home Screen"
3. App appears in app drawer like native app

### **Offline Support**
- Service Worker caches essential files
- Works offline for:
  - Code editing
  - File management
  - Local AI processing
  - Settings and preferences

### **Mobile-Specific Features**
- **App shortcuts** for quick actions
- **Share target** to receive files from other apps
- **File handler** for opening code files
- **Protocol handler** for custom URLs

## 🔧 Environment Variables

### **Required Variables**
```bash
# App Configuration
NEXT_PUBLIC_APP_NAME="Cursor Mobile AI"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# AI Configuration (Optional - for enhanced features)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"

# Analytics (Optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS="G-XXXXXXXXXX"
NEXT_PUBLIC_VERCEL_ANALYTICS=true
```

### **Vercel Environment Setup**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variables for Production, Preview, and Development
3. Redeploy to apply changes

## 🎨 Customization

### **Branding**
Update these files for custom branding:
- `public/manifest.json` - App name, colors, icons
- `app/layout.tsx` - Meta tags and titles
- `tailwind.config.js` - Color scheme
- `public/icons/` - App icons and splash screens

### **Theme Customization**
```css
/* app/globals.css */
:root {
  --cursor-accent: #your-color;
  --cursor-bg: #your-bg;
  /* Add custom CSS variables */
}
```

## 📊 Performance Optimization

### **Mobile Performance Features**
- **Bundle splitting** for faster loading
- **Image optimization** with Next.js Image
- **Lazy loading** of components
- **Service Worker** caching
- **Compressed assets** with gzip/brotli

### **Performance Monitoring**
```javascript
// Built-in analytics
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Automatically tracks:
// - Core Web Vitals
// - Mobile performance metrics
// - User interactions
```

## 🔐 Security

### **Security Headers**
Automatically configured in `vercel.json`:
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options

### **Mobile Security Features**
- **Secure contexts** (HTTPS only)
- **Safe area handling** for notched devices
- **Input validation** for touch inputs
- **Session management** with secure storage

## 🧪 Testing on Mobile

### **Local Testing**
```bash
# Get your local IP
ipconfig getifaddr en0  # macOS
hostname -I            # Linux

# Access from mobile device
http://YOUR-IP:3000
```

### **Device Testing**
1. **iOS Safari**: Test PWA installation and features
2. **Android Chrome**: Test PWA and file handling
3. **Samsung Internet**: Test Samsung-specific features
4. **Different screen sizes**: iPhone SE to iPad Pro

### **Testing Tools**
- **Chrome DevTools**: Mobile device simulation
- **BrowserStack**: Real device testing
- **Safari Web Inspector**: iOS debugging
- **Lighthouse**: PWA and performance auditing

## 📈 Analytics and Monitoring

### **Built-in Analytics**
- Vercel Analytics (free tier included)
- Core Web Vitals tracking
- Real User Monitoring (RUM)
- Error tracking and logging

### **Custom Events**
```typescript
// Track mobile-specific interactions
import { track } from '@vercel/analytics'

// Track gestures
track('swipe_navigation', { direction: 'left' })

// Track PWA installation
track('pwa_installed', { platform: 'ios' })

// Track AI usage
track('ai_completion_used', { language: 'typescript' })
```

## 🚀 Advanced Deployment Options

### **Netlify**
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"
```

### **Railway**
```dockerfile
# Railway auto-deploys from Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **Self-Hosted (Docker)**
```bash
# Build production image
docker build -t cursor-mobile-ai .

# Run with environment variables
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_APP_NAME="Your App" \
  cursor-mobile-ai
```

## 📱 Mobile-Specific Deployment Tips

### **iOS Considerations**
- Use `apple-touch-icon.png` (180x180)
- Set `apple-mobile-web-app-capable` to `yes`
- Configure splash screens for different devices
- Test with Safari on actual iOS devices

### **Android Considerations**
- Use maskable icons for adaptive icons
- Configure share target for file sharing
- Test with Chrome and Samsung Internet
- Ensure proper viewport meta tags

### **Performance Tips**
- Minimize initial bundle size
- Use dynamic imports for large components
- Optimize images for mobile screens
- Implement proper caching strategies

## 🔄 CI/CD Pipeline

### **GitHub Actions + Vercel**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📚 Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Mobile Web Performance](https://web.dev/mobile-performance/)
- [Vercel Documentation](https://vercel.com/docs)

---

**Your mobile-first AI code editor is ready to deploy! 🚀**