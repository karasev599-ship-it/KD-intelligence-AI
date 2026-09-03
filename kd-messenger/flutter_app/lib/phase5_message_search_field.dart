import 'package:flutter/material.dart';

class KdMessageSearchField extends StatelessWidget {
  const KdMessageSearchField({super.key, required this.onChanged, this.onClose});
  final ValueChanged<String> onChanged;
  final VoidCallback? onClose;

  @override
  Widget build(BuildContext context) => TextField(
    autofocus: true,
    onChanged: onChanged,
    textInputAction: TextInputAction.search,
    decoration: InputDecoration(
      hintText: 'Поиск сообщений',
      prefixIcon: const Icon(Icons.search),
      suffixIcon: onClose == null ? null : IconButton(
        tooltip: 'Закрыть поиск',
        onPressed: onClose,
        icon: const Icon(Icons.close),
      ),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
      filled: true,
    ),
  );
}
