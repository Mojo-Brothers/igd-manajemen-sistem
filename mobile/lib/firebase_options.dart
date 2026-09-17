import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Konfigurasi default Firebase untuk proyek igd-doctor-schedule-display
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        return android;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyD3HCkRzRjbPupwVcbUgW_TC8pfayu-Q0c',
    appId: '1:93031396315:web:4c5d2e6b5839ed17b56dfe',
    messagingSenderId: '93031396315',
    projectId: 'igd-doctor-schedule-display',
    authDomain: 'igd-doctor-schedule-display.firebaseapp.com',
    storageBucket: 'igd-doctor-schedule-display.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyD3HCkRzRjbPupwVcbUgW_TC8pfayu-Q0c',
    appId: '1:93031396315:android:4c5d2e6b5839ed17b56dfe',
    messagingSenderId: '93031396315',
    projectId: 'igd-doctor-schedule-display',
    storageBucket: 'igd-doctor-schedule-display.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyD3HCkRzRjbPupwVcbUgW_TC8pfayu-Q0c',
    appId: '1:93031396315:ios:4c5d2e6b5839ed17b56dfe',
    messagingSenderId: '93031396315',
    projectId: 'igd-doctor-schedule-display',
    storageBucket: 'igd-doctor-schedule-display.firebasestorage.app',
  );
}
