import 'package:flutter/material.dart';

class KdAttachmentPicker extends StatelessWidget {
  const KdAttachmentPicker({super.key, required this.onSelected});
  final ValueChanged<KdAttachmentType> onSelected;

  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 8,
    children: [
      _item(Icons.photo_library_outlined, 'Фото', KdAttachmentType.photo),
      _item(Icons.videocam_outlined, 'Видео', KdAttachmentType.video),
      _item(Icons.insert_drive_file_outlined, 'Файл', KdAttachmentType.file),
      _item(Icons.location_on_outlined, 'Гео', KdAttachmentType.location),
    ],
  );

  Widget _item(IconData icon, String label, KdAttachmentType type) => ActionChip(
    avatar: Icon(icon, size: 18), label: Text(label), onPressed: () => onSelected(type),
  );
}

enum KdAttachmentType { photo, video, file, location }
