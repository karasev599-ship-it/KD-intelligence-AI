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
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
      decoration: BoxDecoration(border: Border(left: BorderSide(width: 3, color: Theme.of(context).colorScheme.primary)), borderRadius: BorderRadius.circular(10), color: Colors.white.withValues(alpha: .06)),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(author, style: const TextStyle(fontWeight: FontWeight.w700)), const SizedBox(height: 2), Text(text, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white60))])),
        if (onClose != null) Semantics(button: true, label: 'Отменить ответ', child: IconButton(onPressed: onClose, icon: const Icon(Icons.close, size: 18))),
      ]),
    ),
  );
}
