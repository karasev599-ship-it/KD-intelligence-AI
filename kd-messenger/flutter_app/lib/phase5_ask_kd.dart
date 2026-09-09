import 'package:flutter/material.dart';

class AskKdSheet extends StatelessWidget {
  const AskKdSheet({super.key, required this.conversationId, required this.messageIds});
  final String conversationId;
  final List<String> messageIds;

  @override
  Widget build(BuildContext context) {
    return SafeArea(child: Padding(padding: const EdgeInsets.all(20), child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Ask KD', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
      const SizedBox(height: 8),
      Text('${messageIds.length} сообщений • $conversationId', style: const TextStyle(color: Colors.white54)),
      const SizedBox(height: 18),
      _action(context, Icons.summarize_outlined, 'Сделать краткую сводку'),
      _action(context, Icons.checklist_outlined, 'Найти задачи и договорённости'),
      _action(context, Icons.auto_awesome_outlined, 'Объяснить выбранное'),
    ])));
  }

  Widget _action(BuildContext context, IconData icon, String title) => ListTile(leading: Icon(icon), title: Text(title), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), onTap: () => Navigator.pop(context, title));
}
