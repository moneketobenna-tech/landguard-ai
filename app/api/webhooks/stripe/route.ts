/**
 * LandGuard AI - Stripe Webhook Handler
 * POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createUser, getUserByEmail, updateUserPlan } from '@/lib/db/users'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } else {
        event = JSON.parse(body) as Stripe.Event
      }
    } catch (err) {
      console.error('[Webhook] Signature error:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`[Webhook] Event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const email = session.customer_email
        const customerId = session.customer as string

        if (!email) {
          console.error('[Webhook] No email in session')
          break
        }

        // Find or create user
        let user = await getUserByEmail(email)
        
        if (!user) {
          // Create new user with random password
          const password = generatePassword()
          const passwordHash = await bcrypt.hash(password, 12)
          user = await createUser(email, passwordHash)
          console.log(`[Webhook] Created new user: ${email}`)
        }

        // Upgrade to Pro
        await updateUserPlan(user.id, 'pro', customerId)
        console.log(`[Webhook] Upgraded user to Pro: ${email}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID and downgrade
        // TODO: Implement getUserByStripeId
        console.log(`[Webhook] Subscription cancelled for customer: ${customerId}`)
        break
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}

