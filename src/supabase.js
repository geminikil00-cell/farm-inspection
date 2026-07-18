import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qedkrrsjuwmhbvqdlrgb.supabase.co"
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZGtycnNqdXdtaGJ2cWRscmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NzAzMzUsImV4cCI6MjA4OTA0NjMzNX0.GJfVkXYTMy7qxKd9CsgJRm1vpOPpFXu1zgTzQ0uuo7E"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
