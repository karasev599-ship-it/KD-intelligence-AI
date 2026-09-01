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
        Text('Контроль аккаунта и устройств', style: TextStyle(color: Colors.white54)),
        SizedBox(height: 24),
        _PrivacyItem(Icons.devices_outlined, 'Активные устройства', 'Управление сессиями'),
        _PrivacyItem(Icons.visibility_outlined, 'Предпросмотр уведомлений', 'Что показывается на экране'),
        _PrivacyItem(Icons.timer_outlined, 'Исчезающие сообщения', 'Настройки по умолчанию'),
        _PrivacyItem(Icons.block_outlined, 'Заблокированные', 'Управление блокировками'),
        _PrivacyItem(Icons.download_outlined, 'Экспорт данных', 'Получить копию данных аккаунта'),
        _PrivacyItem(Icons.delete_outline, 'Удаление аккаунта', 'Удалить аккаунт и связанные данные'),
      ],
    );
  }
}

class _PrivacyItem extends StatelessWidget {
  const _PrivacyItem(this.icon, this.title, this.subtitle);
  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(vertical: 7),
    leading: CircleAvatar(child: Icon(icon)),
    title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
    subtitle: Text(subtitle),
    trailing: const Icon(Icons.chevron_right),
  );
}
