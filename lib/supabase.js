import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://gjmvgbeuthouybzspimj.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqbXZnYmV1dGhvdXlienNwaW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODcxNDksImV4cCI6MjA4OTI2MzE0OX0.xPB-JDpzCJyITC32p6NH92Ag9nLPCYO9sj6UsDjbGpA"

export const supabase = createClient(supabaseUrl, supabaseKey)