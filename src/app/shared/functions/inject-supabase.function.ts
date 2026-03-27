
import { inject } from '@angular/core';
import { SupabaseService } from '../../services/supabase/supabase.service'; // adjust path as needed
export const injectSupabase = () => {
  const supabaseService = inject(SupabaseService);
  return supabaseService.supabase;
}
