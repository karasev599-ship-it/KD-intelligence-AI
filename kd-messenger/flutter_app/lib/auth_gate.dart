import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'app_config.dart';
import 'auth_screen.dart';
import 'messenger_backend.dart';

class AuthGate extends StatelessWidget {
  const AuthGate({super.key, required this.authenticatedChild});
  final Widget authenticatedChild;

  @override
  Widget build(BuildContext context) {
    if (!KdAppConfig.hasSupabase) return authenticatedChild;
    final client = Supabase.instance.client;
    return StreamBuilder<AuthState>(
      stream: client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        final session = snapshot.data?.session ?? client.auth.currentSession;
        if (session == null) return AuthScreen(backend: MessengerBackend(client));
        return authenticatedChild;
      },
    );
  }
}
