import 'package:flutter/material.dart';

class KdChatBubble extends StatelessWidget {
  const KdChatBubble({super.key, required this.text, required this.isMine, this.time = ''});
  final String text;
  final bool isMine;
  final String time;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.only(
      topLeft: const Radius.circular(18),
      topRight: const Radius.circular(18),
      bottomLeft: Radius.circular(isMine ? 18 : 4),
      bottomRight: Radius.circular(isMine ? 4 : 18),
    );
    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 330),
        margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        padding: const EdgeInsets.fromLTRB(13, 9, 10, 7),
        decoration: BoxDecoration(
          color: isMine ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: radius,
        ),
        child: Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.end, children: [
          Flexible(child: Text(text)),
          if (time.isNotEmpty) ...[const SizedBox(width: 8), Text(time, style: const TextStyle(fontSize: 10, color: Colors.white54))],
        ]),
      ),
    );
  }
}
