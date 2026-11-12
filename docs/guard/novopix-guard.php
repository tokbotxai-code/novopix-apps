<?php
// Zewnętrzny strażnik NovoPix (PHP, hosting strony + cron cPanel co 5 min).
// Sprawdza usługi, po 2 kolejnych porażkach wysyła mail, po odzyskaniu mail o odzyskaniu.
// Wgraj POZA public_html (np. /home/UŻYTKOWNIK/novopix-guard/). Uruchamiany tylko z CLI.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

$to   = 'contact@novopix.uk';
$from = 'guard@novopix.uk'; // nadawca z domeny hostingu (zmień, jeśli poczta tego wymaga)
$need = 2;                                    // tyle kolejnych porażek = alert
$targets = [
  'Strona novopix.uk' => 'https://novopix.uk/',
  'Skaner'            => 'https://scanner.novopix.uk/api/health',
  'Panel'             => 'https://panel.novopix.uk/api/health',
  'FridgeBite'        => 'https://fridgebite.novopix.uk/api/health',
  'PantryPal'         => 'https://pantrypal.novopix.uk/',
];
$stateFile = __DIR__ . '/state.json';
$state = is_file($stateFile) ? (json_decode((string)file_get_contents($stateFile), true) ?: []) : [];

function check(string $url): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3,
    CURLOPT_TIMEOUT => 15, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_USERAGENT => 'NovoPix-Guard/1.0']);
  curl_exec($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err = curl_error($ch);
  curl_close($ch);
  return [$code > 0 && $code < 400, $code ?: ($err ?: 'brak odpowiedzi')];
}
function notify(string $to, string $from, string $subject, string $body): void {
  $headers = "From: NovoPix Guard <$from>\r\nContent-Type: text/plain; charset=UTF-8\r\n";
  @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
}

foreach ($targets as $name => $url) {
  $s = $state[$name] ?? ['fails' => 0, 'alerted' => false, 'since' => null];
  [$ok, $info] = check($url);
  if ($ok) {
    if ($s['alerted']) notify($to, $from, "[NovoPix] Odzyskano: $name działa", "$name ($url) znów działa. Awaria od: {$s['since']}.");
    $s = ['fails' => 0, 'alerted' => false, 'since' => null];
  } else {
    $s['fails']++;
    if ($s['fails'] === 1) $s['since'] = date('Y-m-d H:i:s');
    if ($s['fails'] >= $need && !$s['alerted']) {
      $s['alerted'] = true;
      notify($to, $from, "[NovoPix] AWARIA: $name nie odpowiada", "$name ($url) nie odpowiada od {$s['since']} (ostatni wynik: $info). Jeśli padają wszystkie usługi naraz, sprawdź VPS.");
    }
  }
  $state[$name] = $s;
}
file_put_contents($stateFile, json_encode($state), LOCK_EX);
