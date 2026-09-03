import 'package:flutter/material.dart';
import 'messenger_backend.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.backend});
  final MessengerBackend backend;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final email = TextEditingController();
  final password = TextEditingController();
  final username = TextEditingController();
  final name = TextEditingController();
  bool register = false;
  bool busy = false;
  String? error;

  @override
  void dispose() {
    email.dispose();
    password.dispose();
    username.dispose();
    name.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    setState(() { busy = true; error = null; });
    try {
      if (register) {
        await widget.backend.signUp(
          email: email.text,
          password: password.text,
          username: username.text,
          displayName: name.text,
        );
      } else {
        await widget.backend.signIn(email.text, password.text);
      }
    } catch (e) {
      if (mounted) setState(() => error = 'Не удалось выполнить вход. Проверь данные.');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  InputDecoration field(String hint) => InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: const Color(0xFF15151D),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 430),
            child: Column(
              children: [
                Container(
                  width: 78,
                  height: 78,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    gradient: const LinearGradient(colors: [Color(0xFF9A86FF), Color(0xFF5E43C7)]),
                  ),
                  alignment: Alignment.center,
                  child: const Text('KD', style: TextStyle(fontSize: 23, fontWeight: FontWeight.w900)),
                ),
                const SizedBox(height: 22),
                const Text('KD Messenger', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
                const SizedBox(height: 7),
                Text(register ? 'Создай свой аккаунт' : 'Войди в свой аккаунт', style: const TextStyle(color: Colors.white54)),
                const SizedBox(height: 28),
                if (register) ...[
                  TextField(controller: name, textInputAction: TextInputAction.next, decoration: field('Имя')),
                  const SizedBox(height: 12),
                  TextField(controller: username, textInputAction: TextInputAction.next, decoration: field('@username')),
                  const SizedBox(height: 12),
                ],
                TextField(controller: email, keyboardType: TextInputType.emailAddress, textInputAction: TextInputAction.next, decoration: field('Email')),
                const SizedBox(height: 12),
                TextField(controller: password, obscureText: true, onSubmitted: (_) => submit(), decoration: field('Пароль')),
                if (error != null) ...[
                  const SizedBox(height: 12),
                  Text(error!, style: const TextStyle(color: Colors.redAccent)),
                ],
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: FilledButton(
                    onPressed: busy ? null : submit,
                    child: busy ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2)) : Text(register ? 'Создать аккаунт' : 'Войти'),
                  ),
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: busy ? null : () => setState(() { register = !register; error = null; }),
                  child: Text(register ? 'У меня уже есть аккаунт' : 'Создать новый аккаунт'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
