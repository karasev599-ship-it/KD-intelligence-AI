import 'package:flutter/material.dart';

enum KdPresence { online, typing, away, offline }

class KdPresenceBadge extends StatelessWidget {
  const KdPresenceBadge({super.key, required this.presence});
  final KdPresence presence;

  @override
  Widget build(BuildContext context) {
    final label = switch (presence) {
      KdPresence.online => 'в сети',
      KdPresence.typing => 'печатает…',
      KdPresence.away => 'нет на месте',
      KdPresence.offline => 'не в сети',
    };
    final icon = switch (presence) {
      KdPresence.online => Icons.circle,
      KdPresence.typing => Icons.edit_outlined,
      KdPresence.away => Icons.access_time,
      KdPresence.offline => Icons.circle_outlined,
    };
    return Semantics(label: label, child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 11), const SizedBox(width: 5), Text(label, style: const TextStyle(fontSize: 12))]));
  }
}
