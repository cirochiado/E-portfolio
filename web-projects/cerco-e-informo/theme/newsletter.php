<?php
add_filter('mailpoet_display_custom_fonts', '__return_false');

function cercoeinformo_remove_mailpoet_external_fonts() {
    foreach (array('mailpoet_custom_fonts_0', 'mailpoet_custom_fonts_1', 'mailpoet_custom_fonts_2') as $handle) {
        wp_dequeue_style($handle);
        wp_deregister_style($handle);
    }
}
add_action('wp_enqueue_scripts', 'cercoeinformo_remove_mailpoet_external_fonts', 1000);

function cercoeinformo_configure_mailpoet_privacy() {
    if (get_option('cercoeinformo_mailpoet_privacy_done') === '1') {
        return;
    }

    if (!class_exists('\\MailPoet\\Settings\\SettingsController')) {
        return;
    }

    try {
        $settings = \MailPoet\Settings\SettingsController::getInstance();
        $settings->set('signup_confirmation.enabled', '1');
        $settings->set('tracking.level', 'basic');
        update_option('cercoeinformo_mailpoet_privacy_done', '1', false);
    } catch (\Throwable $error) {
    }
}
add_action('mailpoet_initialized', 'cercoeinformo_configure_mailpoet_privacy', 20);
add_action('init', 'cercoeinformo_configure_mailpoet_privacy', 99);

add_action('after_switch_theme', function() {
    delete_option('cercoeinformo_mailpoet_privacy_done');
});

add_filter('wp_resource_hints', function($urls, $relation_type) {
    if (!in_array($relation_type, array('dns-prefetch', 'preconnect'), true)) {
        return $urls;
    }

    return array_values(array_filter($urls, function($url) {
        $value = is_array($url) ? ($url['href'] ?? '') : $url;
        return strpos((string) $value, 'fonts.googleapis.com') === false
            && strpos((string) $value, 'fonts.gstatic.com') === false;
    }));
}, 1000, 2);

function cercoeinformo_newsletter_consent_markup() {
    $privacy_url = esc_url(home_url('/privacy/'));
    return '<div class="mailpoet_paragraph ci-newsletter-consent-wrap">'
        . '<label class="ci-newsletter-consent">'
        . '<input type="checkbox" name="ci_newsletter_privacy_consent" value="1" required aria-required="true">'
        . '<span>Ho letto la <a href="' . $privacy_url . '">Privacy Policy</a> e acconsento a ricevere la newsletter e le comunicazioni informative di Cerco e Informo. Posso revocare il consenso in qualsiasi momento.</span>'
        . '</label>'
        . '<span class="ci-newsletter-consent-error" data-newsletter-consent-error aria-live="polite"></span>'
        . '<input type="hidden" name="ci_newsletter_consent_date" value="2026-09-21">'
        . '</div>';
}

function cercoeinformo_render_mailpoet_form($form_id = 1) {
    if (!shortcode_exists('mailpoet_form')) {
        return '';
    }

    $html = do_shortcode('[mailpoet_form id="' . absint($form_id) . '"]');
    if ($html === '' || strpos($html, 'ci_newsletter_privacy_consent') !== false) {
        return $html;
    }

    $consent = cercoeinformo_newsletter_consent_markup();
    $position = strripos($html, '</form>');
    if ($position === false) {
        return $html . $consent;
    }

    return substr($html, 0, $position) . $consent . substr($html, $position);
}

add_action('mailpoet_subscription_before_subscribe', function($data, $segment_ids, $form) {
    if (is_object($form) && method_exists($form, 'id') && (int) $form->id() !== 1) {
        return;
    }

    $consent = isset($_POST['ci_newsletter_privacy_consent'])
        ? sanitize_text_field(wp_unslash($_POST['ci_newsletter_privacy_consent']))
        : '';

    if ($consent === '1') {
        return;
    }

    if (class_exists('\\MailPoet\\UnexpectedValueException')) {
        throw new \MailPoet\UnexpectedValueException('Per iscriverti devi accettare la Privacy Policy e il consenso alla newsletter.');
    }
}, 10, 3);

function cercoeinformo_is_mailpoet_technical_page() {
    if (!isset($_GET['mailpoet_page'])) {
        return false;
    }

    $mailpoet_page = sanitize_key(wp_unslash($_GET['mailpoet_page']));
    return in_array($mailpoet_page, array('subscriptions', 'captcha'), true);
}

add_filter('wp_robots', function($robots) {
    if (cercoeinformo_is_mailpoet_technical_page()) {
        unset($robots['index']);
        $robots['noindex'] = true;
        $robots['noarchive'] = true;
    }
    return $robots;
}, 1100);

add_filter('wpseo_robots', function($robots) {
    if (cercoeinformo_is_mailpoet_technical_page()) {
        return 'noindex, follow, noarchive';
    }
    return $robots;
}, 1100);
