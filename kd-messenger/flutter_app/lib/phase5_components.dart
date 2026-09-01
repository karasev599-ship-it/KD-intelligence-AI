import 'package:flutter/material.dart';
import 'phase5_models.dart';

class AskKdSheet extends StatefulWidget {
  const AskKdSheet({super.key, required this.conversationId, required this.messageIds});
  final String conversationId;
  final List<String> messageIds;
  @override State<AskKdSheet> createState() => _AskKdSheetState();
}

class _AskKdSheetState extends State<AskKdSheet> {
  final prompt = TextEditingController();
  @override void dispose() { prompt.dispose(); super.dispose(); }
  @override Widget build(BuildContext context) => SafeArea(child: Padding(padding: const EdgeInsets.fromLTRB(20, 12, 20, 20), child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Ask KD', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)), const SizedBox(height: 6), Text('Выбрано сообщений: ${widget.messageIds.length}', style: const TextStyle(color: Colors.white54)), const SizedBox(height: 14), TextField(controller: prompt, minLines: 2, maxLines: 5, autofocus: true, decoration: const InputDecoration(hintText: 'Например: кратко объясни главное…', filled: true)), const SizedBox(height: 12), SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: () { if (prompt.text.trim().isEmpty) return; Navigator.pop(context, AskKdRequest(conversationId: widget.conversationId, messageIds: widget.messageIds, prompt: prompt.text.trim())); }, icon: const Icon(Icons.auto_awesome), label: const Text('Спросить KD'))])));
}

class PrivacyCenterCard extends StatelessWidget {
  const PrivacyCenterCard({super.key});
  @override Widget build(BuildContext context) => Card(child: Column(children: const [ListTile(leading: Icon(Icons.devices_outlined), title: Text('Активные устройства'), subtitle: Text('Управление сессиями')), ListTile(leading: Icon(Icons.notifications_none), title: Text('Превью уведомлений'), subtitle: Text('Что показывать на экране блокировки')), ListTile(leading: Icon(Icons.timer_outlined), title: Text('Исчезающие сообщения'), subtitle: Text('Настройки по умолчанию')), ListTile(leading: Icon(Icons.block_outlined), title: Text('Заблокированные'), subtitle: Text('Управление блокировками'))]));
}

class SearchScopeChips extends StatelessWidget {
  const SearchScopeChips({super.key, required this.selected, required this.onChanged});
  final String selected;
  final ValueChanged<String> onChanged;
  @override Widget build(BuildContext context) => SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: ['Все', 'Люди', 'Чаты', 'Сообщения', 'Медиа', 'Файлы'].map((x) => Padding(padding: const EdgeInsets.only(right: 8), child: ChoiceChip(label: Text(x), selected: x == selected, onSelected: (_) => onChanged(x)))).toList()));
}
