import 'package:flutter/foundation.dart';

class KdMessageSearchController extends ChangeNotifier {
  String _query = '';
  bool _active = false;
  String get query => _query;
  bool get active => _active;
  void open() { _active = true; notifyListeners(); }
  void close() { _active = false; _query = ''; notifyListeners(); }
  void setQuery(String value) { _query = value; notifyListeners(); }
}

class KdMessageSearchResult {
  const KdMessageSearchResult({required this.messageId, required this.text, required this.senderName, required this.timestamp});
  final String messageId;
  final String text;
  final String senderName;
  final DateTime timestamp;
}

class KdMessageSearch {
  static List<KdMessageSearchResult> filter(List<KdMessageSearchResult> messages, String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return messages;
    return messages.where((m) => m.text.toLowerCase().contains(q) || m.senderName.toLowerCase().contains(q)).toList();
  }
}
