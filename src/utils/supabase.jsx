import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mpojfmrrypszcjjpejes.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wb2pmbXJyeXBzemNqanBlamVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDEyOTcsImV4cCI6MjA4MDE3NzI5N30.wwCMf1dc4XliWiEzxtZKABzZO75AO0oeEwWdydai_qg'
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase