# ber.earth 🌐✨

Good vibrations! You've stumbled upon my corner of the internet, a sort of digital closet for my mental skeletons. There's a lot of odd shit here, so feel free to look around and save anything you like. I frequently update this site with new and exciting cringe, and there's even a blog full of half-baked opinions if you enjoy second-hand psychosis. Otherwise, please enjoy some top-shelf, barrel-aged hypertext with a side of refried GeoCities assets. —Ber ᕦʕ •`ᴥ•´ʔᕤ!

## 🛠️ Tech Stack

This site uses modern backend technology while maintaining that classic retro aesthetic:

- **Backend**: Supabase (PostgreSQL database)
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Guestbook System**: Custom implementation with real-time submissions
- **Spam Protection**: Multi-layer validation and content filtering

## 📁 Project Structure

```
berdotearth/
├── css/                    # Stylesheets
├── img/                    # Images and assets
├── js/                     # JavaScript files
│   ├── supabase-client.js  # Supabase client configuration
│   ├── guestbook-api.js    # Guestbook API functions
│   ├── guestbook.js        # Main guestbook logic
│   ├── blog-comments-api.js # Blog comments API functions
│   ├── blog-comments.js     # Blog comments main logic
│   └── comment-counts-new.js # Comment count display logic
├── sql/                    # Database schemas
│   ├── guestbook-schema.sql # Supabase guestbook schema
│   └── blog-comments-schema.sql # Supabase blog comments schema
├── posts/                  # Blog posts
├── guestbook.html          # Guestbook page
├── index.html              # Homepage
└── README.md               # This file
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (for local development)
- Supabase account and project

### 1. Database Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Run the database schemas**:
   ```sql
   -- Copy contents from sql/guestbook-schema.sql and sql/blog-comments-schema.sql
   -- Paste into your Supabase SQL Editor and run both scripts
   ```
3. **Update Supabase credentials** in `js/supabase-client.js`:
   ```javascript
   const SUPABASE_URL = 'your-project-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

### 2. Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bergutman/berdotearth.git
   cd berdotearth
   ```

2. **Start the development server**:
   ```bash
   python3 -m http.server 8080
   # or
   npx serve .
   ```

3. **Visit the site** at `http://localhost:8080`

### 3. Guestbook Features

The guestbook system includes:

- **Real-time submissions**: Messages appear instantly
- **Enhanced spam protection**: 
  - URL/Email/Phone number blocking
  - Technical threat detection only (no content filtering)
  - Character limits and validation (1-10,000 characters)
  - Rate limiting (5 min cooldown, 10 per hour)
- **Privacy-first**: No IP logging or invasive tracking
- **Optimistic UI**: Immediate feedback while submitting
- **Error handling**: Comprehensive error messages and retry functionality

### 4. Blog Comments System

The blog includes a fully functional comment system:

- **Real-time comments**: Comments appear instantly on posts
- **Supabase-powered**: Modern backend replacing Google Sheets
- **Enhanced spam protection**: 
  - URL/Email/Phone number blocking
  - Technical threat detection only
  - Character limits (1-10,000 characters)
  - Rate limiting (2 min cooldown, 20 per hour)
- **Post-specific filtering**: Comments filtered by post ID
- **Sticky note styling**: Retro aesthetic with alternating colors and tilts
- **Optimistic UI**: Comments appear immediately while submitting
- **Comment counts**: Real-time comment count display on blog listing

## 🖼️ Image Attribution

All retro images, GIFs, and graphics used throughout this site were sourced from:
- **[Geocities Restorativland](https://geocities.restorativland.org/)** - Backgrounds, patterns, and web elements
- **[GIFcities](https://gifcities.org/)** - Animated GIFs and vintage web graphics

These resources preserve and provide access to content from the original GeoCities web hosting service.

## 📄 License & Usage

This project is released under the "No Rights Reserved" philosophy - feel free to use, modify, and distribute the code and design as you see fit. Attribution is appreciated but not required.

## 📞 Contact & Links

- **Email**: bergutman@pm.me
- **GitHub**: [github.com/bergutman](https://github.com/bergutman)
- **Website**: [ber.earth](https://ber.earth)
- **Guestbook**: Leave a message on the site!

---

*Built with love, nostalgia, and a healthy dose of sarcasm for the early web era. Last updated: November 2024*
