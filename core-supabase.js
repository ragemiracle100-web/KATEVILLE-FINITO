// Browser-safe client (no secret keys)
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key' // Safe for browser

export const supabase = supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

// Module loader for future extensions
export const ModuleSystem = {
  loaded: new Set(),
  
  async load(moduleName) {
    if (this.loaded.has(moduleName)) return
    
    const module = await import(`/js/modules/${moduleName}/index.js`)
    if (module.init) await module.init()
    
    this.loaded.add(moduleName)
    console.log(`✅ ${moduleName} loaded`)
  }
}
