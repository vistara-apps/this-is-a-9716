# CineMatch AI

A web application that uses AI to provide hyper-personalized entertainment recommendations, helping users overcome decision paralysis.

## 🎬 Features

### Core Features
- **AI-Powered Recommendation Engine**: Analyzes user preferences to generate highly tailored movie and show suggestions
- **Time-Based & Mood-Based Curation**: Filter recommendations based on available watch time or current mood
- **Niche Content Discovery**: Highlights content from specific genres, directors, or themes
- **Premium Subscription**: Enhanced AI recommendations and curated lists for $4.99/month

### User Experience
- Personalized onboarding flow
- Interactive recommendation cards with like/dislike/save functionality
- User profile management with subscription handling
- Responsive design with dark theme
- Real-time recommendation updates

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key (or OpenRouter API key)
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vistara-apps/this-is-a-9716.git
   cd this-is-a-9716
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your API keys and configuration:
   ```env
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
   ```

4. **Set up Supabase database**
   
   Run the following SQL in your Supabase SQL editor:
   ```sql
   -- Users table
   CREATE TABLE users (
     user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT UNIQUE NOT NULL,
     preferences JSONB DEFAULT '{}',
     watch_history TEXT[] DEFAULT '{}',
     liked_content TEXT[] DEFAULT '{}',
     disliked_content TEXT[] DEFAULT '{}',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Content table
   CREATE TABLE content (
     content_id TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     genre TEXT[],
     release_date DATE,
     duration INTEGER,
     streaming_platforms TEXT[],
     keywords TEXT[],
     mood_tags TEXT[],
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- User preferences table
   CREATE TABLE user_preferences (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
     content_id TEXT,
     preference_type TEXT NOT NULL,
     score FLOAT DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- User interactions table
   CREATE TABLE user_interactions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
     content_id TEXT NOT NULL,
     interaction_type TEXT NOT NULL,
     metadata JSONB DEFAULT '{}',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Subscriptions table
   CREATE TABLE subscriptions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
     stripe_customer_id TEXT,
     stripe_subscription_id TEXT,
     status TEXT NOT NULL DEFAULT 'inactive',
     plan_id TEXT,
     current_period_start TIMESTAMP WITH TIME ZONE,
     current_period_end TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library
- **RainbowKit** - Web3 wallet connection (optional)

### Backend Services
- **Supabase** - Database, authentication, and real-time features
- **OpenAI API** - AI-powered recommendations
- **Stripe** - Payment processing and subscription management

### State Management
- **React Context** - User and recommendation state
- **Custom Hooks** - Reusable logic for recommendations and payments

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.jsx    # Main dashboard view
│   ├── RecommendationCard.jsx
│   ├── UserProfile.jsx  # User profile management
│   ├── OnboardingFlow.jsx
│   └── ...
├── context/             # React context providers
│   ├── UserContext.jsx  # User state management
│   └── RecommendationContext.jsx
├── hooks/               # Custom React hooks
│   ├── useRecommendations.js
│   └── usePaymentContext.js
├── services/            # API and external services
│   ├── aiService.js     # OpenAI integration
│   ├── databaseService.js # Supabase operations
│   └── paymentService.js # Stripe integration
└── styles/              # CSS and styling
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_OPENAI_API_KEY` | OpenAI API key for recommendations | Yes |
| `VITE_OPENROUTER_API_KEY` | Alternative to OpenAI | Optional |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `VITE_STRIPE_PREMIUM_PRICE_ID` | Stripe price ID for premium plan | Yes |

### Design System

The app uses a custom design system with:
- **Colors**: Primary blue, accent teal, dark theme
- **Typography**: Responsive text scales
- **Components**: Reusable UI components with variants
- **Motion**: Smooth transitions and animations

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting provider

## 🔒 Security

- Environment variables are properly configured for client-side use
- Supabase handles authentication and authorization
- Stripe handles secure payment processing
- No sensitive data is stored in localStorage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/vistara-apps/this-is-a-9716/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Social features (sharing recommendations)
- [ ] Advanced filtering options
- [ ] Integration with more streaming platforms
- [ ] Collaborative filtering recommendations
- [ ] Watchlist synchronization across platforms
