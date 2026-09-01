class KdMessengerConfig {
  const KdMessengerConfig({required this.supabaseUrl, required this.supabaseAnonKey});

  final String supabaseUrl;
  final String supabaseAnonKey;

  bool get isReady => supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  static const fromEnvironment = KdMessengerConfig(
    supabaseUrl: String.fromEnvironment('KD_SUPABASE_URL'),
    supabaseAnonKey: String.fromEnvironment('KD_SUPABASE_ANON_KEY'),
  );
}
