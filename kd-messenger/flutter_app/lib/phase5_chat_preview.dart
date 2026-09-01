import 'package:flutter/material.dart';

class ConversationPreview extends StatelessWidget {
  const ConversationPreview({super.key, required this.name, required this.preview, required this.time, this.unread = 0, this.online = false});
  final String name;
  final String preview;
  final String time;
  final int unread;
  final bool online;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
      leading: Stack(children: [
        CircleAvatar(radius: 27, child: Text(name.isEmpty ? '?' : name.characters.first.toUpperCase())),
        if (online) Positioned(right: 0, bottom: 1, child: Container(width: 13, height: 13, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 2), color: Colors.greenAccent))),
      ]),
      title: Row(children: [Expanded(child: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800))), Text(time, style: const TextStyle(fontSize: 12, color: Colors.white54))]),
      subtitle: Row(children: [Expanded(child: Text(preview, maxLines: 1, overflow: TextOverflow.ellipsis)), if (unread > 0) Container(margin: const EdgeInsets.only(left: 8), padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3), decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), color: const Color(0xFF8B5CF6)), child: Text(unread > 99 ? '99+' : '$unread', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800)))]),
    );
  }
}
