import 'package:flutter/material.dart';

class KdReactionBar extends StatelessWidget {
  const KdReactionBar({super.key, required this.onReaction});
  final ValueChanged<String> onReaction;
  static const reactions = ['❤️', '🔥', '😂', '👍', '😮', '😢'];

  @override
  Widget build(BuildContext context) => Material(
    borderRadius: BorderRadius.circular(18),
    color: Theme.of(context).colorScheme.surface,
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      child: Row(mainAxisSize: MainAxisSize.min, children: reactions.map((emoji) => IconButton(
        tooltip: emoji,
        visualDensity: VisualDensity.compact,
        onPressed: () => onReaction(emoji),
        icon: Text(emoji, style: const TextStyle(fontSize: 20)),
      )).toList()),
    ),
  );
}
