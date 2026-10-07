# 🎌 Legacy Manga Reader Platform (Archived)

> **Archive Notice:** This repository has transitioned into **ZeroCoding — AI Agent Skills Vault & Universal Setup Gateway**. The original web application source code is retained in the Git history and codebase, and its original documentation is preserved below for reference.

[![License](https://img.shields.io/badge/license-CodeCanyon-blue.svg)](https://codecanyon.net/)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](#)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6.svg)](https://www.typescriptlang.org/)

A complete, production-ready manga reading platform built with React, TypeScript, and Supabase. Perfect for manga enthusiasts, publishers, and developers looking to create professional manga reading experiences with monetization capabilities.

## ✨ Features

### 🔐 Authentication & Security
- **Multi-platform Login**: Email/password authentication with Supabase
- **Two-Factor Authentication (2FA)**: TOTP-based security for enhanced protection
- **CAPTCHA Protection**: reCAPTCHA v3 integration for login, registration, and checkout
- **Role-based Access Control**: Admin, Editor, Author, Member, and User roles
- **Account Management**: Complete user profile system with activity tracking

### 📖 Reading Experience
- **Advanced Reader**: Smooth page navigation with keyboard shortcuts
- **Multiple Reading Modes**: Single page, double page, and webtoon styles
- **Reading Progress**: Automatic bookmark saving and progress tracking
- **Mobile Responsive**: Optimized touch gestures for mobile devices
- **Theme Support**: Light/dark mode with customizable themes

### 🎨 Admin Dashboard
- **Complete Admin Panel**: Comprehensive management interface
- **Chapter Manager**: Upload, organize, and manage manga chapters
- **User Management**: Monitor users, roles, and activity
- **Content Upload**: Bulk image upload with compression
- **Analytics Dashboard**: Track user engagement and reading patterns
- **System Health Monitor**: Real-time system status and diagnostics

### 💰 Monetization Features
- **Coin System**: Virtual currency for premium content
- **PayPal Integration**: Secure subscription and payment processing
- **Premium Chapters**: Chapter unlocking with coins or subscriptions
- **License System**: CodeCanyon-compliant licensing and validation
- **Revenue Analytics**: Track earnings and user spending patterns

### 🛠️ Technical Features
- **PWA Ready**: Progressive Web App with offline capabilities
- **SEO Optimized**: Complete meta tags, sitemap, and structured data
- **Performance Optimized**: Image compression, lazy loading, and caching
- **Database Flexibility**: Supabase or MySQL support
- **Export System**: Complete MySQL export functionality
- **Cloudflare Integration**: CDN, security, and performance features

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/bun
- Supabase account (recommended) or MySQL database
- Modern web browser

### Installation

1. **Clone or extract the project**
   ```bash
   cd your-manga-reader
   npm install
   ```

2. **Configure your database**
   - Option A: Use Supabase (recommended)
     - Create a Supabase project
     - Copy your Supabase URL and anon key
   - Option B: Use MySQL
     - Set up MySQL database
     - Import the provided schema

3. **Run the installation wizard**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:5173/install` and follow the setup wizard.

4. **Complete setup**
   - Choose your database platform
   - Configure connection settings
   - Set up site details and admin account
   - Install completes automatically

### Environment Setup (Optional)
Copy `.env.example` to `.env` for additional configuration:
```bash
# Required - Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - Analytics & Monetization  
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXXX
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id

# Optional - SEO & Social
VITE_SITE_URL=https://yourdomain.com
VITE_SITE_NAME=Your Manga Site
```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/ui components
│   ├── admin/           # Admin dashboard components
│   └── installation/    # Installation wizard components
├── pages/               # Main application pages
├── hooks/               # Custom React hooks
├── contexts/            # React context providers
├── utils/               # Utility functions and helpers
├── integrations/        # External service integrations
└── assets/              # Static assets and images
```

---

© 2024 Advanced Manga Reader Platform. All rights reserved.
