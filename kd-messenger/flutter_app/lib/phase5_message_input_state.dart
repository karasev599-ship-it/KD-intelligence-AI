import 'package:flutter/foundation.dart';

enum KdInputMode { idle, typing, recording, sending }

class KdMessageInputState extends ChangeNotifier {
  KdInputMode _mode = KdInputMode.idle;
  String _text = '';

  KdInputMode get mode => _mode;
  String get text => _text;
  bool get canSend => _text.trim().isNotEmpty && _mode != KdInputMode.sending;

  void setText(String value) {
    _text = value;
    if (_mode != KdInputMode.recording && _mode != KdInputMode.sending) {
      _mode = value.trim().isEmpty ? KdInputMode.idle : KdInputMode.typing;
    }
    notifyListeners();
  }

  void startRecording() {
    _mode = KdInputMode.recording;
    notifyListeners();
  }

  void stopRecording() {
    _mode = _text.trim().isEmpty ? KdInputMode.idle : KdInputMode.typing;
    notifyListeners();
  }

  void startSending() {
    _mode = KdInputMode.sending;
    notifyListeners();
  }

  void finishSending() {
    _text = '';
    _mode = KdInputMode.idle;
    notifyListeners();
  }
}
