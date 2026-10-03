<?php

if ( ! defined( 'ABSPATH' ) ) exit;
get_header();

$tz_phone          = tiziano_field( 'phone', '011 667 05 57' );
$tz_phone_link     = tiziano_phone_link_digits( $tz_phone );
$tz_tunnel_price   = tiziano_field( 'tunnel_price', '15 €' );
$tz_price_interni  = tiziano_field( 'price_interni', '90€' );
$tz_park_auto      = tiziano_field( 'park_auto', '150 € + IVA' );
$tz_park_moto      = tiziano_field( 'park_moto', '75 € + IVA' );
?>

<div class="page-hero">
    <div class="wrap">
      <span class="eyebrow" style="color:var(--red-bright);">Listino</span>
      <h1>Servizi e prezzi</h1>
      <p>Tutto quello che facciamo alla tua auto, con tempi e costi chiari — nessuna sorpresa alla cassa.</p>
    </div>
  </div>

  <section id="servizi">
    <div class="wrap">
      <div class="section-head reveal">
        <span class="eyebrow">01 — Lavaggio in tunnel</span>
        <h2>Sette passaggi, un solo risultato.</h2>
        <p>Il tunnel automatico segue una sequenza precisa: ecco cosa succede alla tua auto, passo per passo.</p>
      </div>
      <div class="journey reveal">
        <div class="journey-line"><div class="fill"></div></div>
        <div class="journey-steps">
          <div class="jstep"><div class="dot"></div><div class="label">Prelavaggio<br>carrozzeria</div></div>
          <div class="jstep"><div class="dot"></div><div class="label">Lava<br>cerchioni</div></div>
          <div class="jstep"><div class="dot"></div><div class="label">Schiuma<br>attiva</div></div>
          <div class="jstep"><div class="dot"></div><div class="label">Spazzole<br>high-tech</div></div>
          <div class="jstep"><div class="dot"></div><div class="label">Risciacquo<br>alta pressione</div></div>
          <div class="jstep"><div class="dot"></div><div class="label">Cera<br>protettiva</div></div>
          <div class="jstep"><div class="dot"></div><div class="label">Asciugatura<br>finale</div></div>
        </div>
      </div>
      <div class="services-grid reveal">
        <div class="card card-tunnel">
          <h3>Lavaggio in tunnel</h3>
          <span class="price-tag"><?php echo esc_html( $tz_tunnel_price ); ?></span>
          <div class="check-cols">
            <div>
              <h4>Esterno</h4>
              <ul>
                <li>Prelavaggio carrozzeria</li><li>Lava cerchioni</li><li>Schiuma</li>
                <li>Spazzole</li><li>Risciacquo alta pressione</li><li>Cera</li><li>Asciugatura</li>
              </ul>
            </div>
            <div>
              <h4>Interno rapido</h4>
              <ul>
                <li>Aspirazione rapida tappeti</li>
                <li>Aspirazione sedili e bagagliaio</li>
                <li>Pulizia cruscotto e parabrezza</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="card">
          <h3 style="font-size:20px; margin-bottom:4px; text-transform:uppercase;">Lavaggio a mano interni</h3>
          <p class="service-note">Solo su prenotazione — sedili, portiere, vani, plastiche, vetri, cruscotto, tappeti e bagagliaio.</p>
          <div class="pricing-table">
            <div class="price-row featured"><div><span class="pname">Lavaggio interni a mano</span><span class="ptime">Prezzo variabile in base al veicolo e al lavoro richiesto</span></div><div class="pval">da <?php echo esc_html($tz_price_interni); ?></div></div>
          </div>
          <a href="<?php echo esc_url( home_url( "/contatti/" ) ); ?>" class="btn btn-primary" style="width:100%; justify-content:center; margin-top:20px;">Prenota lavaggio interni</a>
        </div>
      </div>
    </div>
  </section>

  <section id="parcheggio" class="parking">
    <div class="wrap">
      <div class="reveal" style="margin-bottom:34px;">
        <span class="eyebrow">02 — Parcheggio</span>
        <h2 style="font-size:30px; margin-top:12px; text-transform:uppercase;">Posti auto e moto, riservati 7/7.</h2>
        <p style="color:var(--text-dim); margin-top:12px; max-width:600px;">Un servizio separato dal lavaggio, pensato per chi cerca un posto sicuro in zona.</p>
      </div>
      <div class="parking-photo reveal">
        <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/parcheggio-corridoio.jpg' ); ?>" alt="Corridoio del parcheggio riservato, con auto e moto parcheggiate">
      </div>
    </div>
    <div class="wrap parking-grid">
      <div class="reveal">
        <div class="parking-feats">
          <div class="pfeat"><div class="ic">◎</div><div><h3>Videosorveglianza 24/7</h3><p>Area monitorata in ogni orario, tutti i giorni della settimana.</p></div></div>
          <div class="pfeat"><div class="ic">⚭</div><div><h3>Convenzioni dedicate</h3><p>Tariffe agevolate per taxi, aziende, concessionari, officine e gommisti.</p></div></div>
        </div>
      </div>
      <div class="park-card reveal">
        <div class="eyebrow">Tariffe locazione</div>
        <div class="park-price">
          <div><strong><?php echo esc_html($tz_park_auto); ?></strong><span>al mese — auto</span></div>
          <div><strong><?php echo esc_html($tz_park_moto); ?></strong><span>al mese — moto</span></div>
        </div>
        <a href="<?php echo esc_url( home_url( "/contatti/?tipo=parcheggio" ) ); ?>#richiesta" class="btn btn-primary" style="width:100%; justify-content:center;">Richiedi disponibilità</a>
        <div class="conv-tags"><span>Taxi</span><span>Aziende</span><span>Concessionari</span><span>Carrozzieri</span><span>Officine</span><span>Gommisti</span></div>
        <a href="<?php echo esc_url( home_url( "/contatti/?tipo=convenzioni" ) ); ?>#richiesta" class="context-link">Chiedi informazioni sulle convenzioni →</a>
      </div>
    </div>
  </section>

  <section class="final-cta">
    <div class="wrap">
      <h2>Domande sul servizio giusto per te?</h2>
      <p>Chiamaci o passa da Via Tiziano 42 — ti aiutiamo a scegliere in un minuto.</p>
      <div class="ctas">
        <a href="tel:+<?php echo esc_attr( $tz_phone_link ); ?>" class="btn btn-primary">📞 Chiama ora</a>
        <a href="<?php echo esc_url( home_url( "/contatti/" ) ); ?>" class="btn btn-ghost">Vai ai contatti</a>
      </div>
    </div>
  </section>

<?php get_footer(); ?>
