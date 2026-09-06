// ✅ Sirf Auth Signup karein. Profiles me insert bilkul mat likhein.
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      username: username // Ye SQL Trigger read kar lega
    }
  }
});
