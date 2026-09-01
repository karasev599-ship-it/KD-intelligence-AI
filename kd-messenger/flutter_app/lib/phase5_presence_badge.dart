import 'package:flutter/material.dart';

enum KdPresence { online, typing, away, offline }

class KdPresenceBadge extends StatelessWidget {
  const KdPresenceBadge({super.key, required this.presence});
  final KdPresence presence;

  @override
  Widget build(BuildContext context) {
    final color = switch (presence) { KdPresence.online => Colors.greenAccent, KdPresence.typing => Colors.amberAccent, KdPresence.away => Colors.orangeAccent, KdPresence.offline => Colors.white24 };
    final label = switch (presence) { KdPresence.online => 'в сети', KdPresence.typing => 'печатает…', KdPresence.away => 'был(а) недавно', KdPresence.offline => 'не в сети' };
    return Row(mainAxisSize: MainAxisSize.min, children: [Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)), const SizedBox(width: 6), Text(label, style: const TextStyle(fontSize: 12, color: Colors.white54))]);
  }
}
