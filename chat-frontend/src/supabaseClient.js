import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ktqiqrqtiyahizybdwgj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cWlxcnF0aXlhaGl6eWJkd2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NTk1MTAsImV4cCI6MjA4MjUzNTUxMH0.cAAPnk_W1nEH1iQ4fXlLgZK9EDEG__Q9viqiKSJjgWE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
