enum InboxFilter { all, unread, direct, groups, mentions }

class KdSpace {
  const KdSpace({required this.id, required this.name, this.icon = '✦'});
  final String id;
  final String name;
  final String icon;
}

class SearchHit {
  const SearchHit({required this.title, required this.subtitle, required this.type});
  final String title;
  final String subtitle;
  final String type;
}

class AskKdRequest {
  const AskKdRequest({required this.conversationId, required this.messageIds, required this.prompt});
  final String conversationId;
  final List<String> messageIds;
  final String prompt;
}
