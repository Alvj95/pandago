/**
 * Plugin de Expo: Bao Asistente en Android.
 *  - AssistantActivity: ventana transparente con la raíz «assistant» de React
 *    Native, que aparece encima de la app en la que estés. Se abre con
 *    pandago-bao://assistant?..., con «Compartir → PandaGO!» (texto o foto) y
 *    con el menú de texto seleccionado («Preguntar a Bao»).
 *  - BaoTileService: botón «Bao» en los ajustes rápidos de Android.
 *  - Atajos al mantener pulsado el icono: Hablar, Foto, Escribir.
 */
const fs = require('fs');
const path = require('path');
const { AndroidConfig, withAndroidManifest, withAndroidStyles, withDangerousMod, withStringsXml } = require('expo/config-plugins');

const SCHEME = 'pandago-bao';

const activityKt = (pkg) => `package ${pkg}

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper

/** Ventana transparente de Bao Asistente (raíz JS «assistant»). */
class AssistantActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "assistant"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions(): Bundle = launchOptions(intent)
      })
  }

  /** Lo que llega a JS: el enlace, el texto compartido/seleccionado y la foto compartida. */
  private fun launchOptions(intent: Intent?): Bundle {
    val b = Bundle()
    if (intent == null) return b
    b.putString("uri", intent.dataString ?: "")
    val text = when (intent.action) {
      Intent.ACTION_PROCESS_TEXT -> intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString()
      Intent.ACTION_SEND -> intent.getStringExtra(Intent.EXTRA_TEXT)
      else -> null
    }
    b.putString("text", text ?: "")
    val image: Uri? = if (intent.action == Intent.ACTION_SEND && intent.type?.startsWith("image/") == true) {
      @Suppress("DEPRECATION")
      intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
    } else null
    b.putString("image", image?.toString() ?: "")
    return b
  }

  override fun invokeDefaultOnBackPressed() {
    finish()
  }
}
`;

const tileKt = (pkg) => `package ${pkg}

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

/** Botón «Bao» en los ajustes rápidos: abre Bao Asistente escuchando. */
class BaoTileService : TileService() {
  override fun onStartListening() {
    qsTile?.let {
      it.state = Tile.STATE_INACTIVE
      it.updateTile()
    }
  }

  override fun onClick() {
    val intent = Intent(this, AssistantActivity::class.java).apply {
      data = Uri.parse("${SCHEME}://assistant?voice=1")
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
    }
    if (Build.VERSION.SDK_INT >= 34) {
      val pending = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
      startActivityAndCollapse(pending)
    } else {
      @Suppress("DEPRECATION")
      startActivityAndCollapse(intent)
    }
  }
}
`;

/** Icono monocromo de Bao para los ajustes rápidos y los atajos. */
const tileIcon = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="120" android:viewportHeight="120">
  <path android:fillColor="#FFFFFFFF" android:pathData="M18,38 L26,8 L48,26 Z M102,38 L94,8 L72,26 Z"/>
  <path android:fillColor="#FFFFFFFF" android:pathData="M60,22 C86,22 108,40 108,64 C108,88 86,106 60,106 C34,106 12,88 12,64 C12,40 34,22 60,22 Z M42,57 A7,7 0 1,0 42,71 A7,7 0 1,0 42,57 Z M78,57 A7,7 0 1,0 78,71 A7,7 0 1,0 78,57 Z M60,72 C56,72 54,75 54,77 C54,80 57,81 60,81 C63,81 66,80 66,77 C66,75 64,72 60,72 Z" android:fillType="evenOdd"/>
</vector>
`;

const shortcutsXml = (pkg) => {
  const one = (id, icon, label, query) => `  <shortcut android:shortcutId="${id}" android:enabled="true" android:icon="@drawable/ic_bao_tile"
      android:shortcutShortLabel="@string/${label}" android:shortcutLongLabel="@string/${label}">
    <intent android:action="android.intent.action.VIEW" android:targetPackage="${pkg}"
        android:targetClass="${pkg}.AssistantActivity" android:data="${SCHEME}://assistant${query}" />
  </shortcut>`;
  return `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
${one('bao_voice', 'ic_bao_tile', 'bao_shortcut_voice', '?voice=1')}
${one('bao_photo', 'ic_bao_tile', 'bao_shortcut_photo', '?camera=1')}
${one('bao_write', 'ic_bao_tile', 'bao_shortcut_write', '')}
</shortcuts>
`;
};

function withFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const pkg = cfg.android?.package;
      if (!pkg) throw new Error('withBaoAssistant: falta android.package');
      const root = cfg.modRequest.platformProjectRoot;
      const javaDir = path.join(root, 'app/src/main/java', ...pkg.split('.'));
      const res = path.join(root, 'app/src/main/res');
      fs.mkdirSync(javaDir, { recursive: true });
      fs.mkdirSync(path.join(res, 'drawable'), { recursive: true });
      fs.mkdirSync(path.join(res, 'xml'), { recursive: true });
      fs.writeFileSync(path.join(javaDir, 'AssistantActivity.kt'), activityKt(pkg));
      fs.writeFileSync(path.join(javaDir, 'BaoTileService.kt'), tileKt(pkg));
      fs.writeFileSync(path.join(res, 'drawable', 'ic_bao_tile.xml'), tileIcon);
      fs.writeFileSync(path.join(res, 'xml', 'bao_shortcuts.xml'), shortcutsXml(pkg));
      return cfg;
    },
  ]);
}

function withStyle(config) {
  return withAndroidStyles(config, (cfg) => {
    const styles = cfg.modResults;
    styles.resources.style = (styles.resources.style ?? []).filter((s) => s.$.name !== 'Theme.PandaGO.Assistant');
    styles.resources.style.push({
      $: { name: 'Theme.PandaGO.Assistant', parent: 'Theme.AppCompat.DayNight.NoActionBar' },
      item: [
        { $: { name: 'android:windowIsTranslucent' }, _: 'true' },
        { $: { name: 'android:windowBackground' }, _: '@android:color/transparent' },
        { $: { name: 'android:windowNoTitle' }, _: 'true' },
        { $: { name: 'android:backgroundDimEnabled' }, _: 'false' },
        { $: { name: 'android:statusBarColor' }, _: '@android:color/transparent' },
        { $: { name: 'android:navigationBarColor' }, _: '@android:color/transparent' },
        { $: { name: 'android:windowAnimationStyle' }, _: '@android:style/Animation.Translucent' },
      ],
    });
    return cfg;
  });
}

function withStrings(config) {
  return withStringsXml(config, (cfg) => {
    const add = (name, value) => {
      cfg.modResults = AndroidConfig.Strings.setStringItem([{ $: { name, translatable: 'false' }, _: value }], cfg.modResults);
    };
    add('bao_assistant_label', 'Bao');
    add('bao_process_text', 'Preguntar a Bao');
    add('bao_shortcut_voice', 'Hablar con Bao');
    add('bao_shortcut_photo', 'Traducir una foto');
    add('bao_shortcut_write', 'Preguntar a Bao');
    return cfg;
  });
}

function withManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.activity = (app.activity ?? []).filter((a) => a.$['android:name'] !== '.AssistantActivity');
    app.service = (app.service ?? []).filter((s) => s.$['android:name'] !== '.BaoTileService');

    app.activity.push({
      $: {
        'android:name': '.AssistantActivity',
        'android:label': '@string/bao_assistant_label',
        'android:theme': '@style/Theme.PandaGO.Assistant',
        'android:exported': 'true',
        'android:launchMode': 'singleTask',
        'android:taskAffinity': `${cfg.android.package}.assistant`,
        'android:excludeFromRecents': 'true',
        'android:windowSoftInputMode': 'adjustResize',
        'android:configChanges': 'keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode',
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
          category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }, { $: { 'android:name': 'android.intent.category.BROWSABLE' } }],
          data: [{ $: { 'android:scheme': SCHEME } }],
        },
        {
          action: [{ $: { 'android:name': 'android.intent.action.SEND' } }],
          category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
          data: [{ $: { 'android:mimeType': 'text/plain' } }],
        },
        {
          action: [{ $: { 'android:name': 'android.intent.action.SEND' } }],
          category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
          data: [{ $: { 'android:mimeType': 'image/*' } }],
        },
        {
          $: { 'android:label': '@string/bao_process_text' },
          action: [{ $: { 'android:name': 'android.intent.action.PROCESS_TEXT' } }],
          category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
          data: [{ $: { 'android:mimeType': 'text/plain' } }],
        },
      ],
    });

    app.service.push({
      $: {
        'android:name': '.BaoTileService',
        'android:label': '@string/bao_assistant_label',
        'android:icon': '@drawable/ic_bao_tile',
        'android:exported': 'true',
        'android:permission': 'android.permission.BIND_QUICK_SETTINGS_TILE',
      },
      'intent-filter': [{ action: [{ $: { 'android:name': 'android.service.quicksettings.action.QS_TILE' } }] }],
    });

    // Atajos del icono (en la actividad principal, la del lanzador).
    const main = AndroidConfig.Manifest.getMainActivityOrThrow(cfg.modResults);
    main['meta-data'] = (main['meta-data'] ?? []).filter((m) => m.$['android:name'] !== 'android.app.shortcuts');
    main['meta-data'].push({ $: { 'android:name': 'android.app.shortcuts', 'android:resource': '@xml/bao_shortcuts' } });
    return cfg;
  });
}

module.exports = function withBaoAssistant(config) {
  return withManifest(withStrings(withStyle(withFiles(config))));
};
