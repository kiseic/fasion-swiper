# Fashion Swiper - Pexels Edition

A modern fashion discovery app using Tinder-style swiping with AI-powered recommendations.

🚀 **Live Demo**: [https://fashion-swiper.vercel.app](https://fashion-swiper.vercel.app)

## ✨ Features

- 👔 **Gender-specific fashion** - Browse men's or women's fashion
- 🔥 **Swipe interface** - Right to like, left to skip
- 🤖 **AI recommendations** - Personalized suggestions powered by OpenAI
- 🔍 **Custom search** - Use your own style prompts
- 📱 **PWA support** - Install as mobile app
- 🖼️ **Local image fallback** - Works without external APIs

## 🛠️ Tech Stack

- **Framework**: Next.js 15.2.4 (App Router)
- **UI**: React 19, TailwindCSS, shadcn/ui
- **Animations**: Framer Motion, react-spring
- **APIs**: OpenAI GPT-4, Pexels (optional)
- **Deployment**: Vercel Edge Functions

## 🚀 Deploy to Vercel

Deploy your own instance with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Ffashion-swiper&env=OPENAI_API_KEY,PEXELS_API_KEY&envDescription=API%20keys%20required%20for%20the%20app&envLink=https%3A%2F%2Fgithub.com%2Fyourusername%2Ffashion-swiper%23environment-variables)

## 📋 Environment Variables

Create a `.env.local` file or set these in Vercel:

```env
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional (falls back to local images if not provided)
PEXELS_API_KEY=your_pexels_api_key
```

### Getting API Keys:

- **OpenAI**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Pexels**: [https://www.pexels.com/api/](https://www.pexels.com/api/)

## 💻 Local Development

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/fashion-swiper.git
cd fashion-swiper
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

4. **Run development server**:
```bash
npm run dev
```

5. **Open** [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
fashion-swiper/
├── app/
│   ├── api/
│   │   ├── photos/      # Photo fetching endpoint
│   │   └── recommend/   # AI recommendations endpoint
│   ├── swipe/          # Swipe interface
│   └── recommendations/ # Results page
├── components/         # React components
├── images/            # Local image fallback
└── public/            # Static assets & PWA manifest
```

## 🖼️ Local Images

The app can work without external APIs:

1. Add images to `/images` directory
2. Use naming format: `[timestamp]_[size].jpg`
3. Supported sizes: 80, 120, 125, 276, 320

## 🎨 Customization

### Styling
- Edit `app/globals.css` for global styles
- Modify component styles in `/components/ui/`
- Theme configuration in `tailwind.config.ts`

### API Routes
- Photo logic: `app/api/photos/route.ts`
- AI recommendations: `app/api/recommend/route.ts`

## ⚡ Performance

- Edge runtime for faster API responses
- Image optimization with Next.js
- React Server Components
- Automatic code splitting

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [Pexels](https://www.pexels.com/) for fashion photos
- [shadcn/ui](https://ui.shadcn.com/) for components
- [OpenAI](https://openai.com/) for AI capabilities
- [Vercel](https://vercel.com/) for hosting
