import { loadStripe } from '@stripe/stripe-js';
import { subscriptionService } from './databaseService';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 4.99,
    priceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID || 'price_premium',
    features: [
      'Advanced AI recommendations',
      'Curated lists and collections',
      'Niche content discovery',
      'Priority support',
      'Ad-free experience'
    ]
  }
};

/**
 * Stripe Payment Service
 */
export const stripeService = {
  // Create checkout session for subscription
  async createCheckoutSession(userId, planId = 'premium') {
    try {
      const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Call your backend API to create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          priceId: plan.priceId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription/cancel`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  // Create customer portal session
  async createPortalSession(userId) {
    try {
      const subscription = await subscriptionService.getUserSubscription(userId);
      if (!subscription || !subscription.stripe_customer_id) {
        throw new Error('No active subscription found');
      }

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: subscription.stripe_customer_id,
          returnUrl: window.location.origin,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  },

  // Handle successful subscription
  async handleSubscriptionSuccess(sessionId) {
    try {
      const response = await fetch(`/api/checkout-session/${sessionId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve session');
      }

      const session = await response.json();
      return session;
    } catch (error) {
      console.error('Error handling subscription success:', error);
      throw error;
    }
  },

  // Cancel subscription
  async cancelSubscription(userId) {
    try {
      const subscription = await subscriptionService.getUserSubscription(userId);
      if (!subscription || !subscription.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }
};

/**
 * Mock Stripe Service for Development
 * This provides a fallback when Stripe is not configured
 */
export const mockStripeService = {
  async createCheckoutSession(userId, planId = 'premium') {
    // Simulate checkout process
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate successful subscription
        subscriptionService.upsertSubscription(userId, {
          stripeCustomerId: `cus_mock_${userId}`,
          stripeSubscriptionId: `sub_mock_${Date.now()}`,
          status: 'active',
          planId,
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });
        resolve({ success: true });
      }, 1000);
    });
  },

  async createPortalSession(userId) {
    console.log('Mock portal session for user:', userId);
    return { url: '/subscription/manage' };
  },

  async cancelSubscription(userId) {
    const subscription = await subscriptionService.getUserSubscription(userId);
    if (subscription) {
      await subscriptionService.upsertSubscription(userId, {
        ...subscription,
        status: 'canceled',
      });
    }
    return { success: true };
  }
};

// Export the appropriate service based on environment
export const paymentService = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? stripeService 
  : mockStripeService;
