// First-run admin setup — creates the owner account.
// Disabled automatically once any owner account exists.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  // Check if any owner account already exists
  const { data: existingOwner } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'owner')
    .limit(1)
    .single()

  if (existingOwner) {
    return NextResponse.json(
      { error: 'An owner account already exists. Use /admin/login to sign in.' },
      { status: 403 }
    )
  }

  const { email, password, name } = await request.json() as {
    email: string
    password: string
    name?: string
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  // Use service role to create the user
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !newUser.user) {
    return NextResponse.json({ error: createError?.message ?? 'Failed to create user' }, { status: 500 })
  }

  // Create profile with owner role
  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: newUser.user.id,
    email,
    full_name: name ?? null,
    role: 'owner',
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Owner account created. You can now sign in at /admin/login.' })
}
