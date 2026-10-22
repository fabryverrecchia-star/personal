<?php
/**
 * Search form.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

$orbe_id = wp_unique_id( 'search-' );
?>
<form role="search" method="get" class="search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label class="screen-reader-text" for="<?php echo esc_attr( $orbe_id ); ?>"><?php esc_html_e( 'Search for:', 'orbe' ); ?></label>
	<input type="search" id="<?php echo esc_attr( $orbe_id ); ?>" class="search-form__field" placeholder="<?php esc_attr_e( 'Search…', 'orbe' ); ?>" value="<?php echo esc_attr( get_search_query() ); ?>" name="s">
	<button type="submit" class="search-form__submit link"><?php esc_html_e( 'Search', 'orbe' ); ?></button>
</form>
