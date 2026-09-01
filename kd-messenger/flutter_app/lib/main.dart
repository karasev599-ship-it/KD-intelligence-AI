import 'package:flutter/material.dart';

void main() => runApp(const KdMessengerApp());

class KdMessengerApp extends StatelessWidget {
  const KdMessengerApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'KD Messenger',
    theme: ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF08080D),
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF8B5CF6), brightness: Brightness.dark),
      useMaterial3: true,
    ),
    home: const MessengerHome(),
  );
}

class Chat {
  Chat(this.name, this.handle, this.avatar, this.lastMessage, this.time, {this.online = false, this.unread = 0});
  final String name, handle, avatar, lastMessage, time;
  final bool online;
  final int unread;
}

class Message {
  Message(this.text, this.mine, this.time, {this.read = true});
  final String text, time;
  final bool mine, read;
}

class MessengerHome extends StatefulWidget {
  const MessengerHome({super.key});
  @override State<MessengerHome> createState() => _MessengerHomeState();
}

class _MessengerHomeState extends State<MessengerHome> {
  final controller = TextEditingController();
  final searchController = TextEditingController();
  final chats = <Chat>[
    Chat('Алина', '@alina', 'А', 'Доброе утро ❤️', '00:42', online: true),
    Chat('KD Team', '@kdteam', 'KD', 'Новое сообщение', 'Вчера', unread: 2),
  ];
  final messages = <Message>[
    Message('Привет ❤️', false, '00:39'),
    Message('Привет 😎 Как ты?', true, '00:40'),
    Message('Доброе утро ❤️', false, '00:42'),
  ];
  Chat? selected;

  @override void initState() { super.initState(); selected = chats.first; }
  @override void dispose() { controller.dispose(); searchController.dispose(); super.dispose(); }

  void sendMessage() {
    final text = controller.text.trim();
    if (text.isEmpty) return;
    setState(() { messages.add(Message(text, true, _time())); controller.clear(); });
  }
  String _time() => TimeOfDay.now().format(context);

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(child: LayoutBuilder(builder: (context, constraints) {
      final desktop = constraints.maxWidth >= 900;
      if (desktop) return Row(children: [
        SizedBox(width: 330, child: ChatList(chats: chats, selected: selected, onSelect: (c) => setState(() => selected = c))),
        Expanded(child: Conversation(chat: selected!, messages: messages, controller: controller, onSend: sendMessage)),
        const SizedBox(width: 300, child: ProfilePanel()),
      ]);
      return ChatList(chats: chats, selected: selected, onSelect: _openMobileChat);
    })),
  );

  void _openMobileChat(Chat chat) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ConversationPage(chat: chat, messages: messages, controller: controller, onSend: sendMessage)));
}

class ChatList extends StatelessWidget {
  const ChatList({super.key, required this.chats, required this.selected, required this.onSelect});
  final List<Chat> chats; final Chat? selected; final ValueChanged<Chat> onSelect;

  @override
  Widget build(BuildContext context) => Container(
    decoration: const BoxDecoration(border: Border(right: BorderSide(color: Color(0xFF20212A)))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(padding: const EdgeInsets.fromLTRB(20, 18, 16, 12), child: Row(children: [
        const CircleAvatar(radius: 21, backgroundColor: Color(0xFF8B5CF6), child: Text('KD', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12))),
        const SizedBox(width: 12), const Expanded(child: Text('KD Messenger', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800))),
        IconButton(onPressed: () {}, icon: const Icon(Icons.edit_outlined)),
      ])),
      Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: TextField(decoration: InputDecoration(hintText: 'Поиск чатов', prefixIcon: const Icon(Icons.search), filled: true, fillColor: const Color(0xFF15151D), border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none)))),
      const Padding(padding: EdgeInsets.fromLTRB(18, 20, 18, 8), child: Text('ЧАТЫ', style: TextStyle(fontSize: 11, letterSpacing: 1.3, color: Colors.white38, fontWeight: FontWeight.w800))),
      Expanded(child: ListView.builder(itemCount: chats.length, itemBuilder: (_, i) {
        final c = chats[i]; final active = selected == c;
        return InkWell(onTap: () => onSelect(c), child: Container(margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: active ? const Color(0xFF1B1928) : Colors.transparent, borderRadius: BorderRadius.circular(14)), child: Row(children: [
          Stack(children: [CircleAvatar(radius: 25, backgroundColor: const Color(0xFF252535), child: Text(c.avatar, style: const TextStyle(fontWeight: FontWeight.w800))), if (c.online) Positioned(right: 0, bottom: 1, child: Container(width: 13, height: 13, decoration: BoxDecoration(color: const Color(0xFF55D889), shape: BoxShape.circle, border: Border.all(color: const Color(0xFF08080D), width: 2))))]),
          const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(c.name, style: const TextStyle(fontWeight: FontWeight.w700)), const SizedBox(height: 4), Text(c.lastMessage, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white54, fontSize: 13))])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [Text(c.time, style: const TextStyle(color: Colors.white38, fontSize: 11)), if (c.unread > 0) Container(margin: const EdgeInsets.only(top: 5), padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: const BoxDecoration(color: Color(0xFF8B5CF6), shape: BoxShape.circle), child: Text('${c.unread}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800)))])
        ])));
      })),
      const Divider(color: Color(0xFF20212A)),
      ListTile(leading: const CircleAvatar(child: Text('Д')), title: const Text('Даниил', style: TextStyle(fontWeight: FontWeight.w700)), subtitle: const Text('@kd_official', style: TextStyle(color: Colors.white38)), trailing: IconButton(onPressed: () {}, icon: const Icon(Icons.settings_outlined))),
    ]),
  );
}

class ConversationPage extends StatelessWidget {
  const ConversationPage({super.key, required this.chat, required this.messages, required this.controller, required this.onSend});
  final Chat chat; final List<Message> messages; final TextEditingController controller; final VoidCallback onSend;
  @override Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: Row(children: [CircleAvatar(radius: 17, child: Text(chat.avatar)), const SizedBox(width: 10), Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(chat.name, style: const TextStyle(fontSize: 16)), Text(chat.online ? 'в сети' : 'был(а) недавно', style: const TextStyle(fontSize: 11, color: Colors.white54))])]), actions: [IconButton(onPressed: () {}, icon: const Icon(Icons.search))]), body: ConversationBody(messages: messages, controller: controller, onSend: onSend));
}

class Conversation extends StatelessWidget {
  const Conversation({super.key, required this.chat, required this.messages, required this.controller, required this.onSend});
  final Chat chat; final List<Message> messages; final TextEditingController controller; final VoidCallback onSend;
  @override Widget build(BuildContext context) => Column(children: [
    ListTile(leading: CircleAvatar(child: Text(chat.avatar)), title: Text(chat.name, style: const TextStyle(fontWeight: FontWeight.w800)), subtitle: Text(chat.online ? 'в сети' : 'был(а) недавно', style: const TextStyle(color: Colors.white54)), trailing: Row(mainAxisSize: MainAxisSize.min, children: [IconButton(onPressed: () {}, icon: const Icon(Icons.call_outlined)), IconButton(onPressed: () {}, icon: const Icon(Icons.more_horiz))])),
    const Divider(height: 1, color: Color(0xFF20212A)),
    Expanded(child: ConversationBody(messages: messages, controller: controller, onSend: onSend)),
  ]);
}

class ConversationBody extends StatelessWidget {
  const ConversationBody({super.key, required this.messages, required this.controller, required this.onSend});
  final List<Message> messages; final TextEditingController controller; final VoidCallback onSend;
  @override Widget build(BuildContext context) => Column(children: [
    Expanded(child: ListView.builder(padding: const EdgeInsets.all(18), itemCount: messages.length, itemBuilder: (_, i) { final m = messages[i]; return Align(alignment: m.mine ? Alignment.centerRight : Alignment.centerLeft, child: Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10), constraints: const BoxConstraints(maxWidth: 430), decoration: BoxDecoration(color: m.mine ? const Color(0xFF7053D9) : const Color(0xFF191A23), borderRadius: BorderRadius.circular(18)), child: Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.end, children: [Flexible(child: Text(m.text, style: const TextStyle(fontSize: 15))), const SizedBox(width: 8), Text(m.time, style: const TextStyle(fontSize: 9, color: Colors.white54)), if (m.mine) Padding(padding: const EdgeInsets.only(left: 3), child: Icon(m.read ? Icons.done_all : Icons.done, size: 13, color: const Color(0xFFBDAEFF))) ]))); })),
    Padding(padding: const EdgeInsets.fromLTRB(12, 4, 12, 12), child: Row(children: [IconButton(onPressed: () {}, icon: const Icon(Icons.add_circle_outline)), Expanded(child: TextField(controller: controller, onSubmitted: (_) => onSend(), minLines: 1, maxLines: 5, decoration: InputDecoration(hintText: 'Сообщение…', filled: true, fillColor: const Color(0xFF15151D), border: OutlineInputBorder(borderRadius: BorderRadius.circular(22), borderSide: BorderSide.none)))), IconButton(onPressed: onSend, icon: const Icon(Icons.send_rounded, color: Color(0xFF9A86FF)))])),
  ]);
}

class ProfilePanel extends StatelessWidget {
  const ProfilePanel({super.key});
  @override Widget build(BuildContext context) => Container(decoration: const BoxDecoration(border: Border(left: BorderSide(color: Color(0xFF20212A))), color: Color(0xFF0B0C12), child: Column(children: [const SizedBox(height: 42), const CircleAvatar(radius: 58, backgroundColor: Color(0xFF252535), child: Text('А', style: TextStyle(fontSize: 38, fontWeight: FontWeight.w700))), const SizedBox(height: 14), const Text('Алина', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)), const SizedBox(height: 4), const Text('@alina', style: TextStyle(color: Colors.white54)), const SizedBox(height: 10), const Text('в сети', style: TextStyle(color: Color(0xFF55D889), fontSize: 12)), const SizedBox(height: 28), const Divider(color: Color(0xFF20212A)), ListTile(leading: const Icon(Icons.notifications_none), title: const Text('Уведомления'), onTap: () {}), ListTile(leading: const Icon(Icons.search), title: const Text('Поиск'), onTap: () {}), ListTile(leading: const Icon(Icons.photo_library_outlined), title: const Text('Медиа и файлы'), onTap: () {}), ListTile(leading: const Icon(Icons.lock_outline), title: const Text('Безопасность'), onTap: () {})]));
}
