import 'package:flutter/material.dart';

class KdReplyPreview extends StatelessWidget {
  const KdReplyPreview({super.key, required this.author, required this.text, this.onClose});
  final String author;
  final String text;
  final VoidCallback? onClose;

  @override
  Widget build(BuildContext context) => Semantics(
    container: true,
    label: 'Ответ $author: $text',
    child: Container(
      margin: const EdgeInsets.fromLTRB(12, 4, 12, 2),
      padding: const EdgeInsets.fromLTRB(12, 8, 6, 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
        border: Border(left: BorderSide(width: 3, color: Theme.of(context).colorScheme.primary)),
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(author, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
          const SizedBox(height: 3),
          Text(text, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
        ])),
        if (onClose != null) Semantics(button: true, label: 'Отменить ответ', child: IconButton(tooltip: 'Отменить ответ', onPressed: onClose, icon: const Icon(Icons.close, size: 18))),
      ]),
    ),
  );
}
