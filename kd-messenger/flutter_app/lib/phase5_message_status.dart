import 'package:flutter/material.dart';

enum KdMessageStatus { sending, sent, delivered, read, failed }

class KdMessageStatusIcon extends StatelessWidget {
  const KdMessageStatusIcon({super.key, required this.status});
  final KdMessageStatus status;

  @override
  Widget build(BuildContext context) {
    final (icon, label) = switch (status) {
      KdMessageStatus.sending => (Icons.schedule, 'Отправляется'),
      KdMessageStatus.sent => (Icons.check, 'Отправлено'),
      KdMessageStatus.delivered => (Icons.done_all, 'Доставлено'),
      KdMessageStatus.read => (Icons.done_all, 'Прочитано'),
      KdMessageStatus.failed => (Icons.error_outline, 'Не отправлено'),
    };
    final color = status == KdMessageStatus.read ? Theme.of(context).colorScheme.primary : null;
    return Semantics(label: label, child: Icon(icon, size: 15, color: color));
  }
}
