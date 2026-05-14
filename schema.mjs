import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://gnmidorsweqwgxgerrhr.supabase.co', 'sb_publishable_-b2fwM1e3ZZ-L2iPVEcPAw_erpstNAc')

async function main() {
  const { data, error } = await supabase.from('posts').select('*').limit(1)
  console.log(Object.keys(data[0]))
}
main()
