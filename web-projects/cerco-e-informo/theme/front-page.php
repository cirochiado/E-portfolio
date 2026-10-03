<?php get_header(); ?>
<main id="main-content" tabindex="-1">
  <section class="hero">
    <div class="grid container">
      <div>
        <h1>Coltivo curiosità,<em>condivido benessere.</em></h1>
        <p>Uno spazio di ispirazione e conoscenza per vivere in equilibrio con natura, corpo, mente e ambiente.</p>
        <div class="actions">
          <a class="btn purple" href="<?php echo esc_url(home_url('/quaderno/')); ?>">Scopri il Quaderno 📖</a>
          <a class="btn green" href="<?php echo esc_url(home_url('/servizi/')); ?>">Esplora i Servizi 🍃</a>
        </div>
      </div>
      <div class="hero-photo hero-photo--chi">
        <div class="photo-blob chi-photo home-chi-photo home-hero-clean">
          <img src="<?php echo esc_url(cercoeinformo_img('home-hero.png')); ?>" alt="Persona al tramonto con le braccia alzate e uccelli in volo" width="536" height="500" loading="eager" decoding="async" fetchpriority="high">
        </div>
      </div>
    </div>
  </section>

  <section class="section center">
    <div class="container">
      <h2 class="title">Il cuore di <?php echo cercoeinformo_brand_name(); ?></h2>
      <p class="lead">
        Cerco informazioni con curiosità e le trasformo in spunti pratici per il benessere quotidiano:
        <span class="highlight-teal">natura</span>, <span class="highlight-purple">energia</span>,
        alimentazione consapevole, tecnologie sostenibili e crescita personale.
      </p>

      <div class="card-grid">
        <article class="info-card" style="--soft:#e9f2db;--accent:#c8e2af">
          <div class="icon">🌿</div>
          <h3>Natura</h3>
          <p>Spunti e rimedi naturali per prenderti cura di te e del pianeta.</p>
        </article>

        <article class="info-card" style="--soft:#efe0fa;--accent:#d7bdea">
          <div class="icon">⚡</div>
          <h3>Energia</h3>
          <p>Idee e pratiche per ritrovare vitalità e benessere ogni giorno.</p>
        </article>

        <article class="info-card" style="--soft:#ffe5db;--accent:#ffc4b5">
          <div class="icon">♡</div>
          <h3>Curiosità</h3>
          <p>Informazioni utili, consigli e riflessioni per nutrire la mente.</p>
        </article>

        <article class="info-card" style="--soft:#dff5f3;--accent:#99dbd6">
          <div class="icon">🍃</div>
          <h3>Consapevolezza</h3>
          <p>Scelte quotidiane per un futuro più sostenibile e armonioso.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="blog-head">
        <h2 class="title">Dal mio Quaderno <span class="heart">♡</span></h2>
        <a class="btn orange" href="<?php echo esc_url(home_url('/quaderno/')); ?>">Vai al Quaderno →</a>
      </div>

      <div class="blog-cards">
        <?php
          $recent_posts = new WP_Query(array(
            'post_type' => 'post',
            'posts_per_page' => 3,
            'ignore_sticky_posts' => true
          ));

          if ($recent_posts->have_posts()) :
            while ($recent_posts->have_posts()) : $recent_posts->the_post();
              $cats = get_the_category();
              $cat_name = !empty($cats) ? $cats[0]->name : 'Quaderno';
        ?>
          <a class="post-card" href="<?php the_permalink(); ?>">
            <?php if (has_post_thumbnail()) : ?>
              <?php the_post_thumbnail('large', array('loading' => 'lazy', 'decoding' => 'async')); ?>
            <?php else : ?>
              <img src="<?php echo cercoeinformo_img('ref-blog-rituali.png'); ?>" alt="" width="650" height="347" loading="lazy" decoding="async">
            <?php endif; ?>
            <div class="post-body">
              <span class="cat"><?php echo esc_html($cat_name); ?></span>
              <h3><?php the_title(); ?></h3>
              <p><?php echo esc_html(cercoeinformo_excerpt(15)); ?></p>
              <span class="read">Leggi l’articolo →</span>
            </div>
          </a>
        <?php
            endwhile;
            wp_reset_postdata();
          else :
        ?>
          <a class="post-card" href="<?php echo esc_url(home_url('/quaderno/')); ?>">
            <img src="<?php echo cercoeinformo_img('ref-blog-rituali.png'); ?>" alt="" width="650" height="347" loading="lazy" decoding="async">
            <div class="post-body">
              <span class="cat">Natura e semplicità</span>
              <h3>I piccoli rituali naturali che fanno bene ogni giorno</h3>
              <p>Rallentare, osservare e riscoprire la bellezza che ci circonda.</p>
              <span class="read">Leggi l’articolo →</span>
            </div>
          </a>
          <a class="post-card" href="<?php echo esc_url(home_url('/quaderno/')); ?>">
            <img src="<?php echo cercoeinformo_img('ref-blog-alimentazione.png'); ?>" alt="" width="650" height="345" loading="lazy" decoding="async">
            <div class="post-body">
              <span class="cat">Energia</span>
              <h3>Benessere energetico: partire dall’ascolto</h3>
              <p>Un approccio delicato che mette al centro la persona.</p>
              <span class="read">Leggi l’articolo →</span>
            </div>
          </a>
          <a class="post-card" href="<?php echo esc_url(home_url('/quaderno/')); ?>">
            <img src="<?php echo cercoeinformo_img('ref-blog-energia.png'); ?>" alt="" width="650" height="347" loading="lazy" decoding="async">
            <div class="post-body">
              <span class="cat">Tecnologia</span>
              <h3>Tecnologia consapevole: usarla bene è possibile</h3>
              <p>La tecnologia può restare uno strumento utile e non un peso.</p>
              <span class="read">Leggi l’articolo →</span>
            </div>
          </a>
        <?php endif; ?>
      </div>
    </div>
  </section>

  <section class="newsletter">
    <div class="container newsletter-box">
      <img class="newsletter-girl" src="<?php echo cercoeinformo_img('newsletter-girl-ref.png'); ?>" alt="Illustrazione persona" width="205" height="220" loading="lazy" decoding="async">
      <div class="newsletter-content">
        <h2>Insieme è meglio!</h2>
        <p>Se vuoi ricevere contenuti e novità direttamente nella tua casella di posta.</p>
        <div class="newsletter-mailpoet-form">
          <?php
            if (shortcode_exists('mailpoet_form')) {
              echo cercoeinformo_render_mailpoet_form(1);
            } else {
              echo '<a class="btn teal" href="' . esc_url(home_url('/contatti/')) . '">Iscriviti alla newsletter ✉</a>';
            }
          ?>
        </div>
      </div>
      <img class="newsletter-leaves" src="<?php echo cercoeinformo_img('newsletter-leaves-ref.png'); ?>" alt="Decorazione foglie" width="225" height="225" loading="lazy" decoding="async">
    </div>
  </section>
</main>
<?php get_footer(); ?>
