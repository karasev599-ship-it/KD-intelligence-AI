import 'package:flutter/material.dart';
import 'phase5_models.dart';

class Phase5Shell extends StatefulWidget {
  const Phase5Shell({super.key});
  @override State<Phase5Shell> createState() => _Phase5ShellState();
}

class _Phase5ShellState extends State<Phase5Shell> {
  int index = 0;
  InboxFilter filter = InboxFilter.all;
  final spaces = const [KdSpace(id: 'saved', name: 'Saved Space', icon: '✦'), KdSpace(id: 'work', name: 'Работа', icon: '◈'), KdSpace(id: 'friends', name: 'Свои', icon: '♡')];

  @override Widget build(BuildContext context) {
    final desktop = MediaQuery.sizeOf(context).width >= 900;
    final body = switch (index) {
      0 => _inbox(),
      1 => _spaces(),
      2 => _search(),
      _ => _profile(),
    };
    if (!desktop) return Scaffold(body: SafeArea(child: body), bottomNavigationBar: NavigationBar(selectedIndex: index, onDestinationSelected: (v) => setState(() => index = v), destinations: const [NavigationDestination(icon: Icon(Icons.chat_bubble_outline), selectedIcon: Icon(Icons.chat_bubble), label: 'Чаты'), NavigationDestination(icon: Icon(Icons.grid_view_outlined), label: 'Spaces'), NavigationDestination(icon: Icon(Icons.search), label: 'Поиск'), NavigationDestination(icon: Icon(Icons.person_outline), label: 'Профиль')]));
    return Scaffold(body: SafeArea(child: Row(children: [NavigationRail(selectedIndex: index, onDestinationSelected: (v) => setState(() => index = v), labelType: NavigationRailLabelType.all, destinations: const [NavigationRailDestination(icon: Icon(Icons.chat_bubble_outline), selectedIcon: Icon(Icons.chat_bubble), label: Text('Чаты')), NavigationRailDestination(icon: Icon(Icons.grid_view_outlined), label: Text('Spaces')), NavigationRailDestination(icon: Icon(Icons.search), label: Text('Поиск')), NavigationRailDestination(icon: Icon(Icons.person_outline), label: Text('Профиль'))]), const VerticalDivider(width: 1), Expanded(child: body)]));
  }

  Widget _inbox() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Padding(padding: EdgeInsets.fromLTRB(20, 22, 20, 12), child: Text('Smart Inbox', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900))), SingleChildScrollView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16), child: Row(children: InboxFilter.values.map((f) => Padding(padding: const EdgeInsets.only(right: 8), child: ChoiceChip(label: Text(_filterName(f)), selected: filter == f, onSelected: (_) => setState(() => filter = f)))).toList())), Expanded(child: ListView(padding: const EdgeInsets.all(16), children: const [ListTile(leading: CircleAvatar(child: Text('А')), title: Text('Алина', style: TextStyle(fontWeight: FontWeight.w800)), subtitle: Text('Доброе утро ❤️'), trailing: Text('00:42')), ListTile(leading: CircleAvatar(child: Text('KD')), title: Text('KD Team'), subtitle: Text('Новое сообщение'), trailing: Text('Вчера'))]))]);

  Widget _spaces() => ListView(padding: const EdgeInsets.all(20), children: [const Text('KD Spaces', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)), const SizedBox(height: 8), const Text('Твои пространства для чатов и сохранённого', style: TextStyle(color: Colors.white54)), const SizedBox(height: 20), ...spaces.map((s) => Card(child: ListTile(leading: CircleAvatar(child: Text(s.icon)), title: Text(s.name, style: const TextStyle(fontWeight: FontWeight.w700)), trailing: const Icon(Icons.chevron_right))))]);

  Widget _search() => Padding(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Поиск', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)), const SizedBox(height: 18), TextField(decoration: InputDecoration(hintText: 'Люди, чаты, сообщения, файлы…', prefixIcon: const Icon(Icons.search), filled: true, fillColor: const Color(0xFF15151D), border: OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: BorderSide.none))), const SizedBox(height: 20), const Text('Универсальный поиск', style: TextStyle(color: Colors.white54))]));

  Widget _profile() => ListView(padding: const EdgeInsets.all(20), children: const [Text('KD Profile', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)), SizedBox(height: 24), Center(child: CircleAvatar(radius: 54, backgroundColor: Color(0xFF8B5CF6), child: Text('KD', style: TextStyle(fontSize: 25, fontWeight: FontWeight.w900)))), SizedBox(height: 14), Center(child: Text('Даниил', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800))), Center(child: Text('@kd_official', style: TextStyle(color: Colors.white54))), SizedBox(height: 28), ListTile(leading: Icon(Icons.security_outlined), title: Text('Privacy Center'), trailing: Icon(Icons.chevron_right)), ListTile(leading: Icon(Icons.devices_outlined), title: Text('Активные устройства'), trailing: Icon(Icons.chevron_right))]);

  String _filterName(InboxFilter f) => switch (f) { InboxFilter.all => 'Все', InboxFilter.unread => 'Непрочитанные', InboxFilter.direct => 'Личные', InboxFilter.groups => 'Группы', InboxFilter.mentions => 'Упоминания' };
}
