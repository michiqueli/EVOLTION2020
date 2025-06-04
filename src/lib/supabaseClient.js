import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivbkelzmuryvmxpdkwzp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2YmtlbHptdXJ5dm14cGRrd3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NDM4ODYsImV4cCI6MjA2NDAxOTg4Nn0.qcJzgN5hwW930jrcNduEJiPsL_N-1ub-zANy803vVZU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);