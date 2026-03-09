import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const { data: tenants } = await supabase.from('tenants').select('*')
  const { data: members } = await supabase.from('tenant_members').select('*')
  
  console.log("TENANTS:", JSON.stringify(tenants, null, 2))
  console.log("MEMBERS:", JSON.stringify(members, null, 2))
}

main()
