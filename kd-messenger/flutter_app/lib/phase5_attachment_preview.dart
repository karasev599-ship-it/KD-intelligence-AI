import 'package:flutter/material.dart';

class KdAttachmentPreview extends StatelessWidget {
  const KdAttachmentPreview({super.key, required this.type, required this.name, this.onRemove});
  final KdAttachmentPreviewType type;
  final String name;
  final VoidCallback? onRemove;

  IconData get _icon => switch (type) {
    KdAttachmentPreviewType.photo => Icons.image_outlined,
    KdAttachmentPreviewType.video => Icons.videocam_outlined,
    KdAttachmentPreviewType.file => Icons.insert_drive_file_outlined,
  };

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(color: Theme.of(context).colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(14)),
    child: Row(children: [
      Icon(_icon),
      const SizedBox(width: 10),
      Expanded(child: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis)),
      if (onRemove != null) IconButton(onPressed: onRemove, icon: const Icon(Icons.close, size: 18)),
    ]),
  );
}

enum KdAttachmentPreviewType { photo, video, file }
