import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// 1. Stripe initialisieren
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any, // "as any" löst den TypeScript-Fehler deines neuen Stripe-Pakets
})

// 2. Supabase Admin-Client (darf als Admin in die Datenbank schreiben)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const payload = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event

  try {
    // Verifiziert, dass der Request WIRKLICH von Stripe kommt (Hacker-Schutz)
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // 3. Nur erfolgreiche Checkouts verarbeiten
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    
    // Die E-Mail-Adresse, die der Kunde beim Bezahlen angegeben hat
    const customerEmail = session.customer_details?.email

    if (customerEmail) {
      const cleanEmail = customerEmail.trim().toLowerCase()

      // 4. E-Mail in deine Supabase beta_whitelist eintragen
      const { error } = await supabaseAdmin
        .from('beta_whitelist')
        .insert([{ email: cleanEmail }])

      if (error) {
        // Falls die E-Mail schon drinsteht (unique constraint), ignorieren wir den Fehler einfach
        if (error.code === '23505') {
          console.log(`Email ${cleanEmail} is already whitelisted.`)
        } else {
          console.error('Supabase Insert Error:', error)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }
      } else {
        console.log(`Successfully whitelisted: ${cleanEmail}`)
      }
    }
  }

  // Wichtig: Stripe erwartet immer einen 200er Status zurück, sonst senden sie den Webhook nochmal
  return NextResponse.json({ received: true }, { status: 200 })
}