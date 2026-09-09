import 'package:flutter/material.dart';

class KdReactionBar extends StatelessWidget {
  const KdReactionBar({super.key, required this.onSelected});
  final ValueChanged<String> onSelected;
  static const reactions = ['❤️', '👍', '🔥', '😂', '😮', '😢'];

  @override
  Widget build(BuildContext context) => Material(
    borderRadius: BorderRadius.circular(20),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        for (final reaction in reactions)
          InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => onSelected(reaction),
            child: Padding(
              padding: const EdgeInsets.all(5),
              child: Text(reaction, style: const TextStyle(fontSize: 20)),
            ),
          ),
      ]),
    ),
  );
}
