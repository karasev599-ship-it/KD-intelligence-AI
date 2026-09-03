import 'package:flutter/material.dart';

class KdTypingIndicator extends StatefulWidget {
  const KdTypingIndicator({super.key, this.name = 'Алина'});
  final String name;

  @override
  State<KdTypingIndicator> createState() => _KdTypingIndicatorState();
}

class _KdTypingIndicatorState extends State<KdTypingIndicator> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat();

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Semantics(
    liveRegion: true,
    label: '${widget.name} печатает',
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
      child: Row(children: [
        const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)),
        const SizedBox(width: 10),
        Text('${widget.name} печатает', style: const TextStyle(color: Colors.white60, fontWeight: FontWeight.w600)),
        const SizedBox(width: 3),
        AnimatedBuilder(animation: _controller, builder: (_, __) {
          final active = (_controller.value * 3).floor();
          return Row(children: List.generate(3, (i) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 1),
            child: Transform.translate(offset: Offset(0, i == active ? -2 : 0), child: const Text('•', style: TextStyle(color: Colors.white60, fontSize: 15))),
          )));
        }),
      ]),
    ),
  );
}
