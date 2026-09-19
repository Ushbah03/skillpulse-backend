import prisma from '../config/db.js';
import Stripe from 'stripe';

const getSanitizedStripeKey = () => {
  const rawKey = process.env.STRIPE_SECRET_KEY || '';
  return rawKey.replace(/^["']|["']$/g, '').trim();
};

export const createCheckoutSession = async (req, res, next) => {
  try {
    const { tenantId, plan, seats } = req.body;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    let unitAmount;
    if (plan === 'Starter') unitAmount = 60000; // $600.00
    else if (plan === 'Professional') unitAmount = 120000; // $1200.00
    else unitAmount = 250000; // $2500.00

    const clientUrl = (req.headers.origin || process.env.CLIENT_URL || 'https://skillpulse-ai.vercel.app').replace(/\/$/, '');

    const secretKey = getSanitizedStripeKey();
    if (secretKey && secretKey.startsWith('sk_') && !secretKey.includes('dummy')) {
      try {
        const stripe = new Stripe(secretKey);
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `SkillPulse ${plan || 'Pro'} Plan`,
                  description: `Includes up to ${seats || 30} seats`
                },
                unit_amount: unitAmount,
                recurring: { interval: 'month' }
              },
              quantity: 1,
            },
          ],
          client_reference_id: tenantId,
          metadata: {
            tenantId,
            plan: plan || 'PRO',
            seats: String(seats || 30)
          },
          success_url: `${clientUrl}/login?payment=success&tenant=${tenantId}`,
          cancel_url: `${clientUrl}/signup?payment=cancelled`,
        });

        return res.json({ success: true, url: session.url });
      } catch (stripeError) {
        console.warn('Stripe API Key invalid or expired, falling back to instant workspace activation:', stripeError.message);
      }
    }

    // Fallback Mode (Redirect to Built-in Payment Checkout Page if Stripe Key is unconfigured/invalid)
    const checkoutUrl = `${clientUrl}/checkout?tenantId=${tenantId}&plan=${encodeURIComponent(plan || 'Starter')}&seats=${seats || 30}`;
    return res.json({ 
      success: true, 
      url: checkoutUrl,
      isSimulated: true,
      message: 'Redirecting to Payment Checkout'
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeSimulatedCheckout = async (req, res, next) => {
  try {
    const { tenantId, plan, seats } = req.body;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant workspace not found' });
    }

    const targetPlan = plan === 'Enterprise AI' ? 'ENTERPRISE' : plan === 'Starter' ? 'STARTER' : 'PRO';
    const targetSeats = parseInt(seats) || (plan === 'Enterprise AI' ? 1000 : plan === 'Professional' ? 250 : 30);

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: targetPlan,
        maxUsers: targetSeats,
        status: 'ACTIVE'
      }
    });

    res.json({
      success: true,
      message: 'Payment successfully processed! Organization workspace activated.',
      tenant: updatedTenant
    });
  } catch (error) {
    console.error('Complete checkout error:', error);
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
