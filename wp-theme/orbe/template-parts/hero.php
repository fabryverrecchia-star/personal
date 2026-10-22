<?php
/**
 * Front page hero with the WebGL scene.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

$orbe_effect = orbe_opt( 'hero_effect' );
?>
<section class="hero hero--<?php echo esc_attr( $orbe_effect ); ?>" data-hero>
	<?php if ( 'none' !== $orbe_effect ) : ?>
		<div class="hero__gl" data-hero-gl aria-hidden="true"></div>
	<?php endif; ?>
	<div class="hero__content container">
		<h1 class="hero__title display" data-reveal="lines"><?php echo orbe_hero_title_html(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- sanitized with wp_kses in orbe_hero_title_html(). ?></h1>
		<p class="hero__subtitle" data-reveal><?php echo esc_html( orbe_opt( 'hero_subtitle' ) ); ?></p>
		<span class="hero__scroll label" data-reveal aria-hidden="true"><?php esc_html_e( 'Scroll', 'orbe' ); ?></span>
	</div>
</section>
