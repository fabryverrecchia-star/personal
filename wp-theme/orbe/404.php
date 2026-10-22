<?php
/**
 * Not found.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<section class="not-found container">
	<p class="label"><?php esc_html_e( 'Error 404', 'orbe' ); ?></p>
	<h1 class="display not-found__title" data-reveal="lines"><?php esc_html_e( 'This page drifted away.', 'orbe' ); ?></h1>
	<p><a class="link" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to the home page', 'orbe' ); ?></a></p>
	<?php get_search_form(); ?>
</section>
<?php
get_footer();
