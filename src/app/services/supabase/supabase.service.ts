import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://mcqxtigmsznmykzoaeqg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jcXh0aWdtc3pubXlrem9hZXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzA2NjEsImV4cCI6MjA4OTg0NjY2MX0.66XeaiDqmOjPn7ZhP_gSYAO-VufBaVucMNsm93GpZ2E',
    );
  }
}
