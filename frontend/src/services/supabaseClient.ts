import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mlgkdyeujcglwlfdirin.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_HGJD0kFeVf03Gm-4vft8uQ_b4R4Om9P'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)