import Order from '../models/Order.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

// Initialize Stripe only if API key is available
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    const Stripe = (await import('stripe')).default;
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    logger.info('Stripe initialized successfully');
  } else {
    logger.warn('Stripe API key not found. Payment features will be limited.');
  }
} catch (error) {
  logger.error('Failed to initialize Stripe:', error);
}

// @desc    Create payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
export const createPaymentIntent = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Payment service is not configured', 503);
    }

    const { amount, currency = 'inr', orderId, paymentMethod } = req.body;

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit
      currency,
      metadata: {
        orderId,
        userId: req.user.id
      },
      payment_method_types: paymentMethod === 'card' ? ['card'] : 
                           paymentMethod === 'upi' ? ['upi'] : 
                           ['card', 'upi']
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPayment = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Payment service is not configured', 503);
    }

    const { paymentIntentId, orderId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order payment status
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'completed';
        order.paymentDetails = {
          transactionId: paymentIntent.id,
          paymentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          method: paymentIntent.payment_method_types[0],
          status: paymentIntent.status,
          paymentTime: new Date()
        };
        order.paymentDate = new Date();
        order.status = 'confirmed';
        
        await order.save();

        // Emit socket event
        if (req.io) {
          req.io.to(`order:${orderId}`).emit('payment_success', {
            orderId: order._id,
            orderNumber: order.orderNumber
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          status: paymentIntent.status,
          orderId
        }
      });
    } else {
      throw new AppError('Payment not successful', 400);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Private
export const getPaymentMethods = async (req, res, next) => {
  try {
    if (!stripe) {
      // Return empty array if Stripe is not configured
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Get user's saved payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: req.user.stripeCustomerId,
      type: 'card'
    });

    res.status(200).json({
      success: true,
      data: paymentMethods.data.map(method => ({
        id: method.id,
        brand: method.card.brand,
        last4: method.card.last4,
        expMonth: method.card.exp_month,
        expYear: method.card.exp_year,
        isDefault: method.metadata?.isDefault === 'true'
      }))
    });
  } catch (error) {
    // If no customer exists or error, return empty array
    res.status(200).json({
      success: true,
      data: []
    });
  }
};

// @desc    Add payment method
// @route   POST /api/payments/methods
// @access  Private
export const addPaymentMethod = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Payment service is not configured', 503);
    }

    const { paymentMethodId, setAsDefault } = req.body;

    // Get or create Stripe customer
    let customerId = req.user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: {
          userId: req.user.id
        }
      });
      customerId = customer.id;
      
      // Save customer ID to user
      await User.findByIdAndUpdate(req.user.id, { stripeCustomerId: customerId });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });

    if (setAsDefault) {
      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Payment method added successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove payment method
// @route   DELETE /api/payments/methods/:methodId
// @access  Private
export const removePaymentMethod = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Payment service is not configured', 503);
    }

    const { methodId } = req.params;

    // Detach payment method from customer
    await stripe.paymentMethods.detach(methodId);

    res.status(200).json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set default payment method
// @route   PUT /api/payments/methods/:methodId/default
// @access  Private
export const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Payment service is not configured', 503);
    }

    const { methodId } = req.params;

    // Get customer ID
    const customerId = req.user.stripeCustomerId;
    if (!customerId) {
      throw new AppError('No payment methods found', 404);
    }

    // Set as default
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: methodId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Default payment method updated'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private/Admin
export const processRefund = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Payment service is not configured', 503);
    }

    const { paymentIntentId, amount, reason } = req.body;

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || 'requested_by_customer'
    });

    res.status(200).json({
      success: true,
      data: refund
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle webhook
// @route   POST /api/payments/webhook
// @access  Public
export const handleWebhook = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Payment service is not configured', 503);
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handlePaymentFailure(failedPayment);
        break;
        
      case 'charge.refunded':
        const refund = event.data.object;
        await handleRefund(refund);
        break;
        
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

// Helper functions for webhook handling
async function handlePaymentSuccess(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId);
    
    if (order) {
      order.paymentStatus = 'completed';
      order.paymentDetails = {
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        method: paymentIntent.payment_method_types[0],
        status: paymentIntent.status,
        paymentTime: new Date()
      };
      order.paymentDate = new Date();
      order.status = 'confirmed';
      
      await order.save();
      
      logger.info(`Payment succeeded for order: ${orderId}`);
    }
  } catch (error) {
    logger.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId);
    
    if (order) {
      order.paymentStatus = 'failed';
      order.status = 'failed';
      
      await order.save();
      
      logger.info(`Payment failed for order: ${orderId}`);
    }
  } catch (error) {
    logger.error('Error handling payment failure:', error);
  }
}

async function handleRefund(refund) {
  try {
    // Find order by payment intent ID
    const order = await Order.findOne({
      'paymentDetails.transactionId': refund.payment_intent
    });
    
    if (order) {
      order.paymentStatus = 'refunded';
      order.status = 'refunded';
      
      await order.save();
      
      logger.info(`Refund processed for order: ${order._id}`);
    }
  } catch (error) {
    logger.error('Error handling refund:', error);
  }
}

// @desc    Verify payment (Razorpay)
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new AppError('Razorpay is not configured', 503);
    }

    // For Razorpay integration
    const crypto = await import('crypto');
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      res.status(200).json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      throw new AppError('Invalid signature', 400);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create Razorpay order
// @route   POST /api/payments/create-razorpay-order
// @access  Private
export const createRazorpayOrder = async (req, res, next) => {
  try {
    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new AppError('Razorpay is not configured', 503);
    }

    const { amount, currency = 'INR', orderId } = req.body;

    // For Razorpay integration
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: orderId,
      notes: {
        orderId
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: razorpayOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res, next) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
      paymentStatus: { $in: ['completed', 'refunded'] }
    })
      .select('orderNumber totalAmount paymentStatus paymentDetails createdAt')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};