/**
 * LandGuard AI - Stripe Checkout Session
 * POST /api/create-checkout-session
 * 
 * All prices in CAD (billed in CAD, shown in local currency on website):
 * - LandGuard Pro Monthly: $14.99 CAD/month
 * - LandGuard Pro Yearly: $143.88 CAD/year ($11.99/month, save 20%)
 * - API Starter: $269 CAD/month (5,000 credits)
 * - API Growth: $1,079 CAD/month (25,000 credits)
 * - API Business: $3,374 CAD/month (100,000 credits)
 * 
 * Stripe Price IDs (set in environment variables):
 * - STRIPE_PRO_MONTHLY_PRICE_ID
 * - STRIPE_PRO_YEARLY_PRICE_ID
 * - STRIPE_API_STARTER_PRICE_ID
 * - STRIPE_API_GROWTH_PRICE_ID
 * - STRIPE_API_BUSINESS_PRICE_ID
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

// Price IDs from Stripe Dashboard (all in CAD)
const PRICE_IDS: Record<string, string | undefined> = {
  // Pro Plans (Chrome Extension & Web App)
  'pro-monthly': process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  'pro-yearly': process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  
  // API Plans
  'api-starter': process.env.STRIPE_API_STARTER_PRICE_ID,
  'api-growth': process.env.STRIPE_API_GROWTH_PRICE_ID,
  'api-business': process.env.STRIPE_API_BUSINESS_PRICE_ID,
  
  // Legacy support
  'pro': process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
}

interface CheckoutRequest {
  plan: string
  email?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json()
    const { plan, email } = body

    // Validate Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Checkout] STRIPE_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const priceId = PRICE_IDS[plan]
    if (!priceId) {
      console.error('[Checkout] Invalid plan or price not configured:', plan)
      console.error('[Checkout] Available price IDs:', PRICE_IDS)
      return NextResponse.json(
        { error: `Invalid plan selected: ${plan}. Please contact support.` },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://landguardai.co'

    console.log('[Checkout] Creating session for plan:', plan, 'priceId:', priceId)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        plan,
        source: 'landguard-website',
      },
    })

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id
    })

  } catch (error: unknown) {
    console.error('[Checkout] Error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe Error: ${error.message}` },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
