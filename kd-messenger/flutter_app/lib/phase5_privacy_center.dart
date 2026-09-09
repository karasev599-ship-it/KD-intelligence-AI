import 'package:flutter/material.dart';

class PrivacyCenterView extends StatelessWidget {
  const PrivacyCenterView({super.key});

  void _open(BuildContext context, String title, String subtitle) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (_) => SafeArea(child: Padding(padding: const EdgeInsets.all(20), child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)), const SizedBox(height: 8), Text(subtitle, style: const TextStyle(color: Colors.white54)), const SizedBox(height: 18), const Text('Настройка готова к подключению к backend.', style: TextStyle(color: Colors.white70)), const SizedBox(height: 12)]))),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(20), children: [
      const Text('Privacy Center', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
      const SizedBox(height: 8),
      const Text('Контроль аккаунта, устройств и приватности', style: TextStyle(color: Colors.white54)),
      const SizedBox(height: 24),
      _PrivacySection(title: 'Безопасность', items: [
        _PrivacyItem(Icons.devices_outlined, 'Активные устройства', 'Управление сессиями', () => _open(context, 'Активные устройства', 'Проверь и заверши ненужные сессии.')),
        _PrivacyItem(Icons.block_outlined, 'Заблокированные', 'Управление блокировками', () => _open(context, 'Заблокированные', 'Здесь будут отображаться заблокированные контакты.')),
      ]),
      _PrivacySection(title: 'Приватность', items: [
        _PrivacyItem(Icons.visibility_outlined, 'Предпросмотр уведомлений', 'Что показывается на экране', () => _open(context, 'Предпросмотр уведомлений', 'Настрой видимость текста сообщений.')),
        _PrivacyItem(Icons.timer_outlined, 'Исчезающие сообщения', 'Настройки по умолчанию', () => _open(context, 'Исчезающие сообщения', 'Выбери срок хранения новых сообщений.')),
      ]),
      _PrivacySection(title: 'Аккаунт', items: [
        _PrivacyItem(Icons.download_outlined, 'Экспорт данных', 'Получить копию данных аккаунта', () => _open(context, 'Экспорт данных', 'Подготовка экспорта будет выполняться через backend.')),
        _PrivacyItem(Icons.delete_outline, 'Удаление аккаунта', 'Необратимое действие', () => _open(context, 'Удаление аккаунта', 'Перед удалением потребуется дополнительное подтверждение.')),
      ]),
    ]);
  }
}

class _PrivacySection extends StatelessWidget {
  const _PrivacySection({required this.title, required this.items});
  final String title;
  final List<Widget> items;
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white54))), Card(child: Column(children: items)), const SizedBox(height: 20)]);
}

class _PrivacyItem extends StatelessWidget {
  const _PrivacyItem(this.icon, this.title, this.subtitle, this.onTap);
  final IconData icon; final String title; final String subtitle; final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => ListTile(contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5), leading: CircleAvatar(child: Icon(icon)), title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text(subtitle), trailing: const Icon(Icons.chevron_right), onTap: onTap);
}
