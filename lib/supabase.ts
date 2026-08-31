import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qqedhmcuwdntaafrwodp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZWRobWN1d2RudGFhZnJ3b2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNzQwNjMsImV4cCI6MjEwMzc1MDA2M30.nLO5EyoZO_NZWETOLAl6fDBZwM68hFaFol0FOcgdDWc';

export const supabase = createClient(supabaseUrl, supabaseKey);
