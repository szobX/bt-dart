import { createError } from 'h3';
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);

  const { data, error } = await client
    .from('players')
    .select('id, nickname, description');
  if (error) {
    throw createError({ statusMessage: error.message });
  }

  return data;
});
