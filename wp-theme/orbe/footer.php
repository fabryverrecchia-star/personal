<?php
/**
 * Footer.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

$orbe_email = orbe_opt( 'footer_email' );
?>
</main>

<footer class="site-footer">
	<div class="container">
		<div class="site-footer__cta">
			<p class="footer__cta-text display" data-reveal="lines"><?php echo esc_html( orbe_opt( 'footer_cta' ) ); ?></p>
			<?php if ( $orbe_email ) : ?>
				<a class="site-footer__email display" href="<?php echo esc_url( 'mailto:' . antispambot( $orbe_email ) ); ?>" data-cursor="<?php esc_attr_e( 'Write', 'orbe' ); ?>"><?php echo esc_html( antispambot( $orbe_email ) ); ?></a>
			<?php endif; ?>
		</div>

		<?php if ( is_active_sidebar( 'footer-1' ) ) : ?>
			<div class="site-footer__widgets">
				<?php dynamic_sidebar( 'footer-1' ); ?>
			</div>
		<?php endif; ?>

		<div class="site-footer__bar">
			<span><?php echo esc_html( orbe_copyright() ); ?></span>
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'footer',
					'menu_class'     => 'footer-menu',
					'container'      => false,
					'depth'          => 1,
					'fallback_cb'    => false,
				)
			);
			?>
			<ul class="socials">
				<?php foreach ( orbe_social_links() as $orbe_link ) : ?>
					<li><a class="link" href="<?php echo esc_url( $orbe_link['url'] ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $orbe_link['label'] ); ?></a></li>
				<?php endforeach; ?>
			</ul>
			<button type="button" class="link" data-scroll-top><?php esc_html_e( 'Back to top', 'orbe' ); ?></button>
		</div>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
