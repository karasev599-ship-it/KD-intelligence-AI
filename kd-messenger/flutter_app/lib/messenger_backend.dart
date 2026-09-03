import 'package:supabase_flutter/supabase_flutter.dart';

class MessengerBackend {
  MessengerBackend(this.client);
  final SupabaseClient client;

  User? get currentUser => client.auth.currentUser;

  Future<AuthResponse> signIn(String email, String password) =>
      client.auth.signInWithPassword(email: email.trim(), password: password);

  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String username,
    required String displayName,
  }) async {
    final response = await client.auth.signUp(
      email: email.trim(),
      password: password,
      data: {
        'username': username.replaceFirst('@', '').trim().toLowerCase(),
        'display_name': displayName.trim(),
      },
    );
    return response;
  }

  Future<void> signOut() => client.auth.signOut();

  Future<List<Map<String, dynamic>>> searchProfiles(String query) async {
    final q = query.replaceFirst('@', '').trim();
    if (q.isEmpty) return [];
    final rows = await client
        .from('kd_profiles')
        .select('id, username, display_name, avatar_url, last_seen')
        .or('username.ilike.%$q%,display_name.ilike.%$q%')
        .limit(20);
    return List<Map<String, dynamic>>.from(rows);
  }

  Stream<List<Map<String, dynamic>>> watchMessages(String conversationId) {
    return client
        .from('kd_messages')
        .stream(primaryKey: ['id'])
        .eq('conversation_id', conversationId)
        .order('created_at');
  }

  Future<void> sendMessage({
    required String conversationId,
    required String text,
  }) async {
    final value = text.trim();
    if (value.isEmpty || currentUser == null) return;
    await client.from('kd_messages').insert({
      'conversation_id': conversationId,
      'sender_id': currentUser!.id,
      'body': value,
      'message_type': 'text',
    });
  }
}
