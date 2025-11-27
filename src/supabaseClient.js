import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://edxnltxzalqudizbxocf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeG5sdHh6YWxxdWRpemJ4b2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTk5NTgsImV4cCI6MjA3OTgzNTk1OH0.4ISEVQEZ0FheQulGd4QXl51ugmlZOGs9to1-UHuPVfs
'

export const supabase = createClient(supabaseUrl, supabaseKey)