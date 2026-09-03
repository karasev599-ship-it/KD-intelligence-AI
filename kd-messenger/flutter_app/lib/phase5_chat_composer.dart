import 'package:flutter/material.dart';

class KdChatComposer extends StatefulWidget {
  const KdChatComposer({super.key, this.onSend});
  final ValueChanged<String>? onSend;
  @override State<KdChatComposer> createState() => _KdChatComposerState();
}

class _KdChatComposerState extends State<KdChatComposer> {
  final controller = TextEditingController();
  bool get canSend => controller.text.trim().isNotEmpty;
  @override void dispose() { controller.dispose(); super.dispose(); }
  @override Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(10),
    child: Row(children: [
      IconButton(onPressed: () {}, icon: const Icon(Icons.add_circle_outline)),
      Expanded(child: TextField(controller: controller, onChanged: (_) => setState(() {}), minLines: 1, maxLines: 5, decoration: InputDecoration(hintText: 'Сообщение…', filled: true, border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none)))),
      const SizedBox(width: 6),
      IconButton(onPressed: canSend ? () { final text = controller.text.trim(); controller.clear(); setState(() {}); widget.onSend?.call(text); } : () {}, icon: Icon(canSend ? Icons.send_rounded : Icons.mic_none_rounded)),
    ]),
  );
}
