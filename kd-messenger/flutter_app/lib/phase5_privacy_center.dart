import 'package:flutter/material.dart';

class PrivacyCenterView extends StatelessWidget {
  const PrivacyCenterView({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: const [
        Text('Privacy Center', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
        SizedBox(height: 8),
        Text('Контроль аккаунта, устройств и приватности', style: TextStyle(color: Colors.white54)),
        SizedBox(height: 24),
        _PrivacySection(title: 'Безопасность', items: [
          _PrivacyItem(Icons.devices_outlined, 'Активные устройства', 'Управление сессиями'),
          _PrivacyItem(Icons.block_outlined, 'Заблокированные', 'Управление блокировками'),
        ]),
        _PrivacySection(title: 'Приватность', items: [
          _PrivacyItem(Icons.visibility_outlined, 'Предпросмотр уведомлений', 'Что показывается на экране'),
          _PrivacyItem(Icons.timer_outlined, 'Исчезающие сообщения', 'Настройки по умолчанию'),
        ]),
        _PrivacySection(title: 'Аккаунт', items: [
          _PrivacyItem(Icons.download_outlined, 'Экспорт данных', 'Получить копию данных аккаунта'),
          _PrivacyItem(Icons.delete_outline, 'Удаление аккаунта', 'Необратимое действие'),
        ]),
      ],
    );
  }
}

class _PrivacySection extends StatelessWidget {
  const _PrivacySection({required this.title, required this.items});
  final String title;
  final List<Widget> items;

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white54))),
    Card(child: Column(children: items)),
    const SizedBox(height: 20),
  ]);
}

class _PrivacyItem extends StatelessWidget {
  const _PrivacyItem(this.icon, this.title, this.subtitle);
  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
    leading: CircleAvatar(child: Icon(icon)),
    title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
    subtitle: Text(subtitle),
    trailing: const Icon(Icons.chevron_right),
  );
}
