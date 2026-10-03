<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tzm_types(): array {
    return [
        'informazioni' => 'Informazioni',
        'prenotazione' => 'Prenotazione lavaggio interni',
        'parcheggio'   => 'Parcheggio',
        'convenzioni'  => 'Convenzioni / Aziende',
        'segnalazione' => 'Segnalazione / Altro',
    ];
}
function tzm_now(): int { return time(); }
function tzm_text_length( string $value ): int {
    $converted = function_exists('iconv') ? iconv( 'UTF-8', 'UTF-16LE', $value ) : false;
    return false !== $converted ? (int) ( strlen( $converted ) / 2 ) : strlen( $value );
}
function tzm_scalar( array $input, string $key, int $byte_limit = 16000 ): string {
    if ( ! isset( $input[$key] ) || ! is_string( $input[$key] ) ) { return ''; }
    $value = wp_unslash( $input[$key] );
    if ( strlen( $value ) > $byte_limit ) { return ''; }
    return wp_check_invalid_utf8( $value, true );
}
function tzm_token( ?int $now = null ): string {
    $issued = $now ?? tzm_now();
    $body = bin2hex( random_bytes( 16 ) ) . '.' . $issued;
    return $body . '.' . hash_hmac( 'sha256', $body, wp_salt( 'nonce' ) );
}
function tzm_check_token( string $token, ?int $now = null ): string {
    $now = $now ?? tzm_now();
    if ( ! preg_match( '/^([a-f0-9]{32})\.([0-9]{10})\.([a-f0-9]{64})$/D', $token, $parts ) ) { return 'expired'; }
    $expected = hash_hmac( 'sha256', $parts[1] . '.' . $parts[2], wp_salt( 'nonce' ) );
    if ( ! hash_equals( $expected, $parts[3] ) ) { return 'expired'; }
    $age = $now - (int) $parts[2];
    if ( $age < 0 || $age > 2 * HOUR_IN_SECONDS ) { return 'expired'; }
    return $age < 2 ? 'fast' : 'valid';
}
function tzm_validate( array $input ): array {
    $errors = []; $data = [];
    $limits = ['nome'=>80, 'email'=>254, 'telefono'=>40, 'messaggio'=>3000, 'tipo'=>32];
    foreach ( $limits as $key => $limit ) {
        $raw = tzm_scalar( $input, $key );
        if ( isset( $input[$key] ) && ( ! is_string($input[$key]) || strlen( (string)$input[$key] ) > 16000 ) ) {
            $errors[$key] = 'Il valore inviato non è valido.';
        }
        if ( tzm_text_length( trim($raw) ) > $limit ) { $errors[$key] = 'Usa al massimo ' . $limit . ' caratteri.'; }
        if ( 'messaggio' === $key ) {
            $data[$key] = trim( sanitize_textarea_field( $raw ) );
        } else {
            $data[$key] = trim( sanitize_text_field( $raw ) );
        }

        if ( in_array( $key, ['nome','email','telefono'], true ) && preg_match('/[\r\n\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $raw) ) {
            $errors[$key] = 'Rimuovi gli a capo e i caratteri di controllo da questo campo.';
        }
        if ( 'email' === $key && ( trim($raw) !== $data[$key] || ! is_email($data[$key]) ) ) {
            $errors[$key] = 'Inserisci un indirizzo email valido, ad esempio nome@dominio.it.';
        }
    }
    if ( '' === $data['nome'] ) { $errors['nome'] = 'Inserisci il tuo nome.'; }
    if ( '' === $data['messaggio'] ) { $errors['messaggio'] = 'Scrivi la tua richiesta.'; }
    if ( ! array_key_exists( $data['tipo'], tzm_types() ) ) { $errors['tipo'] = 'Scegli una delle tipologie proposte.'; }
    if ( '' !== $data['telefono'] ) {
        $digits = preg_replace('/\D/', '', $data['telefono']);
        if ( ! preg_match('/^\+?[0-9 ()\.\-]+$/D', $data['telefono']) || strlen($digits) < 7 || strlen($digits) > 15 ) {
            $errors['telefono'] = 'Inserisci da 7 a 15 cifre, con eventuale + iniziale, spazi, parentesi o trattini. Oppure lascia vuoto.';
        }
    }
    return ['data'=>$data, 'errors'=>$errors];
}
function tzm_digest( string $text, string $purpose ): string {
    return hash_hmac( 'sha256', $purpose . '|' . $text, wp_salt( 'auth' ) );
}
function tzm_client_key( array $server ): string {
    $ip = isset($server['REMOTE_ADDR']) && is_string($server['REMOTE_ADDR']) ? $server['REMOTE_ADDR'] : '';
    if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) { $ip = 'unknown'; }
    return tzm_digest( gmdate('Y-m-d', tzm_now()) . '|' . $ip, 'rate-network' );
}
function tzm_origin_ok( array $server ): bool {
    if ( empty($server['HTTP_ORIGIN']) ) { return true; }
    if ( ! is_string($server['HTTP_ORIGIN']) ) { return false; }
    $origin = wp_parse_url($server['HTTP_ORIGIN']); $own = wp_parse_url(home_url('/'));
    if ( ! is_array($origin) || ! is_array($own) ) { return false; }
    return strtolower($origin['host'] ?? '') === strtolower($own['host'] ?? '')
        && ($origin['scheme'] ?? '') === ($own['scheme'] ?? '')
        && ($origin['port'] ?? null) === ($own['port'] ?? null);
}
