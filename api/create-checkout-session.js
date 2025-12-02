// api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(request, response) {
  if (request.method === 'POST') {
    try {
      const { priceId } = request.body;
      
      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: priceId.includes('recurring') ? 'subscription' : 'payment', // Logic handled by Stripe usually, but good to know
        success_url: `${request.headers.origin}/?success=true`,
        cancel_url: `${request.headers.origin}/?canceled=true`,
      });

      return response.status(200).json({ url: session.url });
    } catch (err) {
      return response.status(500).json({ error: err.message });
    }
  } else {
    response.setHeader('Allow', 'POST');
    response.status(405).end('Method Not Allowed');
  }
}