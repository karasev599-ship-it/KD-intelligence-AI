import 'package:flutter/material.dart';

void main() {
  runApp(const KdMessengerApp());
}

class KdMessengerApp extends StatelessWidget {
  const KdMessengerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'KD Messenger',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF08080D),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF8B5CF6),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const MessengerShell(),
    );
  }
}

class MessengerShell extends StatelessWidget {
  const MessengerShell({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final desktop = constraints.maxWidth >= 900;
            return Row(
              children: [
                SizedBox(
                  width: desktop ? 340 : constraints.maxWidth,
                  child: const ChatList(),
                ),
                if (desktop) const Expanded(child: Conversation()),
                if (desktop) const SizedBox(width: 300, child: ProfilePanel()),
              ],
            );
          },
        ),
      ),
    );
  }
}

class ChatList extends StatelessWidget {
  const ChatList({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: Row(
            children: [
              CircleAvatar(radius: 20, child: Text('KD')),
              SizedBox(width: 12),
              Text('KD Messenger', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Поиск чатов',
              prefixIcon: const Icon(Icons.search),
              filled: true,
              fillColor: const Color(0xFF15151D),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            ),
          ),
        ),
        const SizedBox(height: 12),
        const Expanded(
          child: ListView(
            children: [
              ListTile(leading: CircleAvatar(child: Text('А')), title: Text('Алина'), subtitle: Text('Доброе утро ❤️'), trailing: Text('00:42')),
              ListTile(leading: CircleAvatar(child: Text('K')), title: Text('KD Team'), subtitle: Text('Новое сообщение'), trailing: Text('Вчера')),
            ],
          ),
        ),
      ],
    );
  }
}

class Conversation extends StatelessWidget {
  const Conversation({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const ListTile(title: Text('Алина', style: TextStyle(fontWeight: FontWeight.w700)), subtitle: Text('в сети'), leading: CircleAvatar(child: Text('А'))),
        const Divider(height: 1),
        const Expanded(
          child: Center(child: Text('Начните общение', style: TextStyle(color: Colors.white54))),
        ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Сообщение…',
              prefixIcon: const Icon(Icons.add_circle_outline),
              suffixIcon: IconButton(onPressed: () {}, icon: const Icon(Icons.send)),
              filled: true,
              fillColor: const Color(0xFF15151D),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(22), borderSide: BorderSide.none),
            ),
          ),
        ),
      ],
    );
  }
}

class ProfilePanel extends StatelessWidget {
  const ProfilePanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        SizedBox(height: 40),
        CircleAvatar(radius: 52, child: Text('А', style: TextStyle(fontSize: 34))),
        SizedBox(height: 12),
        Text('Алина', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
        Text('@alina', style: TextStyle(color: Colors.white54)),
      ],
    );
  }
}
