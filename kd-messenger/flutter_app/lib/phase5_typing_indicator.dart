import 'package:flutter/material.dart';

class KdTypingIndicator extends StatelessWidget {
  const KdTypingIndicator({super.key, this.name = 'Алина'});
  final String name;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
    child: Row(children: [
      const SizedBox(width: 28, height: 28, child: CircularProgressIndicator(strokeWidth: 2)),
      const SizedBox(width: 10),
      Text('$name печатает…', style: const TextStyle(color: Colors.white60, fontWeight: FontWeight.w600)),
    ]),
  );
}
