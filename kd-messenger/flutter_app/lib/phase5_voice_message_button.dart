import 'package:flutter/material.dart';

class KdVoiceMessageButton extends StatefulWidget {
  const KdVoiceMessageButton({super.key, required this.onRecordingChanged});
  final ValueChanged<bool> onRecordingChanged;

  @override
  State<KdVoiceMessageButton> createState() => _KdVoiceMessageButtonState();
}

class _KdVoiceMessageButtonState extends State<KdVoiceMessageButton> {
  bool recording = false;

  void toggle() {
    setState(() => recording = !recording);
    widget.onRecordingChanged(recording);
  }

  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: recording ? 'Остановить запись' : 'Записать голосовое',
    onPressed: toggle,
    icon: Icon(recording ? Icons.stop_circle_outlined : Icons.mic_none_rounded),
  );
}
