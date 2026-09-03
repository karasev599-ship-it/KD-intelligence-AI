import 'package:flutter/material.dart';

enum KdMessageState { sending, sent, delivered, read, failed }

class KdReadReceipt extends StatelessWidget {
  const KdReadReceipt({super.key, required this.state});
  final KdMessageState state;

  @override
  Widget build(BuildContext context) {
    final icon = switch (state) {
      KdMessageState.sending => Icons.schedule,
      KdMessageState.sent => Icons.check,
      KdMessageState.delivered => Icons.done_all,
      KdMessageState.read => Icons.done_all,
      KdMessageState.failed => Icons.error_outline,
    };
    final label = switch (state) {
      KdMessageState.sending => 'Отправка',
      KdMessageState.sent => 'Отправлено',
      KdMessageState.delivered => 'Доставлено',
      KdMessageState.read => 'Прочитано',
      KdMessageState.failed => 'Не отправлено',
    };
    return Tooltip(message: label, child: Icon(icon, size: 15));
  }
}
