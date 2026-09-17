import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';
import 'dashboard_screen.dart';

class PinScreen extends StatefulWidget {
  const PinScreen({super.key});

  @override
  State<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends State<PinScreen> {
  String _pin = '';
  bool _isLoading = false;
  String? _errorMessage;

  void _onDigitPressed(String digit) {
    if (_pin.length < 6 && !_isLoading) {
      setState(() {
        _pin += digit;
        _errorMessage = null;
      });

      if (_pin.length == 6) {
        _submitPin();
      }
    }
  }

  void _onBackspacePressed() {
    if (_pin.isNotEmpty && !_isLoading) {
      setState(() {
        _pin = _pin.substring(0, _pin.length - 1);
        _errorMessage = null;
      });
    }
  }

  Future<void> _submitPin() async {
    setState(() {
      _isLoading = true;
    });

    final isValid = await FirestoreService.verifyPin(_pin);

    if (!mounted) return;

    if (isValid) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const DashboardScreen()),
      );
    } else {
      setState(() {
        _isLoading = false;
        _pin = '';
        _errorMessage = 'PIN salah. Silakan periksa kembali.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo & Header
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.airport_shuttle_rounded,
                      size: 38,
                      color: AppTheme.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Primaya Hospital IGD',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Aplikasi Operasional Pengemudi Ambulans',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 36),

                // PIN Dots Display
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(6, (index) {
                    final isFilled = index < _pin.length;
                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 8),
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isFilled ? AppTheme.primary : const Color(0xFFE2E8F0),
                        border: Border.all(
                          color: isFilled ? AppTheme.primary : const Color(0xFFCBD5E1),
                          width: 2,
                        ),
                      ),
                    );
                  }),
                ),

                const SizedBox(height: 18),

                // Error / Loading
                SizedBox(
                  height: 24,
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2.5),
                        )
                      : _errorMessage != null
                          ? Text(
                              _errorMessage!,
                              style: GoogleFonts.plusJakartaSans(
                                color: AppTheme.danger,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            )
                          : null,
                ),

                const SizedBox(height: 28),

                // Keypad
                _buildKeypad(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildKeypad() {
    return Column(
      children: [
        for (int r = 0; r < 3; r++)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (int c = 1; c <= 3; c++)
                  _buildKeypadButton('${r * 3 + c}'),
              ],
            ),
          ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(width: 80, height: 60), // Kosong
              _buildKeypadButton('0'),
              SizedBox(
                width: 80,
                height: 60,
                child: IconButton(
                  onPressed: _onBackspacePressed,
                  icon: const Icon(Icons.backspace_outlined, color: AppTheme.textSecondary),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildKeypadButton(String digit) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 14),
      width: 70,
      height: 60,
      child: Material(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _onDigitPressed(digit),
          child: Center(
            child: Text(
              digit,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
