<?php
function cercoeinformo_limit_contact_form_assets() {
    if (is_page('contatti')) {
        return;
    }

    wp_dequeue_style('contact-form-7');
    wp_dequeue_script('contact-form-7');
    wp_dequeue_script('swv');
}
add_action('wp_enqueue_scripts', 'cercoeinformo_limit_contact_form_assets', 1000);

function cercoeinformo_contact_form_elements($html) {
    if (!is_page('contatti') || !is_string($html) || $html === '') {
        return $html;
    }

    $html = str_replace(
        'Ho letto e accetto la <a href="/privacy/" target="_blank">Privacy Policy</a>.',
        'Dichiaro di aver letto la <a href="/privacy/" target="_blank">Privacy Policy</a>.',
        $html
    );

    $rules = array(
        'your-name' => array('minlength' => 2, 'maxlength' => 60),
        'your-email' => array('maxlength' => 150),
        'your-subject' => array('minlength' => 3, 'maxlength' => 120),
        'your-message' => array('minlength' => 10, 'maxlength' => 2000),
    );

    foreach ($rules as $name => $attributes) {
        $pattern = '/(<(?:input|textarea)\\b(?=[^>]*\\bname=["\\\']' . preg_quote($name, '/') . '["\\\'])[^>]*)(>)/i';
        $html = preg_replace_callback($pattern, function($matches) use ($attributes) {
            $tag = $matches[1];
            foreach ($attributes as $attribute => $value) {
                $tag = preg_replace('/\\s' . preg_quote($attribute, '/') . '=["\\\'][^"\\\']*["\\\']/i', '', $tag);
                $tag .= ' ' . $attribute . '="' . esc_attr((string) $value) . '"';
            }
            return $tag . $matches[2];
        }, $html, 1);
    }

    if (strpos($html, 'name="ci_company_website"') === false) {
        $honeypot = '<div aria-hidden="true" style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;">'
            . '<label for="ci-company-website">Lascia vuoto questo campo</label>'
            . '<input type="text" id="ci-company-website" name="ci_company_website" value="" tabindex="-1" autocomplete="off">'
            . '</div>';

        $submit_position = stripos($html, '<input', stripos($html, 'wpcf7-submit'));
        if ($submit_position !== false) {
            $html = substr($html, 0, $submit_position) . $honeypot . substr($html, $submit_position);
        } else {
            $html .= $honeypot;
        }
    }

    return $html;
}
add_filter('wpcf7_form_elements', 'cercoeinformo_contact_form_elements', 50);

function cercoeinformo_contact_value($name) {
    if (!isset($_POST[$name])) {
        return '';
    }

    $value = wp_unslash($_POST[$name]);
    if (is_array($value)) {
        return '';
    }

    return trim((string) $value);
}

function cercoeinformo_tag_name($tag) {
    if (is_object($tag) && isset($tag->name)) {
        return (string) $tag->name;
    }
    if (is_array($tag) && isset($tag['name'])) {
        return (string) $tag['name'];
    }
    return '';
}

function cercoeinformo_strlen($value) {
    $value = wp_strip_all_tags((string) $value);
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function cercoeinformo_validate_contact_field($result, $tag) {
    $name = cercoeinformo_tag_name($tag);
    if (!in_array($name, array('your-name', 'your-email', 'your-subject', 'your-message'), true)) {
        return $result;
    }

    $value = cercoeinformo_contact_value($name);
    $length = cercoeinformo_strlen($value);

    if ($name === 'your-name') {
        if ($length < 2) {
            $result->invalidate($tag, 'Inserisci un nome di almeno 2 caratteri.');
        } elseif ($length > 60) {
            $result->invalidate($tag, 'Il nome può contenere al massimo 60 caratteri.');
        }
    }

    if ($name === 'your-email' && $length > 150) {
        $result->invalidate($tag, 'L’indirizzo email può contenere al massimo 150 caratteri.');
    }

    if ($name === 'your-subject') {
        if ($length < 3) {
            $result->invalidate($tag, 'Inserisci un oggetto di almeno 3 caratteri.');
        } elseif ($length > 120) {
            $result->invalidate($tag, 'L’oggetto può contenere al massimo 120 caratteri.');
        }
    }

    if ($name === 'your-message') {
        if ($length < 10) {
            $result->invalidate($tag, 'Scrivi un messaggio di almeno 10 caratteri.');
        } elseif ($length > 2000) {
            $result->invalidate($tag, 'Il messaggio può contenere al massimo 2000 caratteri.');
        } else {
            preg_match_all('~(?:https?://|www\\.)[^\\s<]+~iu', $value, $links);
            if (isset($links[0]) && count($links[0]) > 3) {
                $result->invalidate($tag, 'Per favore inserisci al massimo 3 link nel messaggio.');
            }
        }
    }

    return $result;
}
add_filter('wpcf7_validate_text', 'cercoeinformo_validate_contact_field', 20, 2);
add_filter('wpcf7_validate_text*', 'cercoeinformo_validate_contact_field', 20, 2);
add_filter('wpcf7_validate_email', 'cercoeinformo_validate_contact_field', 20, 2);
add_filter('wpcf7_validate_email*', 'cercoeinformo_validate_contact_field', 20, 2);
add_filter('wpcf7_validate_textarea', 'cercoeinformo_validate_contact_field', 20, 2);
add_filter('wpcf7_validate_textarea*', 'cercoeinformo_validate_contact_field', 20, 2);

function cercoeinformo_contact_honeypot_spam($spam, $submission = null) {
    if ($spam) {
        return true;
    }

    $honeypot = cercoeinformo_contact_value('ci_company_website');
    if ($honeypot !== '') {
        if (is_object($submission) && method_exists($submission, 'add_spam_log')) {
            $submission->add_spam_log(array(
                'agent' => 'cercoeinformo_honeypot',
                'reason' => 'Campo honeypot compilato.',
            ));
        }
        return true;
    }

    return false;
}
add_filter('wpcf7_spam', 'cercoeinformo_contact_honeypot_spam', 20, 2);
