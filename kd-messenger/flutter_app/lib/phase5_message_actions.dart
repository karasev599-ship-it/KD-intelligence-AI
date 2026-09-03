import 'package:flutter/material.dart';

enum KdMessageAction { reply, react, copy, forward, askKd, edit, delete }

class MessageActionSheet extends StatelessWidget {
  const MessageActionSheet({super.key, required this.isMine, required this.messageId});
  final bool isMine;
  final String messageId;

  @override
  Widget build(BuildContext context) {
    final actions = <({IconData icon, String label, KdMessageAction action})>[
      (icon: Icons.reply_outlined, label: 'Ответить', action: KdMessageAction.reply),
      (icon: Icons.add_reaction_outlined, label: 'Реакция', action: KdMessageAction.react),
      (icon: Icons.copy_outlined, label: 'Копировать', action: KdMessageAction.copy),
      (icon: Icons.forward_outlined, label: 'Переслать', action: KdMessageAction.forward),
      (icon: Icons.auto_awesome_outlined, label: 'Ask KD', action: KdMessageAction.askKd),
      if (isMine) (icon: Icons.edit_outlined, label: 'Изменить', action: KdMessageAction.edit),
      (icon: Icons.delete_outline, label: 'Удалить', action: KdMessageAction.delete),
    ];
    return SafeArea(child: Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 20), child: Column(mainAxisSize: MainAxisSize.min, children: [
      Container(width: 42, height: 4, decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), color: Colors.white24)),
      const SizedBox(height: 14),
      ...actions.map((a) => ListTile(
        leading: Icon(a.icon),
        title: Text(a.label),
        onTap: () => Navigator.pop(context, {'action': a.action.name, 'messageId': messageId}),
      )),
    ]));
  }
}
