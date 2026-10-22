<?php
/**
 * Large page title.
 *
 * Expects $args['title'] and optionally $args['kicker'] and $args['intro'].
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;
?>
<header class="page-header container">
	<?php if ( ! empty( $args['kicker'] ) ) : ?>
		<p class="label" data-reveal><?php echo esc_html( $args['kicker'] ); ?></p>
	<?php endif; ?>
	<h1 class="page-header__title display" data-reveal="lines"><?php echo wp_kses_post( $args['title'] ); ?></h1>
	<?php if ( ! empty( $args['intro'] ) ) : ?>
		<div class="page-header__intro lead" data-reveal><?php echo wp_kses_post( $args['intro'] ); ?></div>
	<?php endif; ?>
</header>
