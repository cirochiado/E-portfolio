<?php if (!defined('ABSPATH')) { exit; } ?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#main-content">Salta al contenuto</a>
<div class="shell">
<header class="header">
  <a class="logo" href="<?php echo esc_url(home_url('/')); ?>">
    <img src="<?php echo cercoeinformo_img('logo-cerco-e-informo.png'); ?>" alt="<?php bloginfo('name'); ?>" width="467" height="157" decoding="async">
  </a>

  <button class="menu-btn" type="button" aria-controls="main-navigation" aria-expanded="false">Menu</button>

  <nav class="nav" id="main-navigation" aria-label="Menu principale">
    <a class="<?php echo esc_attr(cercoeinformo_active('home')); ?>"<?php echo cercoeinformo_current_attr('home'); ?> href="<?php echo esc_url(home_url('/')); ?>">Home</a>
    <a class="<?php echo esc_attr(cercoeinformo_active('chi-sono')); ?>"<?php echo cercoeinformo_current_attr('chi-sono'); ?> href="<?php echo esc_url(home_url('/chi-sono/')); ?>">Chi sono</a>
    <a class="<?php echo esc_attr(cercoeinformo_active('servizi')); ?>"<?php echo cercoeinformo_current_attr('servizi'); ?> href="<?php echo esc_url(home_url('/servizi/')); ?>">Servizi</a>
    <a class="<?php echo esc_attr(cercoeinformo_active('quaderno')); ?>"<?php echo cercoeinformo_current_attr('quaderno'); ?> href="<?php echo esc_url(home_url('/quaderno/')); ?>">Quaderno</a>
    <a class="<?php echo esc_attr(cercoeinformo_active('contatti')); ?>"<?php echo cercoeinformo_current_attr('contatti'); ?> href="<?php echo esc_url(home_url('/contatti/')); ?>">Contatti</a>
  </nav>
</header>
