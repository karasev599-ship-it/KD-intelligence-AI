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
