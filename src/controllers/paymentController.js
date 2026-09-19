import prisma from '../config/db.js';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development';
const stripe = new Stripe(stripeKey);

export const createCheckoutSession = async (req, res, next) => {
  try {
    const { tenantId, plan, seats } = req.body;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Dummy Price IDs (in a real app, these come from your Stripe Dashboard)
    const planPrices = {
      'Starter': 'price_starter_dummy',
      'Professional': 'price_pro_dummy',
      'Enterprise AI': 'price_enterprise_dummy'
    };

    let unitAmount;
    if (plan === 'Starter') unitAmount = 60000; // $600.00
    else if (plan === 'Professional') unitAmount = 120000; // $1200.00
    else unitAmount = 250000; // $2500.00

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `SkillPulse ${plan} Plan`,
              description: `Includes up to ${seats} seats`
            },
            unit_amount: unitAmount,
            recurring: { interval: 'month' }
          },
          quantity: 1, // Flat fee instead of per-user multiplier
        },
      ],
      client_reference_id: tenantId,
      metadata: {
        tenantId,
        plan,
        seats: String(seats || 1)
      },
      success_url: `${process.env.CLIENT_URL}/company-admin/settings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/company-admin/settings?payment=cancelled`,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyCheckoutSession = async (req, res, next) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ success: false, message: 'Session ID is required' });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid') {
      const tenantId = session.metadata.tenantId;
      const plan = session.metadata.plan;
      const seats = parseInt(session.metadata.seats);

      if (tenantId) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            plan: plan === 'Enterprise AI' ? 'ENTERPRISE' : plan === 'Starter' ? 'STARTER' : 'PRO',
            maxUsers: seats,
            status: 'ACTIVE'
          }
        });
      }
      return res.json({ success: true, message: 'Payment verified and plan updated' });
    } else {
      return res.json({ success: false, message: 'Payment not successful yet' });
    }
  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleStripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle Stripe Webhook Events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const tenantId = session.client_reference_id || session.metadata?.tenantId;
      const plan = session.metadata?.plan;
      const seats = parseInt(session.metadata?.seats || '100');

      if (tenantId) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            plan: plan === 'Enterprise AI' ? 'ENTERPRISE' : plan === 'Starter' ? 'STARTER' : 'PRO',
            maxUsers: seats,
            status: 'ACTIVE'
          }
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      // Automatic monthly charge failed (declined card, insufficient funds) -> Set status to PENDING_PAYMENT (Past Due)
      const invoice = event.data.object;
      const stripeCustomerId = invoice.customer;

      if (stripeCustomerId) {
        await prisma.tenant.updateMany({
          where: { stripeCustomerId },
          data: { status: 'PENDING_PAYMENT' }
        });
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      // Monthly recurring renewal payment succeeded -> Ensure status is ACTIVE
      const invoice = event.data.object;
      const stripeCustomerId = invoice.customer;

      if (stripeCustomerId) {
        await prisma.tenant.updateMany({
          where: { stripeCustomerId },
          data: { status: 'ACTIVE' }
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      // Subscription canceled -> Set status to SUSPENDED (Block Access)
      const subscription = event.data.object;
      const stripeCustomerId = subscription.customer;

      if (stripeCustomerId) {
        await prisma.tenant.updateMany({
          where: { stripeCustomerId },
          data: { status: 'SUSPENDED' }
        });
      }
      break;
    }

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  res.json({ received: true });
};
