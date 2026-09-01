import 'package:flutter/material.dart';

class KdUnreadCounter extends StatelessWidget {
  const KdUnreadCounter({super.key, required this.count});
  final int count;

  @override
  Widget build(BuildContext context) {
    if (count <= 0) return const SizedBox.shrink();
    final label = count > 99 ? '99+' : '$count';
    return Semantics(label: '$count непрочитанных', child: Container(
      constraints: const BoxConstraints(minWidth: 22, minHeight: 22),
      padding: const EdgeInsets.symmetric(horizontal: 6),
      alignment: Alignment.center,
      decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary, borderRadius: BorderRadius.circular(12)),
      child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
    ));
  }
}
