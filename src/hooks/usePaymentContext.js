import { useWalletClient } from "wagmi";
import { useCallback, useState } from "react";
import axios from "axios";
import { withPaymentInterceptor, decodeXPaymentResponse } from "x402-axios";
import { paymentService, mockStripeService } from "../services/stripeService";
import { useUser } from "../context/UserContext";

export function usePaymentContext() {
  const { data: walletClient, isError, isLoading } = useWalletClient();
  const { user, refreshSubscription } = useUser();
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Legacy wallet-based payment method
  const createSession = useCallback(async () => {
    if (!walletClient || !walletClient.account) throw new Error("please connect your wallet");
    if (isError) throw new Error("wallet not connected");
    if (isLoading) throw new Error("wallet is loading");
    
    const baseClient = axios.create({
      baseURL: "https://payments.vistara.dev",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    const apiClient = withPaymentInterceptor(baseClient, walletClient);
    const response = await apiClient.post("/api/payment", { amount: "$4.99" });
    const paymentResponse = response.config.headers["X-PAYMENT"];
    
    if (!paymentResponse) throw new Error("payment response is absent");
    
    const decoded = decodeXPaymentResponse(paymentResponse);
    console.log(`decoded payment response: ${JSON.stringify(decoded)}`);
    
    return decoded;
  }, [walletClient, isError, isLoading]);

  // New Stripe-based subscription method
  const createStripeSubscription = useCallback(async (planId = 'premium') => {
    if (!user?.userId && !user?.user_id) {
      throw new Error("User must be logged in to subscribe");
    }

    setPaymentLoading(true);
    try {
      const userId = user.userId || user.user_id;
      await paymentService.createCheckoutSession(userId, planId);
      
      // Refresh subscription status after successful payment
      setTimeout(() => {
        refreshSubscription();
      }, 2000);
      
    } catch (error) {
      console.error('Stripe subscription failed:', error);
      throw error;
    } finally {
      setPaymentLoading(false);
    }
  }, [user, refreshSubscription]);

  // Mock subscription for development/demo
  const createMockSubscription = useCallback(async (planId = 'premium') => {
    if (!user?.userId && !user?.user_id) {
      throw new Error("User must be logged in to subscribe");
    }

    setPaymentLoading(true);
    try {
      const userId = user.userId || user.user_id;
      await mockStripeService.createCheckoutSession(userId, planId);
      
      // Refresh subscription status
      setTimeout(() => {
        refreshSubscription();
      }, 1000);
      
      return { success: true };
    } catch (error) {
      console.error('Mock subscription failed:', error);
      throw error;
    } finally {
      setPaymentLoading(false);
    }
  }, [user, refreshSubscription]);

  // Manage subscription (open customer portal)
  const manageSubscription = useCallback(async () => {
    if (!user?.userId && !user?.user_id) {
      throw new Error("User must be logged in to manage subscription");
    }

    try {
      const userId = user.userId || user.user_id;
      await paymentService.createPortalSession(userId);
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      throw error;
    }
  }, [user]);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (!user?.userId && !user?.user_id) {
      throw new Error("User must be logged in to cancel subscription");
    }

    setPaymentLoading(true);
    try {
      const userId = user.userId || user.user_id;
      await paymentService.cancelSubscription(userId);
      
      // Refresh subscription status
      setTimeout(() => {
        refreshSubscription();
      }, 1000);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    } finally {
      setPaymentLoading(false);
    }
  }, [user, refreshSubscription]);

  return { 
    // Legacy method
    createSession,
    
    // New Stripe methods
    createStripeSubscription,
    createMockSubscription,
    manageSubscription,
    cancelSubscription,
    paymentLoading
  };
}
