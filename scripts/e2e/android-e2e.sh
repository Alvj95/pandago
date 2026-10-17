#!/usr/bin/env bash
# Prueba de extremo a extremo en un emulador Android: instala el APK publicado,
# abre la app, Bao Asistente (ventana transparente) y el chat libre, escribe
# preguntas y lee lo que aparece en pantalla. Guarda capturas en e2e-out/.
set -u
OUT=e2e-out
mkdir -p "$OUT"
PKG=app.pandago

shot() { adb exec-out screencap -p > "$OUT/$1.png" 2>/dev/null || true; }
texts() {
  # Todo el texto visible (vistas de React Native incluidas).
  adb shell uiautomator dump /sdcard/ui.xml > /dev/null 2>&1
  adb shell cat /sdcard/ui.xml > "$OUT/$1.xml" 2>/dev/null
  echo "----- Pantalla «$1» -----"
  python3 - "$OUT/$1.xml" <<'PY'
import re, sys, html
xml = open(sys.argv[1], encoding='utf-8', errors='ignore').read()
seen = []
for m in re.finditer(r'(?:text|content-desc)="([^"]+)"', xml):
    t = html.unescape(m.group(1)).strip()
    if t and t not in seen:
        seen.append(t)
print('\n'.join(seen[:80]) or '(nada visible)')
PY
}
tap_input() {
  # Toca el primer campo de texto (EditText) de la pantalla.
  adb shell uiautomator dump /sdcard/ui.xml > /dev/null 2>&1
  adb shell cat /sdcard/ui.xml > "$OUT/input.xml"
  python3 - "$OUT/input.xml" <<'PY' > "$OUT/tap.txt"
import re, sys
xml = open(sys.argv[1], encoding='utf-8', errors='ignore').read()
m = re.search(r'class="android.widget.EditText"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml)
print('' if not m else f"{(int(m.group(1))+int(m.group(3)))//2} {(int(m.group(2))+int(m.group(4)))//2}")
PY
  local xy; xy=$(cat "$OUT/tap.txt")
  if [ -n "$xy" ]; then adb shell input tap $xy; sleep 1; return 0; fi
  echo "(no se encontró el campo de texto)"; return 1
}
type_text() { adb shell input text "$1"; sleep 1; adb shell input keyevent 66; }

echo "== Instalando el APK"
adb install -r app.apk
adb shell pm grant $PKG android.permission.RECORD_AUDIO || true
adb shell pm grant $PKG android.permission.CAMERA || true
adb logcat -c

echo "== 1) Abrir la app"
adb shell am start -n $PKG/.MainActivity
sleep 35
texts 1-app; shot 1-app

echo "== 2) Bao Asistente con una pregunta (enlace del widget)"
adb shell am start -a android.intent.action.VIEW -d "pandago-bao://assistant?text=%C2%BFC%C3%B3mo%20se%20dice%20gracias%3F"
sleep 30
texts 2-asistente-pregunta; shot 2-asistente-pregunta

echo "== 3) Bao Asistente: escribir otra pregunta"
if tap_input; then type_text "como%sse%sdice%sbuenos%sdias"; sleep 25; fi
texts 3-asistente-escrito; shot 3-asistente-escrito
adb shell input keyevent 4; sleep 2

echo "== 4) Asistente abierto en frío (sin la app abierta antes)"
adb shell am force-stop $PKG
sleep 2
adb shell am start -a android.intent.action.VIEW -d "pandago-bao://assistant?text=%E4%BD%A0%E5%A5%BD%E5%90%97"
sleep 40
texts 4-asistente-frio; shot 4-asistente-frio
adb shell input keyevent 4; sleep 2

echo "== 5) Chat libre con Bao"
adb shell am start -a android.intent.action.VIEW -d "pandago://free-chat" $PKG
sleep 20
if tap_input; then type_text "hola%scomo%sestas"; sleep 25; fi
texts 5-chat; shot 5-chat

echo "== 6) Prueba de micrófono (comprueba la conexión con el servidor)"
adb shell am start -a android.intent.action.VIEW -d "pandago://mic-test" $PKG
sleep 15
texts 6-mic-test; shot 6-mic-test

echo "== Registro (errores de JavaScript y red)"
adb logcat -d -s ReactNativeJS:V ReactNative:W AndroidRuntime:E OkHttp:V | tail -n 120 | tee "$OUT/logcat.txt"
