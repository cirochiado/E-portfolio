<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tzm_result( bool $ok, string $text, int $http = 200, array $data = [], array $errors = [], string $reference = '' ): array {
    return ['ok'=>$ok,'text'=>$text,'http'=>$http,'data'=>$data,'errors'=>$errors,'reference'=>$reference];
}

function tzm_process( array $post, array $server ): array {
    if(($server['REQUEST_METHOD']??'')!=='POST') return tzm_result(false,'Metodo non consentito.',405);
    if(!tzm_ready()) return tzm_result(false,'Il modulo è temporaneamente indisponibile. Puoi contattarci via email o telefono.',503);
    if((int)($server['CONTENT_LENGTH']??0)>24000) return tzm_result(false,'La richiesta supera la dimensione consentita.',413);

    $checked=tzm_validate($post);
    $data=$checked['data'];

    if(!tzm_origin_ok($server)) return tzm_result(false,'Apri il modulo direttamente da questo sito e riprova.',403,$data);

    $nonce=tzm_scalar($post,'tz_contact_nonce',128);
    $token=tzm_scalar($post,'tzm_token',180);
    $token_state=tzm_check_token($token);

    if(!wp_verify_nonce($nonce,'tzm_contact') || $token_state==='expired') {
        return tzm_result(false,'Il modulo è scaduto. I dati sono rimasti qui: controllali e invia di nuovo.',403,$data);
    }

    if($token_state==='fast') {
        $r=tzm_result(false,'Attendi un paio di secondi, poi invia la richiesta.',429,$data);
        $r['retry_after']=2;
        return $r;
    }

    if(!empty($post['tz_hp'])) {
        return tzm_result(false,'Non è stato possibile inviare la richiesta. Lascia vuoto il campo di controllo o contattaci via email.',422,$data);
    }

    $request_key=tzm_digest($token,'request');
    $content_hash=tzm_digest(wp_json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),'content');
    $old=tzm_find_request($request_key);

    if($old) {
        if(!hash_equals($old['content_hash'],$content_hash)) {
            return tzm_result(false,'Questo modulo è già stato usato. Controlla i dati e invia la nuova richiesta.',409,$data);
        }
        return tzm_received($old,true);
    }

    $network=tzm_client_key($server);
    if(!tzm_rate(tzm_digest($network,'attempts'),10)) {
        return tzm_result(false,'Hai effettuato diversi tentativi. Attendi 10 minuti o scrivici direttamente via email.',429,$data);
    }

    if($checked['errors']) {
        return tzm_result(false,'Controlla i campi indicati. I dati già inseriti sono rimasti nel modulo.',422,$data,$checked['errors']);
    }

    $duplicate=tzm_recent_duplicate($content_hash);
    if($duplicate) return tzm_received($duplicate,true);

    if(!tzm_rate(tzm_digest($network,'accepted-network'),3) || !tzm_rate(tzm_digest(gmdate('Y-m-d').'|'.strtolower($data['email']),'accepted-email'),3)) {
        return tzm_result(false,'Sono già state inviate più richieste ravvicinate. Attendi 10 minuti o usa email e telefono.',429,$data);
    }

    $stored=tzm_store($data,$request_key,$content_hash);
    if(isset($stored['error'])) {
        return tzm_result(false,'Non siamo riusciti a registrare la richiesta. I dati sono rimasti qui: riprova oppure scrivici via email.',503,$data);
    }

    if($stored['inserted']) tzm_notify($stored['row']);
    return tzm_received($stored['row'],!$stored['inserted']);
}

function tzm_received( array $row, bool $duplicate = false ): array {
    $result = tzm_result(true,'Richiesta inviata correttamente. Ti risponderemo al più presto.',200,[],[], '');
    if($row['request_type']==='prenotazione') {
        $result['note']='La richiesta non costituisce conferma della prenotazione: attendi la nostra risposta.';
    }
    return $result;
}

function tzm_contact_request(): void {
    if(!is_page('contatti')) return;

    if(!defined('DONOTCACHEPAGE')) define('DONOTCACHEPAGE',true);
    nocache_headers();
    if(!headers_sent()) header('Referrer-Policy: strict-origin-when-cross-origin');

    if(($_SERVER['REQUEST_METHOD']??'GET')!=='POST') return;
    if(tzm_scalar($_POST,'action',80)!=='tiziano_contact') return;

    $result=tzm_process($_POST,$_SERVER);
    if($result['http']===429 && !headers_sent()) {
        header('Retry-After: '.(int)($result['retry_after']??600));
    }

    if(stripos((string)($_SERVER['HTTP_ACCEPT']??''),'application/json')!==false) {
        $result['token']=tzm_token();
        $result['nonce']=wp_create_nonce('tzm_contact');
        wp_send_json($result,$result['http']);
    }

    $GLOBALS['tzm_form_result']=$result;
    status_header($result['http']);
}

function tzm_enqueue(): void {
    if(!is_page('contatti')) return;
    wp_enqueue_script('tzm-form',plugins_url('assets/form.js',TZM_FILE),[],null,true);
}

function tzm_initial_type( array $query, string $method = 'GET' ): string {
    if ( $method !== 'GET' || ! isset( $query['tipo'] ) || ! is_string( $query['tipo'] ) ) return 'informazioni';
    if ( strlen( $query['tipo'] ) > 32 ) return 'informazioni';
    $type = wp_unslash( $query['tipo'] );
    return array_key_exists( $type, tzm_types() ) ? $type : 'informazioni';
}
